import { NextRequest, NextResponse } from "next/server";

/**
 * Sends an email notification to Rachel when a clinician logs a session
 * that did not occur. Uses Formspree as the email transport.
 *
 * Required env var:
 *   FORMSPREE_NO_SHOW_ID — the form id from formspree.io (e.g. "mwvnggra")
 *
 * If the env var is not set, the request returns 200 with `{ sent: false }`
 * so the front-end save flow isn't blocked. A warning is logged so we know
 * setup is incomplete.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      studentName?: string;
      sessionDate?: string;
      reason?: string;
      enteredByName?: string;
      schoolName?: string | null;
    };

    const formId = process.env.FORMSPREE_NO_SHOW_ID;
    if (!formId) {
      console.warn(
        "FORMSPREE_NO_SHOW_ID not set; skipping no-show email notification."
      );
      return NextResponse.json({ sent: false, reason: "not_configured" });
    }

    const payload = {
      _subject: `Session did not occur — ${body.studentName || "Unknown student"} (${body.sessionDate || ""})`,
      Student: body.studentName || "Unknown",
      School: body.schoolName || "—",
      "Session Date": body.sessionDate || "—",
      "Logged By": body.enteredByName || "—",
      Reason: body.reason || "(no reason given)",
      "Logged At": new Date().toLocaleString("en-US", { timeZone: "America/New_York" }),
    };

    const res = await fetch(`https://formspree.io/f/${formId}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("Formspree no-show send failed:", res.status, text);
      return NextResponse.json(
        { sent: false, reason: "formspree_failed", status: res.status },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("session-no-show route error:", err);
    return NextResponse.json(
      { sent: false, reason: "exception" },
      { status: 500 }
    );
  }
}
