"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const FORMSPREE_ID = "xvzngorz";

export default function NinjaTrainingUpdateInfo() {
  const [submitting, setSubmitting] = useState(false);
  const [payingFee, setPayingFee] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiverAgreed, setWaiverAgreed] = useState(false);
  const [waiverSignature, setWaiverSignature] = useState("");
  const [form, setForm] = useState({
    parentName: "",
    phone: "",
    email: "",
    childName: "",
    childDob: "",
    address: "",
    specialInfo: "",
    diagnosisInfo: "",
    hasIEP: "",
    foodAllergies: "",
    otherAllergies: "",
    medications: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    authorizedPickup: "",
    anythingElse: "",
  });

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const canSubmit =
    form.parentName &&
    form.childName &&
    form.emergencyName &&
    form.emergencyPhone &&
    waiverAgreed &&
    waiverSignature.trim().split(/\s+/).length >= 2;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          _subject: `📝 Ninja Update Info: ${form.childName}`,
          "Form Type": "Update Info (no payment)",
          Camp: "Intuitive Ninja Training",
          "Parent/Guardian Name": form.parentName,
          Phone: form.phone,
          Email: form.email,
          "Child Name": form.childName,
          "Child Date of Birth": form.childDob || "Not provided",
          Address: form.address,
          "Special Info": form.specialInfo || "Not provided",
          "Diagnosis Info": form.diagnosisInfo || "Not provided",
          "Has IEP": form.hasIEP || "Not provided",
          "Food Allergies": form.foodAllergies || "Not provided",
          "Other Allergies": form.otherAllergies || "None",
          Medications: form.medications || "None",
          "Emergency Contact Name": form.emergencyName,
          "Emergency Contact Phone": form.emergencyPhone,
          "Emergency Contact Relationship": form.emergencyRelationship,
          "Authorized Pickup": form.authorizedPickup || "Parent/guardian only",
          "Additional Notes": form.anythingElse || "Not provided",
          "Waiver Signature": waiverSignature,
          "Waiver Signed At": new Date().toISOString(),
        }),
      });
      if (!res.ok) throw new Error(`Submission failed (${res.status})`);
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  async function payRegistrationFee() {
    setPayingFee(true);
    try {
      const res = await fetch("/api/checkout/ninja", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "registration_fee_only",
          registrationFee: true,
          childName: form.childName,
          parentName: form.parentName,
          parentEmail: form.email,
          parentPhone: form.phone,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Couldn't open checkout. Please try again.");
        setPayingFee(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setPayingFee(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-olive/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-olive focus:ring-1 focus:ring-olive/30";
  const labelClass =
    "mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light";
  const sectionClass = "rounded-2xl bg-white p-8 shadow-sm md:p-10";
  const radioGroupClass = "flex flex-wrap gap-3";
  const radioClass =
    "cursor-pointer rounded-full border border-olive/20 px-4 py-2 font-body text-sm text-charcoal transition-all duration-200 hover:border-olive";
  const radioActiveClass =
    "cursor-pointer rounded-full border-2 border-olive bg-olive/10 px-4 py-2 font-body text-sm font-medium text-olive";

  return (
    <div className="min-h-screen bg-warm-white">
      <div className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
              <Image src="/Logo.png" alt="Conscious Speech Strategies" fill className="object-cover" sizes="40px" />
            </div>
            <span className="font-serif text-lg font-medium tracking-wide text-charcoal">
              Conscious Speech
            </span>
          </Link>
          <Link
            href="/camps/ninja-training"
            className="inline-flex items-center gap-2 font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-olive"
          >
            Back to Camp Info
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-28 pb-20 lg:px-8">
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-olive/15 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-olive">
            For Registered Families
          </span>
          <h1 className="mb-3 font-serif text-4xl font-light text-charcoal md:text-5xl">
            Update Your <span className="italic">Camp Info</span>
          </h1>
          <p className="font-body text-sm leading-relaxed text-charcoal-light">
            Already registered for Intuitive Ninja Training? We&apos;ve added a few
            new questions to keep your child safe. Please take a couple
            minutes to fill these out before camp begins. No payment needed
            to update info &mdash; you&apos;re already signed up. If you
            haven&apos;t paid the $30 registration fee yet (covers mask &amp;
            materials), you&apos;ll see an option to do that after submitting.
          </p>
        </div>

        {done ? (
          <div className={sectionClass + " text-center"}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-olive/15">
              <svg className="h-7 w-7 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="mb-2 font-serif text-2xl font-light text-charcoal">Thanks!</h2>
            <p className="font-body text-sm text-charcoal-light">
              We&apos;ve got your updated info.
            </p>

            <div className="mt-8 rounded-xl border border-olive/20 bg-olive/5 p-6 text-left">
              <p className="font-body text-sm font-semibold text-charcoal">
                Registration fee
              </p>
              <p className="mt-1 font-body text-sm text-charcoal-light">
                If you haven&apos;t paid the $30 one-time registration fee yet
                (covers your child&apos;s mask and materials), please pay it
                now to secure your spot.
              </p>
              <button
                onClick={payRegistrationFee}
                disabled={payingFee}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-olive px-6 py-2.5 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 disabled:opacity-40"
              >
                {payingFee ? "Opening checkout..." : "Pay $30 registration fee"}
              </button>
              <p className="mt-3 font-body text-[12px] text-charcoal-light">
                Already paid? You can ignore this and head{" "}
                <Link href="/camps/ninja-training" className="text-olive underline">
                  back to the camp page
                </Link>.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className={sectionClass + " space-y-5"}>
              <h2 className="font-serif text-2xl font-light text-charcoal">Parent &amp; Child</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Parent/Guardian Name *</label>
                  <input type="text" required className={inputClass} value={form.parentName}
                    onChange={(e) => update("parentName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input type="tel" className={inputClass} value={form.phone}
                    onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Email</label>
                <input type="email" className={inputClass} value={form.email}
                  onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Child&apos;s Full Name *</label>
                  <input type="text" required className={inputClass} value={form.childName}
                    onChange={(e) => update("childName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth</label>
                  <input type="date" className={inputClass} value={form.childDob}
                    onChange={(e) => update("childDob", e.target.value)} />
                </div>
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input type="text" className={inputClass} value={form.address}
                  onChange={(e) => update("address", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Anything special to know about your child?</label>
                <textarea rows={3} className={inputClass + " resize-none"} value={form.specialInfo}
                  onChange={(e) => update("specialInfo", e.target.value)} />
              </div>
            </div>

            <div className={sectionClass + " space-y-5"}>
              <h2 className="font-serif text-2xl font-light text-charcoal">Background &amp; Medical</h2>
              <div>
                <label className={labelClass}>Diagnosis info (optional)</label>
                <textarea rows={2} className={inputClass + " resize-none"} value={form.diagnosisInfo}
                  onChange={(e) => update("diagnosisInfo", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Does your child have an IEP?</label>
                <div className={radioGroupClass}>
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button key={opt} type="button" onClick={() => update("hasIEP", opt)}
                      className={form.hasIEP === opt ? radioActiveClass : radioClass}>{opt}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Food allergies</label>
                <input type="text" className={inputClass} value={form.foodAllergies}
                  onChange={(e) => update("foodAllergies", e.target.value)} placeholder="List or type 'None'" />
              </div>
              <div>
                <label className={labelClass}>Other allergies (medication, environmental, insect stings)</label>
                <input type="text" className={inputClass} value={form.otherAllergies}
                  onChange={(e) => update("otherAllergies", e.target.value)} placeholder="List or type 'None'" />
              </div>
              <div>
                <label className={labelClass}>Medications taken regularly</label>
                <input type="text" className={inputClass} value={form.medications}
                  onChange={(e) => update("medications", e.target.value)} placeholder="List or type 'None'" />
              </div>
            </div>

            <div className={sectionClass + " space-y-5"}>
              <h2 className="font-serif text-2xl font-light text-charcoal">Emergency &amp; Pickup</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Emergency contact name *</label>
                  <input type="text" required className={inputClass} value={form.emergencyName}
                    onChange={(e) => update("emergencyName", e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Relationship</label>
                  <input type="text" className={inputClass} value={form.emergencyRelationship}
                    onChange={(e) => update("emergencyRelationship", e.target.value)} placeholder="e.g. grandparent" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Emergency contact phone *</label>
                <input type="tel" required className={inputClass} value={form.emergencyPhone}
                  onChange={(e) => update("emergencyPhone", e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Authorized to pick up (besides you)</label>
                <input type="text" className={inputClass} value={form.authorizedPickup}
                  onChange={(e) => update("authorizedPickup", e.target.value)}
                  placeholder="Full names, comma-separated. Leave blank if parent/guardian only." />
              </div>
              <div>
                <label className={labelClass}>Anything else we should know?</label>
                <textarea rows={3} className={inputClass + " resize-none"} value={form.anythingElse}
                  onChange={(e) => update("anythingElse", e.target.value)} />
              </div>
            </div>

            <div className={sectionClass + " space-y-4"}>
              <h2 className="font-serif text-2xl font-light text-charcoal">Waiver</h2>
              <p className="font-body text-sm text-charcoal-light">
                If you haven&apos;t signed our Camp Participation Agreement &amp; Release yet,
                please review and sign below. Full waiver text is available on the main
                registration page.
              </p>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-olive/20 bg-cream/40 p-4">
                <input type="checkbox" checked={waiverAgreed}
                  onChange={(e) => setWaiverAgreed(e.target.checked)}
                  className="mt-0.5 h-4 w-4 cursor-pointer accent-olive" />
                <span className="font-body text-sm text-charcoal">
                  I am the parent or legal guardian and I agree to the Camp
                  Participation Agreement &amp; Release. *
                </span>
              </label>
              <div>
                <label className={labelClass}>Typed signature (full legal name) *</label>
                <input type="text" value={waiverSignature}
                  onChange={(e) => setWaiverSignature(e.target.value)}
                  placeholder={form.parentName || "Type your full legal name"}
                  className="w-full rounded-lg border border-olive/20 bg-cream px-4 py-3 font-body text-base italic text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-olive focus:ring-1 focus:ring-olive/30" />
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-3 font-body text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={!canSubmit || submitting}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 disabled:opacity-40">
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
