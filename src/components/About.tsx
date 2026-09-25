"use client";

import Image from "next/image";
import { useReveal } from "@/hooks/useReveal";

export default function About() {
  const ref = useReveal();

  return (
    <section
      id="about"
      ref={ref}
      className="relative overflow-hidden bg-warm-white pt-32 pb-24 md:pt-40 md:pb-32"
    >
      {/* Decorative */}
      <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-peach/10 blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        {/* Section label */}
        <div className="fade-up mb-16 text-center">
          <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-sage-dark">
            Our Speech-Language Pathologist
          </p>
          <h2 className="font-serif text-4xl font-light text-charcoal md:text-5xl">
            Meet Rachel
          </h2>
        </div>

        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-16 lg:gap-24">
          {/* Image side */}
          <div className="slide-left relative">
            <div className="relative mx-auto aspect-[3/4] max-w-sm overflow-hidden rounded-2xl">
              <Image
                src="/images/new-hero.avif"
                alt="Rachel - Speech Language Pathologist"
                fill
                className="object-cover object-[50%_25%]"
                sizes="(max-width: 768px) 100vw, 400px"
              />
              {/* Subtle overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/10 to-transparent" />
            </div>
            {/* Floating accent card */}
            <div className="absolute -bottom-4 -right-4 rounded-xl bg-sage/90 px-5 py-3 text-white shadow-lg backdrop-blur-sm md:-right-8">
              <p className="font-serif text-2xl font-medium">20+</p>
              <p className="font-body text-[11px] font-semibold uppercase tracking-wider">
                Years with Children
              </p>
            </div>
          </div>

          {/* Text side */}
          <div className="slide-right">
            <p className="mb-6 font-body text-base leading-[1.85] text-charcoal-light md:text-[17px]">
              Rachel is a dedicated speech-language pathologist driven by her
              passion for empowering children through communication. She has over
              ten years of experience in private practice and five years within
              the school system.
            </p>
            <p className="mb-8 font-body text-base leading-[1.85] text-charcoal-light md:text-[17px]">
              Working professionally with children for two decades, Rachel&apos;s
              expertise is grounded in a deep understanding of child development.
              As a proud mother of two, she brings a nurturing touch to her
              practice, specializing in{" "}
              <span className="font-medium text-charcoal">
                fluency, articulation, and literacy
              </span>
              .{" "}
              <span className="font-medium text-charcoal">
                Talk Yoga certified
              </span>
              , she integrates executive functioning skills, improv games, and
              mindfulness techniques to foster cognitive, social, and emotional
              growth in every child she serves.
            </p>

            {/* Education timeline */}
            <div className="fade-up border-l-2 border-sage/30 pl-6">
              <h3 className="mb-5 font-body text-[11px] font-bold uppercase tracking-[0.25em] text-sage-dark">
                Education
              </h3>

              <div className="mb-5">
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl font-medium text-olive">
                    2014
                  </span>
                  <div className="h-[1px] flex-1 bg-sage/20" />
                </div>
                <p className="mt-1.5 font-serif text-lg font-medium text-charcoal">
                  Master of Science
                </p>
                <p className="font-body text-sm text-charcoal-light">
                  Communication Disorders &mdash; University of South Florida
                </p>
              </div>

              <div>
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-xl font-medium text-olive">
                    2012
                  </span>
                  <div className="h-[1px] flex-1 bg-sage/20" />
                </div>
                <p className="mt-1.5 font-serif text-lg font-medium text-charcoal">
                  Bachelor of Science
                </p>
                <p className="font-body text-sm text-charcoal-light">
                  Communication Disorders &mdash; University of Central Florida
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
