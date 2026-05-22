"use client";

/**
 * Camp participation waiver — generic template for Conscious Speech Strategies camps.
 *
 * NOTE FOR RACHEL: this is a reasonable starting template, NOT legal advice.
 * Please have your attorney and/or insurance carrier review the text before
 * relying on it for any specific liability protection.
 */

export const WAIVER_VERSION = "2026-05";

interface Props {
  campName: string;
  /** Camp-specific risks (one short sentence). E.g. "ninja-style obstacle activities and movement". */
  additionalRisks?: string;
  /** Parent/guardian name from the contact step — used as a typed-name match. */
  parentName: string;
  signature: string;
  setSignature: (v: string) => void;
  agreed: boolean;
  setAgreed: (v: boolean) => void;
}

export default function CampWaiver({
  campName,
  additionalRisks,
  parentName,
  signature,
  setSignature,
  agreed,
  setAgreed,
}: Props) {
  const today = new Date().toLocaleDateString();

  return (
    <div className="space-y-5">
      <p className="font-body text-sm text-charcoal-light">
        Please read carefully. By signing below you agree to the terms of
        participation for the <span className="font-semibold text-charcoal">{campName}</span> camp.
      </p>

      <div className="max-h-80 overflow-y-auto rounded-xl border border-sage/20 bg-cream/40 p-5 font-body text-[13px] leading-relaxed text-charcoal">
        <p className="mb-3 font-semibold">
          Conscious Speech Strategies &mdash; Camp Participation Agreement &amp; Release
        </p>
        <p className="mb-3">
          By signing below, I, the undersigned parent or legal guardian, acknowledge
          and agree to the following on behalf of myself and my child (the
          &ldquo;Participant&rdquo;) in connection with the {campName} camp (the
          &ldquo;Camp&rdquo;) operated by Conscious Speech Strategies, LLC (the
          &ldquo;Provider&rdquo;):
        </p>

        <p className="mb-3">
          <span className="font-semibold">1. Voluntary participation &amp; assumption of risk.</span>{" "}
          I understand that Camp participation is voluntary and involves activities
          such as group games, movement, indoor and outdoor play
          {additionalRisks ? `, ${additionalRisks}` : ""}. These activities carry
          inherent risks including, but not limited to, falls, scrapes, sprains,
          contact with other children, illness, and other physical or emotional
          discomfort. I voluntarily assume all such risks on behalf of my child.
        </p>

        <p className="mb-3">
          <span className="font-semibold">2. Release of liability.</span> To the
          fullest extent permitted by law, I release, waive, and hold harmless
          Conscious Speech Strategies, LLC, its owner Rachel Degani, M.S., CCC-SLP,
          its staff, contractors, agents, and any host venue from any and all
          claims, demands, damages, or causes of action arising out of or related
          to my child&apos;s participation in Camp, except where caused by gross
          negligence or willful misconduct.
        </p>

        <p className="mb-3">
          <span className="font-semibold">3. Medical authorization.</span> In the
          event of a medical emergency in which I cannot be promptly reached, I
          authorize Camp staff to seek and provide reasonable first aid and
          emergency medical care for my child, including transport to a medical
          facility. I am responsible for any associated medical costs.
        </p>

        <p className="mb-3">
          <span className="font-semibold">4. Health affirmation.</span> I affirm
          that my child is in suitable health to participate in Camp activities. I
          have disclosed any relevant medical conditions, allergies, dietary
          restrictions, behavioral considerations, and medications in this
          registration. I will keep my child home if they are exhibiting symptoms
          of communicable illness.
        </p>

        <p className="mb-3">
          <span className="font-semibold">5. Photo / media release.</span> I grant
          Conscious Speech Strategies permission to use photographs or video of my
          child taken during Camp for promotional purposes (website, social media,
          marketing materials). My child will not be identified by full name. If I
          do <span className="font-semibold">not</span> wish to grant this
          permission, I will email{" "}
          <span className="font-semibold">consciousspeech.net@gmail.com</span>{" "}
          within 48 hours of registration to opt out.
        </p>

        <p className="mb-3">
          <span className="font-semibold">6. Cancellation &amp; refund policy.</span>{" "}
          I have reviewed the Camp cancellation and refund policy. Tuition is
          non-refundable within 14 days of the Camp start date unless otherwise
          agreed in writing.
        </p>

        <p className="mb-3">
          <span className="font-semibold">7. Authority to sign.</span> I am the
          parent or legal guardian of the Participant and have the authority to
          enter into this agreement on their behalf.
        </p>

        <p className="mb-0">
          <span className="font-semibold">8. Electronic signature.</span> I agree
          that my typed name below constitutes a legal electronic signature under
          the federal ESIGN Act and applicable state law, equivalent to a
          handwritten signature.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sage/20 bg-cream/40 p-4">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-sage"
        />
        <span className="font-body text-sm text-charcoal">
          I am the parent or legal guardian of the Participant. I have read and
          agree to all terms of the Camp Participation Agreement &amp; Release
          above.
        </span>
      </label>

      <div>
        <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
          Typed signature (full legal name)
        </label>
        <input
          type="text"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder={parentName || "Type your full legal name"}
          className="w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-base italic text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
          autoComplete="off"
        />
        <p className="mt-1.5 font-body text-[11px] text-charcoal-light">
          Date: <span className="tabular-nums">{today}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * Validates that the waiver step is complete: checkbox checked AND signature
 * roughly matches the parent name (case-insensitive, ignoring whitespace).
 */
export function isWaiverValid({
  agreed,
  signature,
  parentName,
}: {
  agreed: boolean;
  signature: string;
  parentName: string;
}): boolean {
  if (!agreed) return false;
  const sig = signature.trim().toLowerCase().replace(/\s+/g, " ");
  const name = parentName.trim().toLowerCase().replace(/\s+/g, " ");
  if (!sig) return false;
  // Require at least a first + last name (two words)
  if (sig.split(" ").length < 2) return false;
  // Soft match — sig should match name if name was provided. If not, accept any 2+ word string.
  if (!name) return true;
  return sig === name;
}
