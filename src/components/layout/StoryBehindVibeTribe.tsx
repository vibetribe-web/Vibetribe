"use client";

import { motion } from "framer-motion";

export function StoryBehindVibeTribe() {
  return (
    <section id="about" className="scroll-mt-24 bg-[#f7f9fc] px-4 py-20 sm:px-6 lg:px-8">
      <motion.div
        className="mx-auto max-w-7xl"
        initial={{ opacity: 0, y: 14 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        viewport={{ once: true, amount: 0.25 }}
        whileInView={{ opacity: 1, y: 0 }}
      >
        <div className="mx-auto max-w-[820px] text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-teal-700">
            The Story Behind VibeTribe
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-4xl">
            Built so students never miss opportunities because they feel alone.
          </h2>

          <div className="mt-8 space-y-5 text-base leading-8 text-slate-700 sm:text-lg sm:leading-9">
            <p>VibeTribe started from something many students quietly experience.</p>



            <p>
              Not because students lack talent — but because they lack teammates,
              communication, or the right information at the right time.
            </p>

            <p>
              Many students stay away from hackathons simply because they feel left out
              or don’t know where to begin.
            </p>

            <p>
              That experience{" "}
              <span className="font-semibold text-teal-700">inspired VibeTribe.</span>
            </p>

            <p>
              We wanted to create a space where students can discover opportunities,
              find teammates, join communities, build projects, and grow together —
              without feeling excluded.
            </p>

            <p>Because talent should never stay hidden behind lack of connection.</p>

            <p>
              VibeTribe is a student collaboration ecosystem designed to help students
              participate,{" "}
              <span className="font-semibold text-slate-950">connect, and belong.</span>
            </p>
          </div>

          <p className="mt-8 text-xs font-medium text-slate-400">
            Built for students, by a student — Sneha Kalluru
          </p>
        </div>
      </motion.div>
    </section>
  );
}
