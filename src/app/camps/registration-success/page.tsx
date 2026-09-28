"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

const FORMSPREE_IDS: Record<string, string> = {
  "Mind Body Speech": "mwvnggra",
  "Intuitive Ninja Training": "mdalqqwq",
};

export default function RegistrationSuccess() {
  const hasSent = useRef(false);

  useEffect(() => {
    // Send saved registration data to Rachel via Formspree (runs once after payment)
    if (hasSent.current) return;
    hasSent.current = true;

    const data = localStorage.getItem("campRegistration");
    if (!data) return;

    const parsed = JSON.parse(data);
    const formspreeId = FORMSPREE_IDS[parsed.Camp];
    if (!formspreeId) return;

    fetch(`https://formspree.io/f/${formspreeId}`, {
      method: "POST",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: data,
    })
      .then(() => {
        localStorage.removeItem("campRegistration");
      })
      .catch(() => {
        // Keep in localStorage so it could be retried
      });
  }, []);

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Nav */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md shadow-[0_1px_0_rgba(170,195,192,0.3)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
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
        </div>
      </div>

      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 pt-20 pb-20 lg:px-8">
        {/* Success icon */}
        <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-sage/15">
          <svg
            className="h-12 w-12 text-sage-dark"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-center font-serif text-4xl font-light text-charcoal md:text-5xl">
          You&apos;re All Set!
        </h1>

        <p className="mb-8 max-w-md text-center font-body text-base leading-relaxed text-charcoal-light md:text-[17px]">
          Thank you for registering! Your payment has been received and
          Rachel will reach out soon to confirm your child&apos;s spot
          and share all the details for camp.
        </p>

        {/* What to expect card */}
        <div className="mb-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="mb-5 font-serif text-xl font-light text-charcoal">
            What Happens Next
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage/15">
                <span className="font-body text-xs font-bold text-sage-dark">1</span>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal">
                  Confirmation Email
                </p>
                <p className="font-body text-sm text-charcoal-light">
                  You&apos;ll receive a payment receipt from Stripe shortly.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage/15">
                <span className="font-body text-xs font-bold text-sage-dark">2</span>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal">
                  Rachel Will Be in Touch
                </p>
                <p className="font-body text-sm text-charcoal-light">
                  Expect a personal message from Rachel within 1&ndash;2 business
                  days with camp details and what to bring.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-sage/15">
                <span className="font-body text-xs font-bold text-sage-dark">3</span>
              </div>
              <div>
                <p className="font-body text-sm font-semibold text-charcoal">
                  Get Ready for Camp!
                </p>
                <p className="font-body text-sm text-charcoal-light">
                  We can&apos;t wait to meet your little one and help them
                  shine.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Questions box */}
        <div className="mb-10 w-full max-w-md rounded-xl border border-sage/15 bg-cream p-5">
          <p className="text-center font-body text-sm text-charcoal-light">
            Questions? Reach out to Rachel at{" "}
            <a
              href="mailto:consciousspeech.net@gmail.com"
              className="font-semibold text-sage-dark underline decoration-sage/30 underline-offset-2 transition-colors hover:text-sage"
            >
              consciousspeech.net@gmail.com
            </a>
          </p>
        </div>

        {/* Back to home */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
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
          Back to Home
        </Link>
      </div>
    </div>
  );
}
