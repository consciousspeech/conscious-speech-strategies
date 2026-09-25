"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";

export default function Programs() {
  const ref = useReveal();

  return (
    <section
      id="programs"
      ref={ref}
      className="relative overflow-hidden bg-warm-white py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Header */}
        <div className="fade-up mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Summer Programs
          </p>
          <h2 className="mb-6 font-serif text-4xl font-light text-charcoal md:text-5xl">
            Beyond the <span className="italic">Session</span>
          </h2>
          <p className="font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Immersive summer programs that bring our holistic philosophy to life
            through extended group experiences.
          </p>
        </div>

        {/* Program cards */}
        {/* One programme runs at present, so the card is centred rather than
            sitting in a half-empty two-column grid. */}
        <div className="mx-auto grid max-w-xl gap-10 md:gap-8 lg:gap-12">
          {/* Intuitive Ninja Training */}
          <Link href="/camps/ninja-training" className="fade-up group relative block overflow-hidden rounded-2xl bg-cream transition-all duration-500 hover:shadow-xl hover:shadow-sage/10">
            {/* Image header */}
            <div className="relative h-56 overflow-hidden">
              <Image
                src="/images/camp-ninja-training.png"
                alt="Blindfolded children doing ninja balance training in a garden"
                fill
                className="object-cover object-[50%_20%] transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-charcoal/10 to-transparent" />
              <div className="absolute bottom-4 left-5">
                <span className="inline-block rounded-full bg-olive/90 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                  Summer Program
                </span>
              </div>
            </div>

            <div className="p-7 md:p-8">
              <h3 className="mb-2 font-serif text-3xl font-light text-charcoal">
                Intuitive Ninja Training
              </h3>
              <p className="mb-5 font-body text-[15px] leading-[1.8] text-charcoal-light">
                A playful and powerful space where kids learn to &ldquo;see&rdquo;
                from the inside out. With blindfolds on and spirits wide open,
                children explore movement, nature, sound, and energy &mdash;
                building confidence, discipline, and self-regulation while having
                a blast.
              </p>

              {/* Details grid */}
              <div className="mb-6 grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                    Schedule
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    Tuesdays, 4:30&ndash;5:30pm
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                    Investment
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    $120 / 5 sessions
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                    Ages
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    5&ndash;12 years old
                  </p>
                </div>
                <div className="rounded-lg bg-warm-white p-3">
                  <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                    Dates
                  </p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">
                    June 16&ndash;July 14
                  </p>
                </div>
              </div>

              {/* Activities */}
              <div className="mb-6 flex flex-wrap gap-2">
                {[
                  "Blindfold Training",
                  "Energy Play",
                  "Herbal Potions",
                  "Sensory Exploration",
                  "Mindfulness",
                  "Chakra Journey",
                ].map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-olive/10 px-3 py-1 font-body text-xs font-medium text-olive"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <span className="inline-flex items-center gap-2 font-body text-sm font-semibold text-olive transition-colors duration-300 group-hover:text-olive-light">
                Learn More
                <svg
                  className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
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
              </span>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
