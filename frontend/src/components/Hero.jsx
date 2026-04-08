import { motion } from "framer-motion";

export default function Hero() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative mb-8 overflow-hidden rounded-3xl border border-white/15 bg-slate-900/35 p-7 backdrop-blur-2xl md:p-10"
    >
      <motion.div
        aria-hidden
        animate={{ x: ["-30%", "130%"] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: "linear" }}
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-cyan-300/20 to-transparent blur-xl"
      />

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="hero-glow-title typo-title text-transparent md:text-6xl"
      >
        AI Resume Analyzer
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.5 }}
        className="typo-subtitle mt-3 max-w-2xl text-slate-200/90 md:text-lg"
      >
        Upload, parse, and visualize resume quality with interactive insights, match analytics, and modern motion UI.
      </motion.p>

      <div className="mt-5 flex flex-wrap gap-2">
        <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">AI Insights</span>
        <span className="rounded-full border border-indigo-300/30 bg-indigo-300/10 px-3 py-1 text-xs text-indigo-200">ATS Scoring</span>
        <span className="rounded-full border border-violet-300/30 bg-violet-300/10 px-3 py-1 text-xs text-violet-200">Job Match</span>
      </div>
    </motion.section>
  );
}

