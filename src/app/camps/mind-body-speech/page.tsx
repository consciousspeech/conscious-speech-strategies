"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";

export default function MindBodySpeechCamp() {
  const ref = useReveal();

  const spiritActivities = [
    { name: "Yoga", icon: "🧘" },
    { name: "EFT Tapping", icon: "✋" },
    { name: "Infinite Light", icon: "✨" },
    { name: "Laughter Yoga", icon: "😄" },
  ];

  const mindActivities = [
    { name: "Drama & Skits", icon: "🎭" },
    { name: "Improv", icon: "🎤" },
    { name: "Literacy Activities", icon: "📖" },
    { name: "Phonological Awareness", icon: "🔤" },
    { name: "Vocabulary Building", icon: "💬" },
    { name: "Categorization Games", icon: "🧩" },
    { name: "Music", icon: "🎵" },
  ];

  const bodyActivities = [
    "Hula Hoop",
    "Poi",
    "Drums",
    "Soccer Ball",
    "Basketball",
    "Sensory Water Play",
    "Volleyball",
    "Tennis Ball",
    "Jump Rope",
  ];

  const weeks = [
    { label: "Week 1", dates: "June 15–18" },
    { label: "Week 2", dates: "June 22–25" },
  ];

  return (
    <div ref={ref} className="min-h-screen bg-warm-white">
      {/* Back navigation */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            href="/"
            className="flex items-center gap-3 group"
          >
            <div className="relative h-10 w-10 overflow-hidden rounded-full transition-transform duration-300 group-hover:scale-105">
              <Image
                src="/Logo.png"
                alt="Conscious Speech Strategies"
                fill
                className="object-cover"
                sizes="40px"
              />
            </div>
            <span className="font-serif text-lg font-medium tracking-wide text-charcoal">
              Conscious Speech
            </span>
          </Link>
          <Link
            href="/#programs"
            className="inline-flex items-center gap-2 font-body text-[13px] font-semibold uppercase tracking-[0.15em] text-charcoal-light transition-colors duration-300 hover:text-sage-dark"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16l-4-4m0 0l4-4m-4 4h18"
              />
            </svg>
            Back to Programs
          </Link>
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden pt-24">
        <div className="relative h-72 md:h-96">
          <Image
            src="/images/camp-mind-body-speech.png"
            alt="Children doing yoga and playing with drums and hula hoops during Mind Body Speech camp"
            fill
            className="object-cover object-[50%_25%]"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-warm-white via-charcoal/20 to-charcoal/30" />
          <div className="absolute bottom-8 left-0 right-0">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <span className="inline-block rounded-full bg-sage/90 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Summer Camp 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Title & Intro */}
      <section className="relative overflow-hidden py-16 md:py-20">
        {/* Decorative circles */}
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-sage/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-peach/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-5xl font-light text-charcoal md:text-6xl lg:text-7xl">
              Mind. Body. <span className="italic">Speech.</span>
            </h1>
            <p className="mb-8 font-body text-lg leading-relaxed text-charcoal-light md:text-xl">
              Two weeks of creative group speech and language therapy sessions
              designed for rising 1st&ndash;5th graders wanting to close the
              summer gap of their IEP and/or improve their speech, language,
              social, literacy, and executive functioning skills.
            </p>
          </div>

          {/* Quick details */}
          <div className="fade-up delay-1 mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Who
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                Rising 1st&ndash;5th
              </p>
              <p className="font-body text-xs text-charcoal-light">Graders</p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Days & Time
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                Mon&ndash;Thu
              </p>
              <p className="font-body text-xs text-charcoal-light">
                9:00am&ndash;12:00pm
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Duration
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                2 Weeks
              </p>
              <p className="font-body text-xs text-charcoal-light">
                June 15 &ndash; 25
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                Investment
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                $300
              </p>
              <p className="font-body text-xs text-charcoal-light">per week</p>
            </div>
          </div>
        </div>
      </section>

      {/* Schedule */}
      <section className="relative overflow-hidden bg-cream py-16 md:py-20">
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-3xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
              Schedule
            </p>
            <h2 className="mb-10 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Two Weeks of <span className="italic">Growth</span>
            </h2>
          </div>

          <div className="fade-up delay-1 mx-auto grid max-w-2xl gap-4 md:grid-cols-3">
            {weeks.map((week, i) => (
              <div
                key={week.label}
                className={`delay-${i + 1} rounded-2xl bg-warm-white p-6 text-center shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-sage/15">
                  <span className="font-body text-sm font-bold text-sage-dark">
                    {i + 1}
                  </span>
                </div>
                <p className="font-body text-[10px] font-bold uppercase tracking-wider text-sage-dark">
                  {week.label}
                </p>
                <p className="mt-1 font-serif text-lg text-charcoal">
                  {week.dates}
                </p>
                <p className="mt-1 font-body text-xs text-charcoal-light">
                  Monday &ndash; Thursday
                </p>
                <p className="font-body text-xs text-charcoal-light">
                  9:00am &ndash; 12:00pm
                </p>
              </div>
            ))}
          </div>

          <div className="fade-up delay-3 mx-auto mt-8 max-w-md text-center">
            <div className="inline-flex items-center gap-2 rounded-xl bg-warm-white px-5 py-3 shadow-sm">
              <svg className="h-4 w-4 text-sage-dark shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
              </svg>
              <p className="font-body text-sm text-charcoal">
                <span className="font-semibold">SLAM Apollo</span> &mdash; 5150 North US Hwy 41, Apollo Beach, FL 33572
              </p>
            </div>
          </div>

          {/* Drop-off & Pickup */}
          <div className="fade-up delay-3 mx-auto mt-10 max-w-2xl">
            <div className="rounded-2xl bg-warm-white p-6 shadow-sm md:p-8">
              <p className="mb-4 text-center font-body text-[10px] font-bold uppercase tracking-[0.3em] text-sage-dark">
                Drop-off &amp; Pickup
              </p>
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="rounded-xl bg-sage/8 p-5">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wider text-sage-dark">
                    Morning Drop-off
                  </p>
                  <p className="mt-1 font-serif text-xl font-light text-charcoal">
                    8:50 &ndash; 9:05am
                  </p>
                </div>
                <div className="rounded-xl bg-sage/8 p-5">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wider text-sage-dark">
                    Afternoon Pickup
                  </p>
                  <p className="mt-1 font-serif text-xl font-light text-charcoal">
                    11:55am &ndash; 12:10pm
                  </p>
                </div>
              </div>
              <p className="mt-5 font-body text-sm leading-relaxed text-charcoal-light">
                Rachel will meet families <span className="font-semibold text-charcoal">outside SLAM Apollo</span> for
                drop-off and pickup, with a sign-in / sign-out sheet to track every child.
              </p>
              <p className="mt-2 font-body text-sm leading-relaxed text-charcoal-light">
                Photo ID may be required for pickup during the first few days
                or any time someone unfamiliar to staff is collecting your child.
                Please list authorized pickup people on your registration form.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Three Pillars: Spirit, Mind, Body */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-peach/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-sage/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
              What We Do
            </p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              A Holistic <span className="italic">Approach</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Each session weaves together spirit, mind, and body activities to
              create a rich, engaging experience that meets children where they
              are.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Spirit */}
            <div className="fade-up group rounded-2xl bg-cream p-8 transition-all duration-500 hover:shadow-lg hover:shadow-sage/10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-peach/30">
                <svg
                  className="h-7 w-7 text-charcoal"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 font-serif text-2xl font-light text-charcoal">
                Spirit
              </h3>
              <p className="mb-5 font-body text-sm leading-relaxed text-charcoal-light">
                Grounding practices that help children connect to their inner
                calm, build self-awareness, and regulate their nervous systems.
              </p>
              <div className="space-y-2.5">
                {spiritActivities.map((activity) => (
                  <div
                    key={activity.name}
                    className="flex items-center gap-3 rounded-lg bg-warm-white px-4 py-2.5"
                  >
                    <span className="text-lg">{activity.icon}</span>
                    <span className="font-body text-sm text-charcoal">
                      {activity.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mind */}
            <div className="fade-up delay-2 group rounded-2xl bg-cream p-8 transition-all duration-500 hover:shadow-lg hover:shadow-sage/10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-sage/20">
                <svg
                  className="h-7 w-7 text-charcoal"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18"
                  />
                </svg>
              </div>
              <h3 className="mb-3 font-serif text-2xl font-light text-charcoal">
                Mind
              </h3>
              <p className="mb-5 font-body text-sm leading-relaxed text-charcoal-light">
                Creative, play-based cognitive activities that build
                communication, literacy, and executive functioning skills
                through joyful engagement.
              </p>
              <div className="space-y-2.5">
                {mindActivities.map((activity) => (
                  <div
                    key={activity.name}
                    className="flex items-center gap-3 rounded-lg bg-warm-white px-4 py-2.5"
                  >
                    <span className="text-lg">{activity.icon}</span>
                    <span className="font-body text-sm text-charcoal">
                      {activity.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className="fade-up delay-4 group rounded-2xl bg-cream p-8 transition-all duration-500 hover:shadow-lg hover:shadow-sage/10">
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-olive/15">
                <svg
                  className="h-7 w-7 text-charcoal"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                  />
                </svg>
              </div>
              <h3 className="mb-3 font-serif text-2xl font-light text-charcoal">
                Body
              </h3>
              <p className="mb-5 font-body text-sm leading-relaxed text-charcoal-light">
                Movement-rich activities with a different prop each week,
                featuring themed games that build coordination, social skills,
                and full-body engagement.
              </p>
              <div className="flex flex-wrap gap-2">
                {bodyActivities.map((activity) => (
                  <span
                    key={activity}
                    className="rounded-full bg-olive/10 px-3 py-1.5 font-body text-xs font-medium text-charcoal"
                  >
                    {activity}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative overflow-hidden bg-cream py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
              Common Questions
            </p>
            <h2 className="font-serif text-3xl font-light text-charcoal md:text-4xl">
              Frequently Asked <span className="italic">Questions</span>
            </h2>
          </div>

          <div className="fade-up delay-1 space-y-4">
            {[
              {
                q: "Who is this camp for?",
                a: "Mind. Body. Speech. is designed for rising 1st through 5th graders who want to close the summer gap on their IEP goals and/or improve their speech, language, social, literacy, and executive functioning skills.",
              },
              {
                q: "Does my child need a diagnosis to attend?",
                a: "No diagnosis is required. This camp is open to any child who would benefit from creative group speech and language therapy sessions.",
              },
              {
                q: "What does a typical day look like?",
                a: "Each session weaves together spirit activities (mindfulness, EFT tapping, breathing), mind activities (improv, literacy, music), and body activities (movement with props, sensory play) for a full, engaging experience.",
              },
              {
                q: "Can my child attend just one week?",
                a: "Yes! You can register for either week individually or both weeks. Each week is $300.",
              },
              {
                q: "What should my child bring?",
                a: "We recommend comfortable clothes they can move in, a water bottle, and a snack. All materials and props are provided.",
              },
              {
                q: "Where is the camp located?",
                a: "The camp is held at SLAM Apollo, located at 5150 North US Hwy 41, Apollo Beach, FL 33572.",
              },
              {
                q: "What is the group size?",
                a: "We keep groups small to ensure each child receives personalized attention and meaningful interaction during every session.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl bg-warm-white transition-all duration-300 hover:shadow-md hover:shadow-sage/5"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 font-body text-[15px] font-medium text-charcoal">
                  {faq.q}
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-sage transition-transform duration-300 group-open:rotate-45"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </summary>
                <div className="px-5 pb-5">
                  <p className="font-body text-sm leading-relaxed text-charcoal-light">
                    {faq.a}
                  </p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-sage/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Ready to <span className="italic">Enroll?</span>
            </h2>
            <p className="mb-8 font-body text-base leading-relaxed text-charcoal-light">
              Spaces are limited to ensure each child receives personalized
              attention. Register now to reserve your spot.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/camps/mind-body-speech/register"
                className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
              >
                Register Now
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center rounded-full border border-charcoal/20 px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-charcoal transition-all duration-300 hover:border-sage hover:text-sage-dark"
              >
                Have Questions? Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sage/10 bg-warm-white py-8">
        <div className="mx-auto max-w-6xl px-6 text-center lg:px-8">
          <p className="font-body text-xs text-charcoal-light">
            &copy; {new Date().getFullYear()} Conscious Speech Strategies. All
            rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
