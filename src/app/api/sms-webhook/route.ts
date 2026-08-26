// Twilio SMS/MMS Webhook Handler
//
//  TWILIO POST ──▶ VALIDATE SIG ──▶ DEDUP ──▶ PHONE LOOKUP ──▶ ROUTE
//       │              │              │            │              │
//       │         [bad → 403]    [dup → skip]  [unknown →     ├── HELP keyword → help text
//       │                                       reply]        ├── CONFIRM (y/n) → save/cancel
//       │                                                     └── NEW MSG → AI parse → confirm
//       │
//       └── MMS? → fetch image → AI vision parse

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import twilio from "twilio";
import { validateTwilioSignature } from "@/lib/sms/validate-twilio";
import { lookupProfileByPhone } from "@/lib/sms/phone-lookup";
import { parseMessageAI } from "@/lib/sms/ai-parser";
import { saveSession } from "@/lib/sms/save-session";
import { saveHours } from "@/lib/sms/save-hours";
import {
  getOrCreateConversation,
  setPendingConfirmation,
  resolveConversation,
} from "@/lib/sms/conversation";
import {
  CONFIRM_KEYWORDS,
  CANCEL_KEYWORDS,
  HELP_KEYWORDS,
  type ParseResult,
  type ParseMethod,
} from "@/lib/sms/types";

// Use service role client for webhook — Twilio is unauthenticated so the
// server acts as trusted admin here (signature verified separately). Falls
// back to the anon key only if the service role key isn't configured yet,
// but a real deploy MUST have SUPABASE_SERVICE_ROLE_KEY set.
function createWebhookSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function twimlResponse(message: string): NextResponse {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escapeXml(message)}</Message></Response>`;
  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const HELP_TEXT = `Conscious Speech SMS Bot - Commands:

LOG A SESSION:
"Session with [Student]: G1 8/10, G2 6/10"

LOG HOURS:
"Hours: 3.5 at [School]"
"Logged 4 hours at [School]"

CONFIRM/CANCEL:
Reply Y or N after a parse preview

You can also send a photo of a whiteboard!`;

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Parse form-encoded body (Twilio sends application/x-www-form-urlencoded)
  const formData = await req.formData();
  const params: Record<string, string> = {};
  formData.forEach((value, key) => {
    params[key] = value.toString();
  });

  const body = params.Body?.trim() || "";
  const from = params.From || "";
  const twilioSid = params.MessageSid || "";
  const numMedia = parseInt(params.NumMedia || "0", 10);

  // Validate Twilio signature
  const signature = req.headers.get("X-Twilio-Signature");
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000"}/api/sms-webhook`;

  if (!validateTwilioSignature(signature, webhookUrl, params)) {
    console.warn("[sms-webhook] Invalid Twilio signature from", from);
    return new NextResponse("Forbidden", { status: 403 });
  }

  const supabase = createWebhookSupabase();

  // Dedup: check if we've already processed this message
  if (twilioSid) {
    const { data: existing } = await supabase
      .from("sms_messages")
      .select("id")
      .eq("twilio_sid", twilioSid)
      .limit(1);

    if (existing && existing.length > 0) {
      return twimlResponse(""); // Already processed, silent
    }
  }

  // Look up sender profile
  const lookup = await lookupProfileByPhone(supabase, from);
  if (!lookup.found || !lookup.userId) {
    await logMessage(supabase, {
      twilioSid,
      direction: "inbound",
      from,
      body,
      status: "failed",
      errorMessage: "Unknown phone number",
    });
    return twimlResponse(
      lookup.reply || "I don't recognize this number. Ask your admin to add it to your profile."
    );
  }

  const userId = lookup.userId;

  // Check for help keyword
  const lowerBody = body.toLowerCase().trim();
  if (HELP_KEYWORDS.includes(lowerBody)) {
    await logMessage(supabase, {
      twilioSid,
      direction: "inbound",
      from,
      body,
      userId,
      status: "received",
      parseMethod: null,
    });
    return twimlResponse(HELP_TEXT);
  }

  // Get or create conversation
  const conversation = await getOrCreateConversation(supabase, userId);

  // Handle confirmation/cancellation if conversation is pending
  if (conversation.state === "confirming" && conversation.pending_data) {
    if (CONFIRM_KEYWORDS.includes(lowerBody)) {
      // Save the data
      const pending = conversation.pending_data as unknown as ParseResult;
      let reply = "Something went wrong saving.";
      let success = false;

      if (pending.type === "session") {
        const result = await saveSession(supabase, userId, pending.data);
        reply = result.reply;
        success = result.success;
        if (success) {
          await resolveConversation(supabase, conversation.id, "saved", result.sessionId);
        }
      } else if (pending.type === "hours") {
        const result = await saveHours(supabase, userId, pending.data);
        reply = result.reply;
        success = result.success;
        if (success) {
          await resolveConversation(supabase, conversation.id, "saved");
        }
      }

      await logMessage(supabase, {
        twilioSid,
        direction: "inbound",
        from,
        body,
        userId,
        conversationId: conversation.id,
        status: success ? "saved" : "failed",
        errorMessage: success ? undefined : reply,
        processingTimeMs: Date.now() - startTime,
      });

      return twimlResponse(reply);
    }

    if (CANCEL_KEYWORDS.includes(lowerBody)) {
      await resolveConversation(supabase, conversation.id, "cancelled");
      await logMessage(supabase, {
        twilioSid,
        direction: "inbound",
        from,
        body,
        userId,
        conversationId: conversation.id,
        status: "received",
      });
      return twimlResponse("No problem — discarded. Send a new message anytime.");
    }

    // Not a confirm/cancel — treat as a new message (overrides pending)
    await resolveConversation(supabase, conversation.id, "cancelled");
  }

  // Parse the message — AI first, regex fallback
  let imageUrl: string | undefined;
  if (numMedia > 0) {
    imageUrl = params.MediaUrl0;
  }

  let parseResult: ParseResult;
  let parseMethod: ParseMethod = "ai";
  let confidence = 0;

  try {
    const aiResult = await parseMessageAI({
      text: body || undefined,
      imageUrl,
      timeoutMs: 10000,
    });
    parseResult = aiResult.result;
    parseMethod = aiResult.method;
    confidence = aiResult.confidence;
  } catch {
    // Shouldn't happen (ai-parser catches internally) but just in case
    parseResult = {
      type: "unknown",
      reply: "I had trouble understanding that. Try: \"Session with [Student]: G1 8/10, G2 6/10\"",
    };
  }

  // If parsed successfully, set up confirmation
  if (parseResult.type !== "unknown") {
    const newConversation = await getOrCreateConversation(supabase, userId);
    await setPendingConfirmation(supabase, newConversation.id, parseResult);

    await logMessage(supabase, {
      twilioSid,
      direction: "inbound",
      from,
      body,
      mediaUrl: imageUrl,
      userId,
      conversationId: newConversation.id,
      aiParseResult: parseResult,
      aiModel: "claude-haiku-4-5-20251001",
      aiConfidence: confidence,
      parseMethod,
      status: "parsed",
      processingTimeMs: Date.now() - startTime,
    });
  } else {
    await logMessage(supabase, {
      twilioSid,
      direction: "inbound",
      from,
      body,
      mediaUrl: imageUrl,
      userId,
      parseMethod,
      status: "received",
      processingTimeMs: Date.now() - startTime,
    });
  }

  return twimlResponse(parseResult.reply);
}

// Log message to sms_messages table
interface LogMessageParams {
  twilioSid?: string;
  direction: "inbound" | "outbound";
  from: string;
  body?: string;
  mediaUrl?: string;
  userId?: string;
  conversationId?: string;
  aiParseResult?: unknown;
  aiModel?: string;
  aiConfidence?: number;
  parseMethod?: ParseMethod | null;
  status: string;
  errorMessage?: string;
  processingTimeMs?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logMessage(
  supabase: ReturnType<typeof createClient<any>>,
  params: LogMessageParams
): Promise<void> {
  const { error } = await supabase.from("sms_messages").insert({
    twilio_sid: params.twilioSid || null,
    direction: params.direction,
    from_number: params.from,
    to_number: process.env.TWILIO_PHONE_NUMBER || "",
    body: params.body || null,
    media_url: params.mediaUrl || null,
    user_id: params.userId || null,
    conversation_id: params.conversationId || null,
    ai_parse_result: params.aiParseResult || null,
    ai_model: params.aiModel || null,
    ai_confidence: params.aiConfidence ?? null,
    parse_method: params.parseMethod || null,
    status: params.status,
    error_message: params.errorMessage || null,
    processing_time_ms: params.processingTimeMs || null,
  });

  if (error) {
    console.error("[sms-webhook] Failed to log message:", error.message);
  }
}
