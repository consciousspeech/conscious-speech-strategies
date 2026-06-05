"use client";

import { useReveal } from "@/hooks/useReveal";

export default function Hero() {
  const ref = useReveal();

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-cream pt-20 pb-64 lg:pt-24 lg:pb-0"
    >
      {/* Decorative background elements */}
      <div className="pointer-events-none absolute inset-0">
        {/* Large sage circle */}
        <div className="breathe absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full bg-sage/10" />
        {/* Peach accent */}
        <div className="breathe absolute -bottom-20 -left-20 h-[350px] w-[350px] rounded-full bg-peach/15" style={{ animationDelay: "3s" }} />
        {/* Olive dot */}
        <div className="float absolute top-1/4 left-[15%] h-3 w-3 rounded-full bg-olive/20" style={{ animationDelay: "1s" }} />
        <div className="float absolute top-[60%] right-[20%] h-2 w-2 rounded-full bg-sage/30" style={{ animationDelay: "2.5s" }} />
      </div>

      {/* Grain overlay */}
      <div className="grain pointer-events-none absolute inset-0" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 text-center lg:px-8">
        {/* Small decorative line */}
        <div className="fade-up mx-auto mb-8 h-[1px] w-12 bg-sage" />

        <p className="fade-up delay-1 mb-6 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
          Holistic Speech-Language Therapy
        </p>

        <h1 className="fade-up delay-2 font-serif text-5xl font-light leading-[1.15] text-charcoal md:text-6xl lg:text-7xl">
          Where communication
          <br />
          <span className="italic text-sage-dark">transforms</span> into a
          <br />
          vibrant expression
          <br />
          of self
        </h1>

        <p className="fade-up delay-3 mx-auto mt-8 max-w-xl font-body text-base font-light leading-relaxed text-charcoal-light md:text-lg">
          Integrating mind, body, and spirit to empower children&apos;s
          communication skills and foster lifelong connections.
        </p>

        <div className="fade-up delay-4 mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="#services"
            className="group inline-flex items-center gap-2 rounded-full bg-sage px-8 py-3.5 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-all duration-300 hover:bg-sage-dark hover:shadow-lg hover:shadow-sage/20"
          >
            Explore Our Services
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="/services#intake"
            className="group inline-flex items-center gap-2 rounded-full border border-sage/40 bg-sage/5 px-8 py-3.5 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-sage-dark transition-all duration-300 hover:bg-sage/10 hover:border-sage"
          >
            Want to be a Private Student?
            <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </a>
          <a
            href="#contact"
            className="inline-flex items-center rounded-full border border-charcoal/20 px-8 py-3.5 font-body text-[13px] font-semibold uppercase tracking-[0.12em] text-charcoal transition-all duration-300 hover:border-sage hover:text-sage-dark"
          >
            Get in Touch
          </a>
        </div>

        {/* Location pill */}
        <p className="fade-up delay-5 mt-12 inline-flex items-center gap-2 font-body text-xs font-medium tracking-wider text-charcoal-light/60">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 0115 0z" />
          </svg>
          GULFPORT, FLORIDA
        </p>
      </div>

      {/* Scroll indicator */}
      <div className="fade-in delay-6 absolute bottom-8 left-1/2 z-10 -translate-x-1/2 hidden lg:flex lg:left-[8%] lg:translate-x-0">
        <div className="flex flex-col items-center gap-2">
          <span className="font-body text-[10px] uppercase tracking-[0.2em] text-charcoal-light/40">
            Scroll
          </span>
          <div className="h-8 w-[1px] animate-pulse bg-sage/40" />
        </div>
      </div>
    </section>
  );
}
