"use client";

import Image from "next/image";
import Link from "next/link";
import { useReveal } from "@/hooks/useReveal";

const weeks = [
  {
    number: 1,
    chakra: "Root Chakra",
    mantra: "I Am Safe",
    theme: "Grounding, stability, feeling secure in your body and space",
    color: "red",
    colorClass: "bg-red-500/15 text-red-700",
    dotClass: "bg-red-500",
    activities: [
      "Blindfold Obstacle Course: Move safely using sound, vibration, or intuition",
      '"Root to the Earth" Game: Balance standing still while visualizing growing roots from feet',
    ],
    herbal:
      "Sip calming herbal tea (like rooibos or tulsi); touch and smell grounding herbs like patchouli or cedar",
  },
  {
    number: 2,
    chakra: "Sacral Chakra",
    mantra: "I Feel",
    theme: "Emotions, creativity, playfulness",
    color: "orange",
    colorClass: "bg-orange-500/15 text-orange-700",
    dotClass: "bg-orange-500",
    activities: [
      "Emotional Scent Matching: Blindfolded, smell herbs and describe the emotion it evokes",
      'Intuitive Drawing: Blindfolded drawing of "what your heart feels today"',
    ],
    herbal:
      "Create orange peel sachets or blends with calendula, clove, and cinnamon",
  },
  {
    number: 3,
    chakra: "Solar Plexus Chakra",
    mantra: "I Can",
    theme: "Confidence, willpower, inner strength, leadership",
    color: "yellow",
    colorClass: "bg-yellow-500/15 text-yellow-700",
    dotClass: "bg-yellow-500",
    activities: [
      '"Yes I Can!" Relay: Confidence-building tasks while blindfolded',
      "Ninja Energy Catch: Kids try to catch gentle energy pulses or floating scarves",
    ],
    herbal:
      'Sip ginger or lemon balm tea; create sun-charged "power pouches"',
  },
  {
    number: 4,
    chakra: "Heart & Throat Chakra",
    mantra: "I Love & I Express",
    theme: "Compassion, empathy, connection, communication, expression",
    color: "green",
    colorClass: "bg-emerald-500/15 text-emerald-700",
    dotClass: "bg-emerald-500",
    activities: [
      "Tone Tag: Use sound (humming, singing, chimes) to tag or guide friends",
      "Blindfold Word Reading: Read color words, phrases, or images using inner vision",
      "Blindfolded Trust Walk: Paired partners guide each other with hand pulses or sound",
      '"Feel the Heart" Game: Guess emotions silently shared through energy or touch',
    ],
    herbal:
      "Blend throat-friendly teas (licorice root, thyme, fennel); work with rose, hibiscus, or peppermint for heart-opening tea and rose petal art",
  },
  {
    number: 5,
    chakra: "Third Eye & Crown",
    mantra: "I See & I Am",
    theme: "Intuition, insight, connection to all",
    color: "purple",
    colorClass: "bg-purple-500/15 text-purple-700",
    dotClass: "bg-purple-500",
    activities: [
      "Blindfold Book/Picture Reading: Practice intuitive reading or picture sensing",
      'Guided Visualization: Meet your "intuitive ninja guide" during a meditation',
    ],
    herbal:
      "Mugwort dream satchels, lavender, and pine for intuitive clarity",
  },
];

const highlights = [
  "Read words and pictures blindfolded",
  "Sense energy fields and play with ninja props",
  "Brew calming herbal potions",
  "Develop ninja senses through herbal, energy, and sensory play",
];

export default function NinjaTrainingCamp() {
  const ref = useReveal();

  return (
    <div ref={ref} className="min-h-screen bg-warm-white">
      {/* Back navigation */}
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
            src="/images/camp-ninja-training.png"
            alt="Blindfolded children doing ninja balance training in a garden"
            fill
            className="object-cover object-[50%_20%]"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-warm-white via-charcoal/20 to-charcoal/30" />
          <div className="absolute bottom-8 left-0 right-0">
            <div className="mx-auto max-w-6xl px-6 lg:px-8">
              <span className="inline-block rounded-full bg-olive/90 px-4 py-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                Summer 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Title & Intro */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-olive/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-peach/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-5xl font-light text-charcoal md:text-6xl lg:text-7xl">
              Intuitive Ninja <span className="italic">Training</span>
            </h1>
            <p className="mb-6 font-body text-lg leading-relaxed text-charcoal-light md:text-xl">
              A playful and powerful space where kids learn to &ldquo;see&rdquo;
              from the inside out. With blindfolds on and spirits wide open,
              children explore movement, nature, sound, energy, and learn to
              trust in their own senses.
            </p>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Through this unique blend of intuition training, sensory
              exploration, and herbal play, children experience meaningful
              growth in confidence, discipline, and self-regulation &mdash; all
              while having a blast.
            </p>
            <p className="mt-4 font-serif text-lg italic text-olive">
              Part Ninja academy, part inner journey, all heart.
            </p>
          </div>

          {/* Highlights */}
          <div className="fade-up delay-1 mx-auto mt-12 max-w-2xl">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="flex items-start gap-3 rounded-xl bg-cream px-5 py-4"
                >
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-olive/20">
                    <div className="h-1.5 w-1.5 rounded-full bg-olive" />
                  </div>
                  <span className="font-body text-sm text-charcoal">
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick details */}
          <div className="fade-up delay-2 mx-auto mt-12 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                Who
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                Kids
              </p>
              <p className="font-body text-xs text-charcoal-light">
                Ages 5&ndash;12
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                When
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                Tuesdays
              </p>
              <p className="font-body text-xs text-charcoal-light">
                4:30&ndash;5:30pm
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                Dates
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                5 Sessions
              </p>
              <p className="font-body text-xs text-charcoal-light">
                June 16&ndash;July 14
              </p>
            </div>
            <div className="rounded-2xl bg-cream p-5 text-center">
              <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                Investment
              </p>
              <p className="mt-1 font-body text-sm font-medium text-charcoal">
                $120
              </p>
              <p className="font-body text-xs text-charcoal-light">
                all 5 sessions
              </p>
            </div>
          </div>

          {/* Additional pricing & registration info */}
          <div className="fade-up delay-3 mx-auto mt-8 max-w-2xl text-center">
            <div className="rounded-2xl bg-olive/8 px-6 py-5">
              <p className="font-body text-sm text-charcoal">
                <span className="font-semibold">Drop-in:</span> $30 per class
                &nbsp;&bull;&nbsp;
                <span className="font-semibold">Registration fee:</span> $30
                (covers mask &amp; materials)
              </p>
              <p className="mt-2 font-body text-sm text-charcoal-light">
                Scholarships available &mdash; no one turned away due to cost.
              </p>
              <p className="mt-2 font-body text-sm text-charcoal-light">
                Private residence in Gulfport &bull; Address shared upon registration
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Quote */}
      <section className="relative overflow-hidden bg-cream py-12 md:py-16">
        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-3xl text-center">
            <blockquote className="font-serif text-xl font-light italic leading-relaxed text-charcoal-light md:text-2xl">
              &ldquo;Here at Intuitive Ninja Training, we teach you how to be
              excellent fighters by developing your most powerful weapon &mdash;
              your mind. By teaching you to be still, and to notice the world
              around you. To act based on intuition and thoughts, not
              emotion.&rdquo;
            </blockquote>
          </div>
        </div>
      </section>

      {/* Meet Your Senseis */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute -top-32 -right-32 h-72 w-72 rounded-full bg-olive/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-peach/8 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-olive">
              Meet Your Senseis
            </p>
            <h2 className="font-serif text-3xl font-light text-charcoal md:text-4xl">
              The team behind <span className="italic">Intuitive Ninja</span>
            </h2>
          </div>

          {/* Rachel — photo left, text right */}
          <div className="fade-up delay-1 mb-16 grid items-center gap-8 md:grid-cols-5 md:gap-12">
            <div className="md:col-span-2">
              <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl shadow-md md:max-w-none">
                <Image
                  src="/images/rachel-totem.jpg"
                  alt="Rachel Degani with her wife and son"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
            <div className="md:col-span-3">
              <h3 className="mb-1 font-serif text-2xl font-light text-charcoal">
                Rachel Degani
              </h3>
              <p className="mb-4 font-body text-[11px] font-bold uppercase tracking-wider text-olive">
                Founder, Conscious Speech Strategies &middot; M.S., CCC-SLP
              </p>
              <p className="font-body text-[15px] leading-relaxed text-charcoal-light">
                Rachel is the founder of Conscious Speech Strategies, a
                speech-language pathologist, fire spinner/prop manipulator,
                laughter yoga instructor, and Infinite Child
                Institute&ndash;certified teacher in blindfolded seeing for
                children. A proud mama herself, she believes in raising a
                generation of children who are brave, compassionate,
                self-reliant, and tuned in to their own intuition. Playful and
                movement-based by nature, Rachel weaves curiosity, creativity,
                and embodied awareness into every session, because she knows
                children learn best when they&rsquo;re laughing, moving, and
                trusted.
              </p>
            </div>
          </div>

          {/* Christina — text left, photo right */}
          <div className="fade-up delay-2 grid items-center gap-8 md:grid-cols-5 md:gap-12">
            <div className="md:order-2 md:col-span-2">
              <div className="relative mx-auto aspect-square max-w-sm overflow-hidden rounded-2xl shadow-md md:max-w-none">
                <Image
                  src="/images/christina-prestero.jpg"
                  alt="Christina Prestero"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 40vw"
                />
              </div>
            </div>
            <div className="md:order-1 md:col-span-3">
              <h3 className="mb-1 font-serif text-2xl font-light text-charcoal">
                Christina Prestero
              </h3>
              <p className="mb-4 font-body text-[11px] font-bold uppercase tracking-wider text-olive">
                Founder, Quantum Herbalism
              </p>
              <p className="font-body text-[15px] leading-relaxed text-charcoal-light">
                Christina is a nature-based educator, mother, and founder of
                Quantum Herbalism. She weaves together herbal sensory
                experiences, intuitive development, movement, creativity, and
                grounded mindfulness to create playful, heart-centered
                experiences for children and families. Her work encourages
                curiosity, confidence, embodiment, and connection with both
                nature and self through imaginative and engaging practices.{" "}
                <a
                  href="https://quantumherbalism.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-olive underline decoration-olive/40 underline-offset-2 transition-colors hover:text-olive hover:decoration-olive"
                >
                  quantumherbalism.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Weekly Curriculum */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="pointer-events-none absolute -top-32 -left-32 h-72 w-72 rounded-full bg-peach/8 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-72 w-72 rounded-full bg-olive/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-16 max-w-2xl text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-olive">
              The Curriculum
            </p>
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              A Chakra-Guided <span className="italic">Journey</span>
            </h2>
            <p className="font-body text-base leading-relaxed text-charcoal-light">
              Each week focuses on a different energy center, building from
              grounding and safety all the way up to intuition and inner vision.
            </p>
          </div>

          <div className="space-y-6">
            {weeks.map((week, i) => (
              <div
                key={week.number}
                className={`fade-up delay-${Math.min(i + 1, 6)} rounded-2xl bg-cream p-6 transition-all duration-300 hover:shadow-md hover:shadow-sage/10 md:p-8`}
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
                  {/* Week number & chakra */}
                  <div className="flex-shrink-0 md:w-48">
                    <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-full ${week.colorClass}`}
                      >
                        <span className="font-body text-sm font-bold">
                          {week.number}
                        </span>
                      </div>
                      <div>
                        <p className="font-serif text-lg font-medium text-charcoal">
                          {week.chakra}
                        </p>
                        <p className="font-body text-sm italic text-charcoal-light">
                          &ldquo;{week.mantra}&rdquo;
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 font-body text-xs text-charcoal-light">
                      {week.theme}
                    </p>
                  </div>

                  {/* Activities & Herbal */}
                  <div className="flex-1">
                    <div className="mb-4">
                      <p className="mb-2 font-body text-[10px] font-bold uppercase tracking-wider text-charcoal">
                        Activities
                      </p>
                      <ul className="space-y-2">
                        {week.activities.map((activity) => (
                          <li
                            key={activity}
                            className="flex items-start gap-2.5 font-body text-sm leading-relaxed text-charcoal-light"
                          >
                            <div
                              className={`mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${week.dotClass}`}
                            />
                            {activity}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-xl bg-warm-white px-4 py-3">
                      <p className="font-body text-[10px] font-bold uppercase tracking-wider text-olive">
                        Herbal Tie-In
                      </p>
                      <p className="mt-1 font-body text-sm text-charcoal-light">
                        {week.herbal}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="relative overflow-hidden bg-cream py-16 md:py-20">
        <div className="relative mx-auto max-w-3xl px-6 lg:px-8">
          <div className="fade-up mx-auto mb-12 text-center">
            <p className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.3em] text-olive">
              Common Questions
            </p>
            <h2 className="font-serif text-3xl font-light text-charcoal md:text-4xl">
              Frequently Asked <span className="italic">Questions</span>
            </h2>
          </div>

          <div className="fade-up delay-1 space-y-4">
            {[
              {
                q: "What age is this program for?",
                a: "Intuitive Ninja Training is designed for children ages 5 through 12.",
              },
              {
                q: "Does my child need any prior experience?",
                a: "No prior experience is needed. This program meets every child where they are, whether they're naturally intuitive or just beginning to explore their senses.",
              },
              {
                q: "What will my child actually be doing?",
                a: "Each session includes blindfold training, sensory exploration, energy play, herbal tea making, guided visualizations, and movement games — all guided by a chakra-based weekly theme.",
              },
              {
                q: "Is the blindfold training safe?",
                a: "Absolutely. All blindfold activities are carefully supervised and designed for fun and exploration, not competition. Children are always in a safe, controlled environment.",
              },
              {
                q: "Can I drop in for a single session?",
                a: "Yes! Drop-in sessions are $30 per class. The full 5-session package is $120. There is a one-time $30 registration fee for the mask and materials.",
              },
              {
                q: "Are scholarships available?",
                a: "Yes — no one will be turned away due to cost. Reach out to Rachel directly to discuss scholarship options.",
              },
              {
                q: "Where is the program held?",
                a: "Sessions are held at a private residence in Gulfport. The exact address will be shared upon registration.",
              },
            ].map((faq, i) => (
              <details
                key={i}
                className="group rounded-xl bg-warm-white transition-all duration-300 hover:shadow-md hover:shadow-olive/5"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 font-body text-[15px] font-medium text-charcoal">
                  {faq.q}
                  <svg
                    className="h-5 w-5 flex-shrink-0 text-olive transition-transform duration-300 group-open:rotate-45"
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
        <div className="pointer-events-none absolute -top-20 right-0 h-40 w-40 rounded-full bg-olive/10 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
          <div className="fade-up mx-auto max-w-2xl text-center">
            <h2 className="mb-4 font-serif text-3xl font-light text-charcoal md:text-4xl">
              Ready to <span className="italic">Train?</span>
            </h2>
            <p className="mb-3 font-body text-base leading-relaxed text-charcoal-light">
              Spaces are limited. Register now to secure your spot and receive
              the Gulfport location address.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/camps/ninja-training/register"
                className="inline-flex items-center gap-2 rounded-full bg-olive px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-white transition-all duration-300 hover:bg-olive/80 hover:shadow-lg hover:shadow-olive/20"
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
                className="inline-flex items-center rounded-full border border-charcoal/20 px-8 py-3.5 font-body text-sm font-semibold uppercase tracking-wider text-charcoal transition-all duration-300 hover:border-olive hover:text-olive"
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
