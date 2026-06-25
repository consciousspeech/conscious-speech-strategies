"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import CampWaiver, { WAIVER_VERSION, isWaiverValid } from "@/components/camps/CampWaiver";

const steps = ["Weeks", "Child Info", "Background", "Contact", "Waiver", "Review"];

const weekOptions = [
  { id: 1, label: "Week 1", dates: "June 15–18" },
  { id: 2, label: "Week 2", dates: "June 22–25" },
];

// Early bird cutoff: May 10, 2026 at midnight ET
const EARLY_BIRD_CUTOFF = new Date("2026-05-10T04:00:00Z");
const EARLY_BIRD_PRICE = 275;
const REGULAR_PRICE = 300;

function useIsEarlyBird() {
  const [isEarlyBird] = useState(() => new Date() < EARLY_BIRD_CUTOFF);
  return isEarlyBird;
}

export default function MindBodySpeechRegister() {
  const isEarlyBird = useIsEarlyBird();
  const perWeekPrice = isEarlyBird ? EARLY_BIRD_PRICE : REGULAR_PRICE;
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([]);
  const [promoCode, setPromoCode] = useState("");
  const [form, setForm] = useState({
    childName: "",
    childDob: "",
    address: "",
    specialInfo: "",
    diagnoses: "",
    hasIEP: "",
    speechEvaluation: "",
    foodAllergies: "",
    medications: "",
    otherAllergies: "",
    pediatricianName: "",
    pediatricianPhone: "",
    insuranceProvider: "",
    insurancePolicy: "",
    anythingElse: "",
    emergencyName: "",
    emergencyPhone: "",
    emergencyRelationship: "",
    authorizedPickup: "",
    parentName: "",
    phone: "",
    email: "",
  });
  const [waiverSignature, setWaiverSignature] = useState("");
  const [waiverAgreed, setWaiverAgreed] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggleWeek(weekId: number) {
    setSelectedWeeks((prev) =>
      prev.includes(weekId) ? prev.filter((w) => w !== weekId) : [...prev, weekId].sort()
    );
  }

  function next() {
    setStep((s) => Math.min(s + 1, steps.length));
  }

  function back() {
    setStep((s) => Math.max(s - 1, 0));
  }

  const totalPrice = selectedWeeks.length * perWeekPrice;

  async function handleSubmitAndPay() {
    setSubmitting(true);
    const weeksLabel = selectedWeeks
      .map((id) => weekOptions.find((w) => w.id === id))
      .map((w) => `${w!.label} (${w!.dates})`)
      .join(", ");

    // Save registration data to localStorage — it will be sent to Rachel
    // via Formspree only after successful payment on the success page
    localStorage.setItem(
      "campRegistration",
      JSON.stringify({
        _subject: `🏕️ Mind Body Speech Registration: ${form.childName}`,
        Camp: "Mind Body Speech",
        "Weeks Selected": weeksLabel,
        Total: `$${totalPrice}`,
        "Child Name": form.childName,
        "Child Date of Birth": form.childDob || "Not provided",
        Address: form.address,
        "Special Info": form.specialInfo || "Not provided",
        Diagnoses: form.diagnoses || "Not provided",
        "Has IEP": form.hasIEP || "Not provided",
        "Speech/Language Evaluation": form.speechEvaluation || "Not provided",
        "Food Allergies": form.foodAllergies || "Not provided",
        Medications: form.medications || "None",
        "Other Allergies": form.otherAllergies || "None",
        "Pediatrician Name": form.pediatricianName || "Not provided",
        "Pediatrician Phone": form.pediatricianPhone || "Not provided",
        "Insurance Provider": form.insuranceProvider || "Not provided",
        "Insurance Policy #": form.insurancePolicy || "Not provided",
        "Additional Notes": form.anythingElse || "Not provided",
        "Emergency Contact Name": form.emergencyName,
        "Emergency Contact Phone": form.emergencyPhone,
        "Emergency Contact Relationship": form.emergencyRelationship,
        "Authorized Pickup": form.authorizedPickup || "Parent/guardian only",
        "Parent/Guardian Name": form.parentName,
        Phone: form.phone,
        Email: form.email,
        "Waiver Version": WAIVER_VERSION,
        "Waiver Signature": waiverSignature,
        "Waiver Signed At": new Date().toISOString(),
        "Waiver Agreed": waiverAgreed ? "Yes" : "No",
      })
    );

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: selectedWeeks.length,
          selectedWeeks: weeksLabel,
          childName: form.childName,
          parentName: form.parentName,
          parentEmail: form.email,
          parentPhone: form.phone,
          promoCode: promoCode.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong creating the checkout session. Please try again.");
        setSubmitting(false);
      }
    } catch {
      alert("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30";
  const labelClass =
    "mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light";
  const radioGroupClass = "flex flex-wrap gap-3";
  const radioClass =
    "cursor-pointer rounded-full border border-sage/20 px-4 py-2 font-body text-sm text-charcoal transition-all duration-200 hover:border-sage";
  const radioActiveClass =
    "cursor-pointer rounded-full border-2 border-sage bg-sage/10 px-4 py-2 font-body text-sm font-medium text-sage-dark";

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
            href="/camps/mind-body-speech"
            className="inline-flex items-center gap-2 font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-sage-dark"
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
          <span className="mb-3 inline-block rounded-full bg-sage/15 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-sage-dark">
            Registration
          </span>
          <h1 className="mb-2 font-serif text-4xl font-light text-charcoal md:text-5xl">
            Mind. Body. <span className="italic">Speech.</span>
          </h1>
          <p className="font-body text-sm text-charcoal-light">
            Summer Camp 2026 &bull; Rising 1st&ndash;5th Graders
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
                        ? "bg-sage text-white"
                        : i === step
                        ? "border-2 border-sage bg-sage/10 text-sage-dark"
                        : "border border-sage/20 bg-cream text-charcoal-light"
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
            <div className="h-1 rounded-full bg-sage/10">
              <div
                className="h-1 rounded-full bg-sage transition-all duration-500"
                style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Week Selection */}
        {step === 0 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-2 font-serif text-2xl font-light text-charcoal">
              Choose Your Weeks
            </h2>
            <p className="mb-4 font-body text-sm text-charcoal-light">
              Select which weeks you&apos;d like your child to attend.
            </p>
            {isEarlyBird && (
              <div className="mb-6 rounded-xl bg-peach/15 px-5 py-3">
                <p className="font-body text-sm font-semibold text-charcoal">
                  🐦 Early Bird Pricing &mdash; ${EARLY_BIRD_PRICE}/week
                  <span className="ml-2 font-normal text-charcoal-light line-through">${REGULAR_PRICE}</span>
                </p>
                <p className="mt-0.5 font-body text-xs text-charcoal-light">
                  Register before May 10 to save.
                </p>
              </div>
            )}
            {!isEarlyBird && (
              <div className="mb-6 rounded-xl bg-sage/10 px-5 py-3">
                <p className="font-body text-sm font-semibold text-charcoal">
                  ${REGULAR_PRICE}/week
                </p>
              </div>
            )}
            <div className="space-y-3">
              {weekOptions.map((week) => {
                const selected = selectedWeeks.includes(week.id);
                return (
                  <button
                    key={week.id}
                    type="button"
                    onClick={() => toggleWeek(week.id)}
                    className={`flex w-full items-center gap-4 rounded-xl border-2 p-5 text-left transition-all duration-300 ${
                      selected
                        ? "border-sage bg-sage/8 shadow-sm"
                        : "border-sage/15 bg-cream hover:border-sage/40"
                    }`}
                  >
                    <div
                      className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                        selected
                          ? "border-sage bg-sage text-white"
                          : "border-sage/30 bg-white"
                      }`}
                    >
                      {selected && (
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-body text-sm font-semibold text-charcoal">
                        {week.label}
                      </p>
                      <p className="font-body text-xs text-charcoal-light">
                        {week.dates} &bull; Mon&ndash;Thu, 9am&ndash;12pm
                      </p>
                    </div>
                    <span className="font-body text-sm font-medium text-sage-dark">
                      ${perWeekPrice}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Total */}
            {selectedWeeks.length > 0 && (
              <div className="mt-6 rounded-xl bg-sage/10 px-5 py-4">
                <div className="flex items-center justify-between">
                  <span className="font-body text-sm font-medium text-charcoal">
                    {selectedWeeks.length} {selectedWeeks.length === 1 ? "week" : "weeks"} selected
                  </span>
                  <span className="font-serif text-xl font-medium text-sage-dark">
                    ${totalPrice}
                  </span>
                </div>
              </div>
            )}

            {/* Promo Code */}
            {selectedWeeks.length > 0 && (
              <div className="mt-4">
                <label className="mb-1.5 block font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                  Have a promo code?
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-sage/20 bg-cream px-4 py-3 font-body text-sm text-charcoal outline-none transition-all duration-300 placeholder:text-charcoal-light/40 focus:border-sage focus:ring-1 focus:ring-sage/30"
                  placeholder="Enter code"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
              </div>
            )}

            <div className="mt-8 flex justify-end">
              <button
                onClick={next}
                disabled={selectedWeeks.length === 0}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Child Info */}
        {step === 1 && (
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
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  className={inputClass}
                  value={form.childDob}
                  onChange={(e) => update("childDob", e.target.value)}
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
            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-sage-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!form.childName}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Background */}
        {step === 2 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Background Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  What are their diagnoses?
                </label>
                <textarea
                  rows={2}
                  className={inputClass + " resize-none"}
                  placeholder="e.g., speech delay, autism, ADHD, etc."
                  value={form.diagnoses}
                  onChange={(e) => update("diagnoses", e.target.value)}
                />
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
                <label className={labelClass}>
                  Have they been evaluated for speech or language challenges?
                </label>
                <div className={radioGroupClass}>
                  {["Yes", "No", "Not sure"].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => update("speechEvaluation", opt)}
                      className={form.speechEvaluation === opt ? radioActiveClass : radioClass}
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
                <label className={labelClass}>Other allergies (medication, environmental, insect stings)</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="List other allergies or type 'None'"
                  value={form.otherAllergies}
                  onChange={(e) => update("otherAllergies", e.target.value)}
                />
              </div>
              <div>
                <label className={labelClass}>Medications your child takes regularly</label>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="List medications or type 'None'"
                  value={form.medications}
                  onChange={(e) => update("medications", e.target.value)}
                />
              </div>

              <div className="border-t border-sage/15 pt-5 mt-2">
                <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-wider text-sage-dark">
                  Pediatrician &amp; insurance
                </p>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Pediatrician name</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Dr. Smith"
                        value={form.pediatricianName}
                        onChange={(e) => update("pediatricianName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Pediatrician phone</label>
                      <input
                        type="tel"
                        className={inputClass}
                        placeholder="(555) 555-5555"
                        value={form.pediatricianPhone}
                        onChange={(e) => update("pediatricianPhone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Health insurance provider</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. Blue Cross"
                        value={form.insuranceProvider}
                        onChange={(e) => update("insuranceProvider", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Policy / member number</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Policy number"
                        value={form.insurancePolicy}
                        onChange={(e) => update("insurancePolicy", e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-sage/15 pt-5 mt-2">
                <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-wider text-sage-dark">
                  Emergency &amp; pickup
                </p>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Emergency contact name</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="Full name"
                        value={form.emergencyName}
                        onChange={(e) => update("emergencyName", e.target.value)}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>Relationship</label>
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="e.g. grandparent, aunt"
                        value={form.emergencyRelationship}
                        onChange={(e) => update("emergencyRelationship", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Emergency contact phone</label>
                    <input
                      type="tel"
                      className={inputClass}
                      placeholder="(555) 555-5555"
                      value={form.emergencyPhone}
                      onChange={(e) => update("emergencyPhone", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      Authorized to pick up your child (besides you)
                    </label>
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Full names, separated by commas. Leave blank if parent/guardian only."
                      value={form.authorizedPickup}
                      onChange={(e) => update("authorizedPickup", e.target.value)}
                    />
                  </div>
                </div>
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
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-sage-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!form.emergencyName || !form.emergencyPhone}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 3 && (
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
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-sage-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!form.parentName || !form.phone || !form.email}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark disabled:opacity-40"
              >
                Continue
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Waiver */}
        {step === 4 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Camp Waiver
            </h2>
            <CampWaiver
              campName="Mind Body Speech"
              parentName={form.parentName}
              signature={waiverSignature}
              setSignature={setWaiverSignature}
              agreed={waiverAgreed}
              setAgreed={setWaiverAgreed}
            />
            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-sage-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Back
              </button>
              <button
                onClick={next}
                disabled={!isWaiverValid({ agreed: waiverAgreed, signature: waiverSignature, parentName: form.parentName })}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark disabled:opacity-40"
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

        {/* Step 6: Review */}
        {step === 5 && (
          <div className="rounded-2xl bg-white p-8 shadow-sm md:p-10">
            <h2 className="mb-6 font-serif text-2xl font-light text-charcoal">
              Review Your Information
            </h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-4">
                <span className="w-48 flex-shrink-0 font-body text-[11px] font-bold uppercase tracking-wider text-charcoal-light">
                  Weeks Selected
                </span>
                <span className="font-body text-sm text-charcoal">
                  {selectedWeeks
                    .map((id) => weekOptions.find((w) => w.id === id))
                    .map((w) => `${w!.label} (${w!.dates})`)
                    .join(", ")}
                </span>
              </div>
              <ReviewItem label="Child's Name" value={form.childName} />
              <ReviewItem label="Date of Birth" value={form.childDob} />
              <ReviewItem label="Address" value={form.address} />
              <ReviewItem label="Special Info" value={form.specialInfo} />
              <ReviewItem label="Diagnoses" value={form.diagnoses} />
              <ReviewItem label="IEP" value={form.hasIEP} />
              <ReviewItem label="Speech/Language Evaluation" value={form.speechEvaluation} />
              <ReviewItem label="Food Allergies" value={form.foodAllergies} />
              <ReviewItem label="Other Allergies" value={form.otherAllergies} />
              <ReviewItem label="Medications" value={form.medications} />
              <ReviewItem label="Pediatrician" value={form.pediatricianName ? `${form.pediatricianName}${form.pediatricianPhone ? ` — ${form.pediatricianPhone}` : ""}` : ""} />
              <ReviewItem label="Insurance" value={form.insuranceProvider ? `${form.insuranceProvider}${form.insurancePolicy ? ` (#${form.insurancePolicy})` : ""}` : ""} />
              <ReviewItem label="Additional Notes" value={form.anythingElse} />
              <div className="my-4 h-px bg-sage/10" />
              <ReviewItem label="Emergency Contact" value={`${form.emergencyName}${form.emergencyRelationship ? ` (${form.emergencyRelationship})` : ""} — ${form.emergencyPhone}`} />
              <ReviewItem label="Authorized Pickup" value={form.authorizedPickup || "Parent/guardian only"} />
              <div className="my-4 h-px bg-sage/10" />
              <ReviewItem label="Parent/Guardian" value={form.parentName} />
              <ReviewItem label="Phone" value={form.phone} />
              <ReviewItem label="Email" value={form.email} />
              <div className="my-4 h-px bg-sage/10" />
              <ReviewItem label="Waiver Signed" value={waiverSignature ? `${waiverSignature} (${new Date().toLocaleDateString()})` : ""} />
            </div>

            {/* Price summary */}
            <div className="mt-6 rounded-xl bg-sage/10 px-5 py-4">
              <div className="flex items-center justify-between">
                <span className="font-body text-sm font-medium text-charcoal">
                  {selectedWeeks.length} {selectedWeeks.length === 1 ? "week" : "weeks"} × ${perWeekPrice}
                </span>
                <span className="font-serif text-2xl font-medium text-sage-dark">
                  ${totalPrice}
                </span>
              </div>
              {isEarlyBird && (
                <p className="mt-1 font-body text-xs text-sage-dark">Early bird pricing applied</p>
              )}
              {promoCode.trim() && (
                <p className="mt-1 font-body text-xs text-sage-dark">
                  Promo code &ldquo;{promoCode.trim()}&rdquo; will be applied at checkout
                </p>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-sage/8 p-5">
              <p className="font-body text-sm leading-relaxed text-charcoal-light">
                By proceeding to payment, you confirm that the information above
                is accurate. After payment, Rachel will reach out to confirm
                your child&apos;s spot.
              </p>
            </div>

            <div className="mt-8 flex justify-between">
              <button
                onClick={back}
                className="inline-flex items-center gap-2 font-body text-sm font-semibold text-charcoal-light transition-colors hover:text-sage-dark"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
                Edit Info
              </button>
              <button
                onClick={handleSubmitAndPay}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 disabled:opacity-60"
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
                    Pay ${totalPrice}
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
