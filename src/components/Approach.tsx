"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

const pillars = [
  {
    title: "Mind",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    description:
      "Improv games, literacy activities, and cognitive exercises that spark joy in learning and build executive functioning skills.",
    color: "sage",
  },
  {
    title: "Body",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    description:
      "Movement-based activities, sensory play, and physical engagement that connect the body to communication and expression.",
    color: "olive",
  },
  {
    title: "Spirit",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    description:
      "Mindfulness, EFT tapping, and breathing exercises that ground children in self-awareness and emotional regulation.",
    color: "peach",
  },
];

export default function Approach() {
  const ref = useReveal();

  return (
    <section
      id="approach"
      ref={ref}
      className="relative overflow-hidden bg-cream py-24 md:py-32"
    >
      {/* Background shapes */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage/5" />
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section header */}
        <div className="fade-up mx-auto mb-20 max-w-2xl text-center">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Our Approach
          </p>
          <h2 className="mb-6 font-serif text-4xl font-light text-charcoal md:text-5xl">
            A Holistic Path to
            <br />
            <span className="italic">Communication</span>
          </h2>
          <p className="font-body text-base leading-relaxed text-charcoal-light md:text-lg">
            Whether in schools or summer programs, Rachel weaves these
            philosophies into every interaction &mdash; because learning thrives
            when infused with joy and engaged through multiple sensory pathways.
          </p>
        </div>

        {/* Three pillars */}
        <div className="grid gap-8 md:grid-cols-3 md:gap-6 lg:gap-10">
          {pillars.map((pillar, i) => (
            <div
              key={pillar.title}
              className={`fade-up delay-${i + 1} group relative rounded-2xl bg-warm-white p-8 transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-sage/5 md:p-10`}
            >
              {/* Icon */}
              <div
                className={`mb-6 inline-flex rounded-xl p-3 ${
                  pillar.color === "sage"
                    ? "bg-sage/10 text-sage-dark"
                    : pillar.color === "olive"
                    ? "bg-olive/10 text-olive"
                    : "bg-peach/30 text-charcoal-light"
                }`}
              >
                {pillar.icon}
              </div>

              <h3 className="mb-3 font-serif text-3xl font-light text-charcoal">
                {pillar.title}
              </h3>

              <p className="font-body text-[15px] leading-[1.8] text-charcoal-light">
                {pillar.description}
              </p>

              {/* Decorative bottom line */}
              <div
                className={`mt-6 h-[2px] w-8 transition-all duration-500 group-hover:w-16 ${
                  pillar.color === "sage"
                    ? "bg-sage"
                    : pillar.color === "olive"
                    ? "bg-olive"
                    : "bg-peach"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Editorial image + quote */}
        <div className="mx-auto mt-24 grid max-w-5xl items-center gap-10 md:grid-cols-5 md:gap-16">
          <div className="fade-up relative md:col-span-2">
            <div className="absolute -inset-3 rounded-[2rem] border border-sage/20" />
            <div className="absolute -inset-1 rounded-[1.5rem] bg-sage/5 blur-xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.5rem] shadow-xl shadow-charcoal/10">
              <Image
                src="/images/rachel-with-child.jpg"
                alt="Rachel sharing a playful moment with a child"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
            </div>
          </div>
          <div className="fade-up delay-1 md:col-span-3">
            <blockquote className="font-serif text-2xl font-light italic leading-relaxed text-charcoal-light md:text-3xl">
              &ldquo;Join us on a journey where communication transforms into a
              vibrant expression of self, enriching lives and building bridges
              that span far beyond words.&rdquo;
            </blockquote>
          </div>
        </div>
      </div>
    </section>
  );
}
