"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CampWaiver, { WAIVER_VERSION, isWaiverValid } from "@/components/camps/CampWaiver";

const steps = ["Child Info", "Background", "Contact", "Waiver", "Review"];
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/9B63cx0iF6Poa9IfpuaAw01";

export default function NinjaTrainingRegister() {
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    address: "",
    specialInfo: "",
    diagnosisWilling: "",
    diagnosisInfo: "",
    hasIEP: "",
    foodAllergies: "",
    anythingElse: "",
    parentName: "",
    phone: "",
    email: "",
  });
  const [waiverSignature, setWaiverSignature] = useState("");
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function next() {
    setStep((s) => Math.min(s + 1, steps.length));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  function handleSubmitAndPay() {
    setSubmitting(true);

    // Save registration data to localStorage — it will be sent to Rachel
    // via Formspree only after successful payment on the success page
    localStorage.setItem(
      "campRegistration",
      JSON.stringify({
        _subject: `🥷 Ninja Training Registration: ${form.childName}`,
        Camp: "Intuitive Ninja Training",
        "Child Name": form.childName,
        Address: form.address,
        "Special Info": form.specialInfo || "Not provided",
        "Willing to Share Diagnosis": form.diagnosisWilling || "Not provided",
        "Diagnosis Info": form.diagnosisInfo || "Not provided",
        "Has IEP": form.hasIEP || "Not provided",
        "Food Allergies": form.foodAllergies || "Not provided",
        "Additional Notes": form.anythingElse || "Not provided",
        "Parent/Guardian Name": form.parentName,
        Phone: form.phone,
        Email: form.email,
        "Waiver Version": WAIVER_VERSION,
        "Waiver Signature": waiverSignature,
        "Waiver Signed At": new Date().toISOString(),
        "Waiver Agreed": waiverAgreed ? "Yes" : "No",
      })
    );

    window.location.href = STRIPE_PAYMENT_LINK;
  }

  const inputClass =
    "w-full rounded-lg border border-olive/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-olive focus:ring-1 focus:ring-olive/30";
  const labelClass =
    "mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light";
  const radioGroupClass = "flex flex-wrap gap-3";
  const radioClass =
    "cursor-pointer rounded-full border border-olive/20 px-4 py-2 font-body text-sm text-charcoal transition-all duration-200 hover:border-olive";
  const radioActiveClass =
    "cursor-pointer rounded-full border-2 border-olive bg-olive/10 px-4 py-2 font-body text-sm font-medium text-olive";

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Nav */}
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
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Camp Info
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-28 pb-20 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-3 inline-block rounded-full bg-olive/15 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-olive">
            Registration
          </span>
          <h1 className="mb-2 font-serif text-4xl font-light text-charcoal md:text-5xl">
            Intuitive Ninja <span className="italic">Training</span>
          </h1>
          <p className="font-body text-sm text-charcoal-light">
            Summer 2026 &bull; Ages 5&ndash;12
          </p>
        </div>

        {/* Progress bar */}
        {step < steps.length && (
          <div className="mb-10">
            <div className="mb-3 flex justify-between">
              {steps.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                      i < step
                        ? "bg-olive text-white"
                        : i === step
                        ? "border-2 border-olive bg-olive/10 text-olive"
                        : "border border-olive/20 bg-cream text-charcoal-light"
                    }`}
                  >
                    {i < step ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  <span className="mt-1 font-body text-[10px] uppercase tracking-wider text-charcoal-light hidden sm:block">
                    {s}
                  </span>
                </div>
              ))}
            </div>
            <div className="h-1 rounded-full bg-olive/10">
              <div
                className="h-1 rounded-full bg-olive transition-all duration-500"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Child Info */}
        {step === 0 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              About Your Child
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Child&apos;s Full Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="First and last name"
                  value={form.childName}
                  onChange={(e) => update("childName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Street address, city, state, zip"
                  value={form.address}
                  onChange={(e) => update("address", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Anything special to know about your child?
                </label>
                <textarea
                  rows={3}
                  className={inputClass + " resize-none"}
                  placeholder="Anything that will help us create the best experience..."
                  value={form.specialInfo}
                  onChange={(e) => update("specialInfo", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                disabled={!form.childName}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Background */}
        {step === 1 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Background Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  Would you be willing to share diagnosis information?
                </label>
                <div className={radioGroupClass}>
                  {["Yes", "No", "Prefer not to say"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update("diagnosisWilling", opt)}
                      className={form.diagnosisWilling === opt ? radioActiveClass : radioClass}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {form.diagnosisWilling === "Yes" && (
                  <div className="mt-3">
                    <textarea
                      rows={2}
                      className={inputClass + " resize-none"}
                      placeholder="Please share any diagnoses..."
                      value={form.diagnosisInfo}
                      onChange={(e) => update("diagnosisInfo", e.target.value)}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  Does your child have an IEP?
                </label>
                <div className={radioGroupClass}>
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update("hasIEP", opt)}
                      className={form.hasIEP === opt ? radioActiveClass : radioClass}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Any food allergies?</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="List any food allergies or type 'None'"
                  value={form.foodAllergies}
                  onChange={(e) => update("foodAllergies", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Anything else we should know to work well with your child?
                </label>
                <textarea
                  rows={3}
                  className={inputClass + " resize-none"}
                  placeholder="Any additional information that would help us support your child..."
                  value={form.anythingElse}
                  onChange={(e) => update("anythingElse", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-olive"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Your Contact Information
            </h2>
            <div className="space-y-5">
              <div>
                <label className={labelClass}>Parent / Guardian Name</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Your full name"
                  value={form.parentName}
                  onChange={(e) => update("parentName", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Phone Number</label>
                <input
                  type="tel"
                  className={inputClass}
                  placeholder="(555) 555-5555"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Email Address</label>
                <input
                  type="email"
                  className={inputClass}
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
            </div>
            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-olive"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!form.parentName || !form.phone || !form.email}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Waiver */}
        {step === 3 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Camp Waiver
            </h2>
            <CampWaiver
              campName="Intuitive Ninja Training"
              additionalRisks="ninja-style obstacle activities, climbing, jumping, balancing, and other movement-based play"
              parentName={form.parentName}
              signature={waiverSignature}
              setSignature={setWaiverSignature}
              agreed={waiverAgreed}
              setAgreed={setWaiverAgreed}
            />
            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-olive"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!isWaiverValid({ agreed: waiverAgreed, signature: waiverSignature, parentName: form.parentName })}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 disabled:opacity-40"
              >
                Review
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
            <p className="mt-4 font-body text-[11px] text-charcoal-light/70">
              Your typed signature must match the parent/guardian name from the previous step.
            </p>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 4 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Review Your Information
            </h2>
            <div className="space-y-4">
              <ReviewItem label="Child's Name" value={form.childName} />
              <ReviewItem label="Address" value={form.address} />
              <ReviewItem label="Special Info" value={form.specialInfo} />
              <ReviewItem
                label="Diagnosis Info"
                value={
                  form.diagnosisWilling === "Yes"
                    ? form.diagnosisInfo
                    : form.diagnosisWilling || ""
                }
              />
              <ReviewItem label="IEP" value={form.hasIEP} />
              <ReviewItem label="Food Allergies" value={form.foodAllergies} />
              <ReviewItem label="Additional Notes" value={form.anythingElse} />
              <div className="my-4 h-px bg-olive/10" />
              <ReviewItem label="Parent/Guardian" value={form.parentName} />
              <ReviewItem label="Phone" value={form.phone} />
              <ReviewItem label="Email" value={form.email} />
              <div className="my-4 h-px bg-olive/10" />
              <ReviewItem label="Waiver Signed" value={waiverSignature ? `${waiverSignature} (${new Date().toLocaleDateString()})` : ""} />
            </div>

            <div className="mt-8 rounded-xl bg-olive/8 p-5">
              <p className="font-body text-sm leading-relaxed text-charcoal-light">
                By proceeding to payment, you confirm that the information above
                is accurate. After payment, Rachel will reach out to confirm
                your child&apos;s spot.
              </p>
            </div>

            {/* Drop-in option */}
            <div className="mt-5 rounded-xl border border-olive/15 bg-cream p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-olive/10">
                  <svg className="h-4 w-4 text-olive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                  </svg>
                </div>
                <div>
                  <p className="font-body text-sm font-semibold text-charcoal">
                    Drop-ins also available!
                  </p>
                  <p className="mt-1 font-body text-sm leading-relaxed text-charcoal-light">
                    Want to try a single day? Drop-ins are just <span className="font-semibold text-olive">$30 per day</span>.
                    Contact Rachel to arrange a drop-in.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-olive"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Edit Info
              </button>
              <button
                onClick={handleSubmitAndPay}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 hover:shadow-lg hover:shadow-olive/20 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Submitting...
                  </>
                ) : (
                  <>
                    Proceed to Payment
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
      <span className="w-48 flex-shrink-0 font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
        {label}
      </span>
      <span className="font-body text-sm text-charcoal">
        {value || <span className="text-charcoal-light/40">Not provided</span>}
      </span>
    </div>
  );
}
