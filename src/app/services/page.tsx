"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useReveal } from "@/hooks/useReveal";

const TOTAL_STEPS = 9;

export default function ServicesPage() {
  const ref = useReveal();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Service preferences (step 0)
  const [serviceType, setServiceType] = useState("");
  const [evalTypes, setEvalTypes] = useState<string[]>([]);
  const [therapyType, setTherapyType] = useState("");
  const [sessionPref, setSessionPref] = useState("");
  const [hasIep, setHasIep] = useState<boolean | null>(null);
  const [wantsEval, setWantsEval] = useState<boolean | null>(null);

  // Child & contact info (step 1)
  const [childName, setChildName] = useState("");
  const [dob, setDob] = useState("");
  const [parentName, setParentName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Pregnancy & birth (step 2)
  const [pregnancyConcerns, setPregnancyConcerns] = useState("");
  const [pregnancyConcernsDesc, setPregnancyConcernsDesc] = useState("");
  const [bornTerm, setBornTerm] = useState("");
  const [earlyWeeks, setEarlyWeeks] = useState("");
  const [deliveryType, setDeliveryType] = useState("");
  const [deliveryOther, setDeliveryOther] = useState("");
  const [deliveryComplications, setDeliveryComplications] = useState("");
  const [deliveryComplicationsDesc, setDeliveryComplicationsDesc] = useState("");
  const [nicuTime, setNicuTime] = useState("");
  const [nicuDuration, setNicuDuration] = useState("");

  // Medical & health (step 3)
  const [medicalConditions, setMedicalConditions] = useState("");
  const [medicalConditionsDesc, setMedicalConditionsDesc] = useState("");
  const [earInfections, setEarInfections] = useState("");
  const [earTubes, setEarTubes] = useState("");
  const [hearingConcerns, setHearingConcerns] = useState("");
  const [lastHearingTest, setLastHearingTest] = useState("");
  const [visionConcerns, setVisionConcerns] = useState("");
  const [medications, setMedications] = useState("");
  const [surgeries, setSurgeries] = useState("");
  const [surgeriesDesc, setSurgeriesDesc] = useState("");

  // Developmental milestones (step 4)
  const [crawled, setCrawled] = useState("");
  const [walked, setWalked] = useState("");
  const [pottyTrained, setPottyTrained] = useState("");
  const [firstWords, setFirstWords] = useState("");
  const [combiningWords, setCombiningWords] = useState("");
  const [overallDev, setOverallDev] = useState("");
  const [motorConcerns, setMotorConcerns] = useState("");
  const [feedingConcerns, setFeedingConcerns] = useState("");
  const [devConcernsExplain, setDevConcernsExplain] = useState("");

  // Speech & language (step 5)
  const [languagesAtHome, setLanguagesAtHome] = useState("");
  const [understandsOthers, setUnderstandsOthers] = useState("");
  const [expressesClearly, setExpressesClearly] = useState("");
  const [understoodByStrangers, setUnderstoodByStrangers] = useState("");
  const [speechConcerns, setSpeechConcerns] = useState("");
  const [speechConcernsDesc, setSpeechConcernsDesc] = useState("");
  const [previousTherapy, setPreviousTherapy] = useState("");
  const [previousTherapyDesc, setPreviousTherapyDesc] = useState("");

  // Social & behavioral (step 6)
  const [peerInteraction, setPeerInteraction] = useState("");
  const [eyeContact, setEyeContact] = useState("");
  const [attentionConcerns, setAttentionConcerns] = useState("");
  const [behaviorConcerns, setBehaviorConcerns] = useState("");
  const [behaviorDesc, setBehaviorDesc] = useState("");

  // Education & family (step 7)
  const [schoolGrade, setSchoolGrade] = useState("");
  const [academicConcerns, setAcademicConcerns] = useState("");
  const [academicConcernsDesc, setAcademicConcernsDesc] = useState("");
  const [strengths, setStrengths] = useState("");
  const [areasOfConcern, setAreasOfConcern] = useState("");
  const [familySpeech, setFamilySpeech] = useState("");
  const [familyLearning, setFamilyLearning] = useState("");
  const [familyHearing, setFamilyHearing] = useState("");
  const [familyExplain, setFamilyExplain] = useState("");

  // Parent input (step 8)
  const [mainConcerns, setMainConcerns] = useState("");
  const [improvementGoals, setImprovementGoals] = useState("");
  const [anythingElse, setAnythingElse] = useState("");

  function toggleEvalType(t: string) {
    setEvalTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  async function handleSubmit() {
    if (!childName || !parentName || (!email && !phone)) {
      alert("Please provide the child's name, your name, and at least an email or phone number.");
      return;
    }
    setSubmitting(true);

    const { error } = await supabase.from("questionnaire_submissions").insert({
      child_name: childName,
      date_of_birth: dob || null,
      parent_name: parentName,
      relationship: relationship || null,
      email: email || null,
      phone: phone || null,
      address: address || null,
      service_type: serviceType || null,
      eval_type: evalTypes.length > 0 ? evalTypes.join(", ") : null,
      therapy_type: therapyType || null,
      session_preference: sessionPref || null,
      has_iep: hasIep ?? false,
      wants_evaluation: wantsEval ?? false,
      pregnancy_birth: {
        concerns: pregnancyConcerns, concerns_desc: pregnancyConcernsDesc,
        born_term: bornTerm, early_weeks: earlyWeeks,
        delivery_type: deliveryType, delivery_other: deliveryOther,
        complications: deliveryComplications, complications_desc: deliveryComplicationsDesc,
        nicu: nicuTime, nicu_duration: nicuDuration,
      },
      medical_health: {
        conditions: medicalConditions, conditions_desc: medicalConditionsDesc,
        ear_infections: earInfections, ear_tubes: earTubes,
        hearing_concerns: hearingConcerns, last_hearing_test: lastHearingTest,
        vision_concerns: visionConcerns, medications,
        surgeries, surgeries_desc: surgeriesDesc,
      },
      developmental_milestones: {
        crawled, walked, potty_trained: pottyTrained,
        first_words: firstWords, combining_words: combiningWords,
        overall_dev: overallDev, motor_concerns: motorConcerns,
        feeding_concerns: feedingConcerns, explain: devConcernsExplain,
      },
      speech_language: {
        languages_at_home: languagesAtHome, understands_others: understandsOthers,
        expresses_clearly: expressesClearly, understood_by_strangers: understoodByStrangers,
        concerns: speechConcerns, concerns_desc: speechConcernsDesc,
        previous_therapy: previousTherapy, previous_therapy_desc: previousTherapyDesc,
      },
      social_behavioral: {
        peer_interaction: peerInteraction, eye_contact: eyeContact,
        attention_concerns: attentionConcerns, behavior_concerns: behaviorConcerns,
        behavior_desc: behaviorDesc,
      },
      education: {
        school_grade: schoolGrade, academic_concerns: academicConcerns,
        academic_concerns_desc: academicConcernsDesc,
        strengths, areas_of_concern: areasOfConcern,
      },
      family_history: {
        speech: familySpeech, learning: familyLearning,
        hearing: familyHearing, explain: familyExplain,
      },
      parent_input: {
        main_concerns: mainConcerns, improvement_goals: improvementGoals,
        anything_else: anythingElse,
      },
    });

    if (error) {
      alert("Error submitting form. Please try again.");
      setSubmitting(false);
      return;
    }

    setSubmitted(true);
    setSubmitting(false);
  }

  const inputClass =
    "w-full px-4 py-3 bg-warm-white border border-sage/20 rounded-xl focus:ring-2 focus:ring-sage/20 focus:border-sage outline-none transition-all text-sm text-charcoal placeholder:text-charcoal-light/50";
  const labelClass = "block font-body text-[12px] font-semibold uppercase tracking-wider text-sage-dark mb-1.5";
  const radioGroupClass = "flex flex-wrap gap-2";
  const radioBtn = (selected: boolean) =>
    `px-4 py-2 rounded-lg border text-sm font-body cursor-pointer transition-all ${
      selected ? "bg-sage text-white border-sage" : "bg-warm-white border-sage/20 text-charcoal hover:border-sage/40"
    }`;

  const stepTitles = [
    "Service Selection",
    "Child & Contact Info",
    "Pregnancy & Birth History",
    "Medical & Health History",
    "Developmental Milestones",
    "Speech & Language",
    "Social & Behavioral",
    "Education & Family History",
    "Your Input & Review",
  ];

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>What services are you interested in? *</label>
              <div className={radioGroupClass}>
                {[
                  { value: "evaluation", label: "Evaluation Only" },
                  { value: "therapy", label: "Therapy Only" },
                  { value: "both", label: "Both Evaluation & Therapy" },
                ].map((o) => (
                  <button key={o.value} type="button" onClick={() => setServiceType(o.value)} className={radioBtn(serviceType === o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            {(serviceType === "evaluation" || serviceType === "both") && (
              <div>
                <label className={labelClass}>Evaluation Type(s)</label>
                <div className={radioGroupClass}>
                  {["Speech", "Language", "Fluency"].map((t) => (
                    <button key={t} type="button" onClick={() => toggleEvalType(t.toLowerCase())} className={radioBtn(evalTypes.includes(t.toLowerCase()))}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {(serviceType === "therapy" || serviceType === "both") && (
              <div>
                <label className={labelClass}>Therapy Type</label>
                <div className={radioGroupClass}>
                  <button type="button" onClick={() => setTherapyType("individualized")} className={radioBtn(therapyType === "individualized")}>Individualized</button>
                  <button type="button" onClick={() => setTherapyType("group")} className={radioBtn(therapyType === "group")}>Group (2+ students)</button>
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>Do you prefer in-person or virtual?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSessionPref("in_person")} className={radioBtn(sessionPref === "in_person")}>In Person</button>
                <button type="button" onClick={() => setSessionPref("virtual")} className={radioBtn(sessionPref === "virtual")}>Virtual</button>
              </div>
              <p className="mt-1.5 font-body text-xs text-charcoal-light">Virtual services available for qualifying candidates. In-person at a private residence in St. Petersburg or in your own home.</p>
            </div>
            <div>
              <label className={labelClass}>Does your child have an IEP?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setHasIep(true)} className={radioBtn(hasIep === true)}>Yes</button>
                <button type="button" onClick={() => setHasIep(false)} className={radioBtn(hasIep === false)}>No</button>
              </div>
              {hasIep === true && (
                <div className="mt-3">
                  <label className={labelClass}>Would you still like an evaluation?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setWantsEval(true)} className={radioBtn(wantsEval === true)}>Yes</button>
                    <button type="button" onClick={() => setWantsEval(false)} className={radioBtn(wantsEval === false)}>No, follow our IEP</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Child&apos;s Name *</label>
              <input value={childName} onChange={(e) => setChildName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Your Name (Parent/Guardian) *</label>
              <input value={parentName} onChange={(e) => setParentName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Relationship to Child</label>
              <input value={relationship} onChange={(e) => setRelationship(e.target.value)} className={inputClass} placeholder="e.g. Mother, Father, Guardian" />
            </div>
            <div>
              <label className={labelClass}>Email Address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="your@email.com" />
            </div>
            <div>
              <label className={labelClass}>Phone Number</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="(555) 555-5555" />
            </div>
            <div>
              <label className={labelClass}>Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder="Street address, city, state, zip" />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Any concerns during pregnancy?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setPregnancyConcerns("no")} className={radioBtn(pregnancyConcerns === "no")}>No concerns</button>
                <button type="button" onClick={() => setPregnancyConcerns("yes")} className={radioBtn(pregnancyConcerns === "yes")}>Yes, concerns</button>
              </div>
              {pregnancyConcerns === "yes" && (
                <textarea value={pregnancyConcernsDesc} onChange={(e) => setPregnancyConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Was your child born:</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setBornTerm("full_term")} className={radioBtn(bornTerm === "full_term")}>Full Term</button>
                <button type="button" onClick={() => setBornTerm("early")} className={radioBtn(bornTerm === "early")}>Early</button>
              </div>
              {bornTerm === "early" && (
                <input value={earlyWeeks} onChange={(e) => setEarlyWeeks(e.target.value)} className={`${inputClass} mt-2`} placeholder="How many weeks early?" />
              )}
            </div>
            <div>
              <label className={labelClass}>Type of delivery:</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setDeliveryType("vaginal")} className={radioBtn(deliveryType === "vaginal")}>Vaginal</button>
                <button type="button" onClick={() => setDeliveryType("c_section")} className={radioBtn(deliveryType === "c_section")}>C-Section</button>
                <button type="button" onClick={() => setDeliveryType("other")} className={radioBtn(deliveryType === "other")}>Other</button>
              </div>
              {deliveryType === "other" && (
                <input value={deliveryOther} onChange={(e) => setDeliveryOther(e.target.value)} className={`${inputClass} mt-2`} placeholder="Please specify..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Complications during delivery?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setDeliveryComplications("no")} className={radioBtn(deliveryComplications === "no")}>No complications</button>
                <button type="button" onClick={() => setDeliveryComplications("yes")} className={radioBtn(deliveryComplications === "yes")}>Yes</button>
              </div>
              {deliveryComplications === "yes" && (
                <textarea value={deliveryComplicationsDesc} onChange={(e) => setDeliveryComplicationsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Did your child require NICU time?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setNicuTime("no")} className={radioBtn(nicuTime === "no")}>No</button>
                <button type="button" onClick={() => setNicuTime("yes")} className={radioBtn(nicuTime === "yes")}>Yes</button>
              </div>
              {nicuTime === "yes" && (
                <input value={nicuDuration} onChange={(e) => setNicuDuration(e.target.value)} className={`${inputClass} mt-2`} placeholder="How long?" />
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Any diagnosed medical conditions?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setMedicalConditions("no")} className={radioBtn(medicalConditions === "no")}>No</button>
                <button type="button" onClick={() => setMedicalConditions("yes")} className={radioBtn(medicalConditions === "yes")}>Yes</button>
              </div>
              {medicalConditions === "yes" && (
                <input value={medicalConditionsDesc} onChange={(e) => setMedicalConditionsDesc(e.target.value)} className={`${inputClass} mt-2`} placeholder="Please list conditions..." />
              )}
            </div>
            <div>
              <label className={labelClass}>History of frequent ear infections?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setEarInfections("no")} className={radioBtn(earInfections === "no")}>No</button>
                <button type="button" onClick={() => setEarInfections("yes")} className={radioBtn(earInfections === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Ear tubes placed?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setEarTubes("no")} className={radioBtn(earTubes === "no")}>No</button>
                <button type="button" onClick={() => setEarTubes("yes")} className={radioBtn(earTubes === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns about hearing?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setHearingConcerns("no")} className={radioBtn(hearingConcerns === "no")}>No</button>
                <button type="button" onClick={() => setHearingConcerns("yes")} className={radioBtn(hearingConcerns === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Date of last hearing test (if known)</label>
              <input value={lastHearingTest} onChange={(e) => setLastHearingTest(e.target.value)} className={inputClass} placeholder="Approximate date" />
            </div>
            <div>
              <label className={labelClass}>Any concerns about vision?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setVisionConcerns("no")} className={radioBtn(visionConcerns === "no")}>No</button>
                <button type="button" onClick={() => setVisionConcerns("yes")} className={radioBtn(visionConcerns === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Current medications (if any)</label>
              <input value={medications} onChange={(e) => setMedications(e.target.value)} className={inputClass} placeholder="List medications or 'None'" />
            </div>
            <div>
              <label className={labelClass}>Any surgeries or hospitalizations?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSurgeries("no")} className={radioBtn(surgeries === "no")}>No</button>
                <button type="button" onClick={() => setSurgeries("yes")} className={radioBtn(surgeries === "yes")}>Yes</button>
              </div>
              {surgeries === "yes" && (
                <textarea value={surgeriesDesc} onChange={(e) => setSurgeriesDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <p className="font-body text-sm text-charcoal-light">Approximate ages are okay.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Crawled</label>
                <input value={crawled} onChange={(e) => setCrawled(e.target.value)} className={inputClass} placeholder="e.g. 8 months" />
              </div>
              <div>
                <label className={labelClass}>Walked</label>
                <input value={walked} onChange={(e) => setWalked(e.target.value)} className={inputClass} placeholder="e.g. 12 months" />
              </div>
              <div>
                <label className={labelClass}>Potty Trained</label>
                <input value={pottyTrained} onChange={(e) => setPottyTrained(e.target.value)} className={inputClass} placeholder="e.g. 3 years" />
              </div>
              <div>
                <label className={labelClass}>First Words</label>
                <input value={firstWords} onChange={(e) => setFirstWords(e.target.value)} className={inputClass} placeholder="e.g. 12 months" />
              </div>
            </div>
            <div>
              <label className={labelClass}>Started combining words</label>
              <input value={combiningWords} onChange={(e) => setCombiningWords(e.target.value)} className={inputClass} placeholder="e.g. 18 months" />
            </div>
            <div>
              <label className={labelClass}>Overall development</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setOverallDev("on_time")} className={radioBtn(overallDev === "on_time")}>On Time</button>
                <button type="button" onClick={() => setOverallDev("delayed")} className={radioBtn(overallDev === "delayed")}>Delayed</button>
                <button type="button" onClick={() => setOverallDev("unsure")} className={radioBtn(overallDev === "unsure")}>Unsure</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns with motor skills (running, jumping)?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setMotorConcerns("no")} className={radioBtn(motorConcerns === "no")}>No</button>
                <button type="button" onClick={() => setMotorConcerns("yes")} className={radioBtn(motorConcerns === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Any concerns with feeding/swallowing?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setFeedingConcerns("no")} className={radioBtn(feedingConcerns === "no")}>No</button>
                <button type="button" onClick={() => setFeedingConcerns("yes")} className={radioBtn(feedingConcerns === "yes")}>Yes</button>
              </div>
            </div>
            {(motorConcerns === "yes" || feedingConcerns === "yes") && (
              <div>
                <label className={labelClass}>Please explain</label>
                <textarea value={devConcernsExplain} onChange={(e) => setDevConcernsExplain(e.target.value)} rows={2} className={inputClass} />
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Languages spoken at home</label>
              <input value={languagesAtHome} onChange={(e) => setLanguagesAtHome(e.target.value)} className={inputClass} placeholder="e.g. English, Spanish" />
            </div>
            <div>
              <label className={labelClass}>Does your child understand others?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setUnderstandsOthers(o.toLowerCase())} className={radioBtn(understandsOthers === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Does your child express themselves clearly?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setExpressesClearly(o.toLowerCase())} className={radioBtn(expressesClearly === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Are they understood by unfamiliar listeners?</label>
              <div className={radioGroupClass}>
                {["Always", "Sometimes", "Rarely"].map((o) => (
                  <button key={o} type="button" onClick={() => setUnderstoodByStrangers(o.toLowerCase())} className={radioBtn(understoodByStrangers === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Have you ever had concerns about speech/language?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setSpeechConcerns("no")} className={radioBtn(speechConcerns === "no")}>No</button>
                <button type="button" onClick={() => setSpeechConcerns("yes")} className={radioBtn(speechConcerns === "yes")}>Yes</button>
              </div>
              {speechConcerns === "yes" && (
                <textarea value={speechConcernsDesc} onChange={(e) => setSpeechConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Previous speech therapy?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setPreviousTherapy("no")} className={radioBtn(previousTherapy === "no")}>No</button>
                <button type="button" onClick={() => setPreviousTherapy("yes")} className={radioBtn(previousTherapy === "yes")}>Yes</button>
              </div>
              {previousTherapy === "yes" && (
                <input value={previousTherapyDesc} onChange={(e) => setPreviousTherapyDesc(e.target.value)} className={`${inputClass} mt-2`} placeholder="Where and when?" />
              )}
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Interaction with peers</label>
              <div className={radioGroupClass}>
                {["Very well", "Generally well", "Sometimes struggles", "Often struggles"].map((o) => (
                  <button key={o} type="button" onClick={() => setPeerInteraction(o.toLowerCase())} className={radioBtn(peerInteraction === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Eye contact / responding to others</label>
              <div className={radioGroupClass}>
                {["Yes", "Sometimes", "No"].map((o) => (
                  <button key={o} type="button" onClick={() => setEyeContact(o.toLowerCase())} className={radioBtn(eyeContact === o.toLowerCase())}>{o}</button>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClass}>Attention/focus concerns</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setAttentionConcerns("no")} className={radioBtn(attentionConcerns === "no")}>No</button>
                <button type="button" onClick={() => setAttentionConcerns("yes")} className={radioBtn(attentionConcerns === "yes")}>Yes</button>
              </div>
            </div>
            <div>
              <label className={labelClass}>Behavior/emotional concerns</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setBehaviorConcerns("no")} className={radioBtn(behaviorConcerns === "no")}>No</button>
                <button type="button" onClick={() => setBehaviorConcerns("yes")} className={radioBtn(behaviorConcerns === "yes")}>Yes</button>
              </div>
              {behaviorConcerns === "yes" && (
                <textarea value={behaviorDesc} onChange={(e) => setBehaviorDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>School / Grade</label>
              <input value={schoolGrade} onChange={(e) => setSchoolGrade(e.target.value)} className={inputClass} placeholder="e.g. Lincoln Elementary, 2nd grade" />
            </div>
            <div>
              <label className={labelClass}>Academic concerns?</label>
              <div className={radioGroupClass}>
                <button type="button" onClick={() => setAcademicConcerns("no")} className={radioBtn(academicConcerns === "no")}>No</button>
                <button type="button" onClick={() => setAcademicConcerns("yes")} className={radioBtn(academicConcerns === "yes")}>Yes</button>
              </div>
              {academicConcerns === "yes" && (
                <textarea value={academicConcernsDesc} onChange={(e) => setAcademicConcernsDesc(e.target.value)} rows={2} className={`${inputClass} mt-2`} placeholder="Please describe..." />
              )}
            </div>
            <div>
              <label className={labelClass}>Strengths (what your child does well)</label>
              <textarea value={strengths} onChange={(e) => setStrengths(e.target.value)} rows={2} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Areas of concern</label>
              <textarea value={areasOfConcern} onChange={(e) => setAreasOfConcern(e.target.value)} rows={2} className={inputClass} />
            </div>
            <div className="border-t border-sage/10 pt-4">
              <p className="font-body text-[13px] font-semibold text-charcoal mb-3">Family History</p>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Speech/language difficulties in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilySpeech("no")} className={radioBtn(familySpeech === "no")}>No</button>
                    <button type="button" onClick={() => setFamilySpeech("yes")} className={radioBtn(familySpeech === "yes")}>Yes</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Learning disabilities in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilyLearning("no")} className={radioBtn(familyLearning === "no")}>No</button>
                    <button type="button" onClick={() => setFamilyLearning("yes")} className={radioBtn(familyLearning === "yes")}>Yes</button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Hearing loss in family?</label>
                  <div className={radioGroupClass}>
                    <button type="button" onClick={() => setFamilyHearing("no")} className={radioBtn(familyHearing === "no")}>No</button>
                    <button type="button" onClick={() => setFamilyHearing("yes")} className={radioBtn(familyHearing === "yes")}>Yes</button>
                  </div>
                </div>
                {(familySpeech === "yes" || familyLearning === "yes" || familyHearing === "yes") && (
                  <div>
                    <label className={labelClass}>Please explain</label>
                    <textarea value={familyExplain} onChange={(e) => setFamilyExplain(e.target.value)} rows={2} className={inputClass} />
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>What are your main concerns about your child&apos;s communication?</label>
              <textarea value={mainConcerns} onChange={(e) => setMainConcerns(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>What would you like your child to improve?</label>
              <textarea value={improvementGoals} onChange={(e) => setImprovementGoals(e.target.value)} rows={3} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Is there anything else you would like us to know?</label>
              <textarea value={anythingElse} onChange={(e) => setAnythingElse(e.target.value)} rows={3} className={inputClass} />
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div ref={ref} className="min-h-screen bg-warm-white">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
              <Image src="/Logo.png" alt="Conscious Speech Strategies" fill className="object-cover" sizes="40px" />
            </div>
            <span className="font-serif text-lg font-medium tracking-wide text-charcoal">Conscious Speech</span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-sage-dark">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
            </svg>
            Back to Home
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-16 md:pb-24">
        <div className="pointer-events-none absolute -top-32 -right-32 h-[400px] w-[400px] rounded-full bg-sage/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-peach/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8 text-center">
          <div className="fade-up mx-auto mb-6 h-[1px] w-12 bg-sage" />
          <p className="fade-up delay-1 mb-4 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Private Services
          </p>
          <h1 className="fade-up delay-2 font-serif text-4xl font-light text-charcoal md:text-5xl lg:text-6xl">
            Summer Therapy &<br />
            <span className="italic">Private</span> Services
          </h1>
          <p className="fade-up delay-3 mx-auto mt-6 max-w-xl font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Individualized and group therapy options designed to support your child&apos;s communication growth over the summer and beyond.
          </p>
        </div>
      </section>

      {/* Service Details & Pricing */}
      <section className="relative bg-cream py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">What We Offer</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Services & <span className="italic">Pricing</span>
            </h2>
          </div>

          <div className="fade-up delay-1 grid gap-6 md:grid-cols-2 mb-10">
            <div className="rounded-2xl bg-warm-white p-7">
              <h3 className="mb-4 font-serif text-xl font-light text-charcoal">Evaluations</h3>
              <p className="mb-4 font-body text-sm leading-relaxed text-charcoal-light">
                Comprehensive evaluations to identify your child&apos;s strengths and areas of need. Students will need to be evaluated unless they have an IEP, in which case we can follow the IEP. You may still request an evaluation if desired.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Speech Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$275</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Language Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$350</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-body text-sm text-charcoal">Fluency Evaluation</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$350</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-warm-white p-7">
              <h3 className="mb-4 font-serif text-xl font-light text-charcoal">Therapy Sessions</h3>
              <p className="mb-4 font-body text-sm leading-relaxed text-charcoal-light">
                All sessions are 30 minutes and may be scheduled up to twice a week if needed. Available in-person at a private residence in St. Petersburg or in your own home, or virtually for qualifying candidates.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Individualized Session (30 min)</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$65</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-sage/10">
                  <span className="font-body text-sm text-charcoal">Virtual Telehealth Session (30 min)</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$60</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-body text-sm text-charcoal">Group Therapy (2+ students, 30 min)</span>
                  <span className="font-body text-sm font-semibold text-charcoal">$35</span>
                </div>
              </div>
            </div>
          </div>

          <div className="fade-up delay-2 grid gap-4 md:grid-cols-3">
            {[
              { title: "In Person", desc: "Sessions at a private residence in St. Petersburg, or in the comfort of your own home." },
              { title: "Virtual Option", desc: "Telehealth sessions at $60, for students determined to be good candidates." },
              { title: "Flexible Schedule", desc: "30-minute sessions, up to twice weekly based on your child's needs." },
            ].map((s) => (
              <div key={s.title} className="rounded-2xl bg-warm-white p-6 text-center">
                <h4 className="mb-2 font-serif text-lg font-light text-charcoal">{s.title}</h4>
                <p className="font-body text-sm leading-relaxed text-charcoal-light">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Questionnaire Form */}
      <section id="questionnaire" className="relative py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sage/10 blur-3xl" />
        <div className="mx-auto max-w-2xl px-6 lg:px-8">
          <div className="fade-up text-center mb-10">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">Get Started</p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Speech & Language <span className="italic">Questionnaire</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Complete this questionnaire to help us understand your child&apos;s needs and get started with services.
            </p>
          </div>

          {submitted ? (
            <div className="fade-up rounded-2xl bg-cream p-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-sage/20">
                <svg className="h-7 w-7 text-sage-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h3 className="mb-2 font-serif text-2xl font-light text-charcoal">Thank You!</h3>
              <p className="font-body text-sm text-charcoal-light">
                We&apos;ve received your questionnaire and will be in touch soon to discuss your child&apos;s needs and next steps.
              </p>
            </div>
          ) : (
            <div className="fade-up delay-1">
              {/* Progress bar */}
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="font-body text-xs text-sage-dark font-semibold uppercase tracking-wider">
                    Step {step + 1} of {TOTAL_STEPS}: {stepTitles[step]}
                  </span>
                  <span className="font-body text-xs text-charcoal-light">{Math.round(((step + 1) / TOTAL_STEPS) * 100)}%</span>
                </div>
                <div className="h-1.5 bg-sage/10 rounded-full overflow-hidden">
                  <div className="h-full bg-sage rounded-full transition-all duration-500" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
                </div>
              </div>

              <div className="rounded-2xl bg-cream p-7 space-y-6">
                {renderStep()}

                <div className="flex gap-3 pt-2 border-t border-sage/10">
                  {step > 0 && (
                    <button type="button" onClick={() => setStep(step - 1)}
                      className="px-6 py-3 rounded-xl font-body text-sm font-semibold text-charcoal-light hover:bg-warm-white transition-all cursor-pointer">
                      Back
                    </button>
                  )}
                  <div className="ml-auto">
                    {step < TOTAL_STEPS - 1 ? (
                      <button type="button" onClick={() => setStep(step + 1)}
                        className="rounded-xl bg-sage px-6 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 cursor-pointer">
                        Next
                      </button>
                    ) : (
                      <button type="button" onClick={handleSubmit} disabled={submitting}
                        className="rounded-xl bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20 disabled:opacity-50 cursor-pointer">
                        {submitting ? "Submitting..." : "Submit Questionnaire"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage/10 bg-warm-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <p className="font-body text-xs text-charcoal-light">
            &copy; {new Date().getFullYear()} Conscious Speech Strategies. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
