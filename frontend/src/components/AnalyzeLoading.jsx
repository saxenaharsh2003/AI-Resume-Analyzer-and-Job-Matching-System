import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export function DashboardSkeleton() {
  const shimmer = "animate-pulse rounded-xl bg-slate-800/65";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-6 space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className={`h-24 ${shimmer}`} />
        <div className={`h-24 ${shimmer}`} />
        <div className={`h-24 ${shimmer}`} />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`h-80 ${shimmer}`} />
        <div className={`h-80 ${shimmer}`} />
      </div>
      <div className={`h-56 ${shimmer}`} />
    </motion.div>
  );
}

export default function AnalyzeLoading({ active }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    setProgress(4);
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 92) return prev;
        const next = prev + Math.max(1, (100 - prev) * 0.08);
        return Math.min(92, Math.round(next));
      });
    }, 200);
    return () => clearInterval(timer);
  }, [active]);

  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="glass-card neon-ring mt-4 p-4 md:p-5"
        >
          <div className="mb-3 flex items-center gap-3">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1.1, ease: "linear" }}
              className="h-5 w-5 rounded-full border-2 border-cyan-300/40 border-t-cyan-300"
            />
            <p className="text-sm font-medium text-slate-200 md:text-base">
              Analyzing your resume...
            </p>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 shadow-[0_0_18px_rgba(99,102,241,0.9)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            />
          </div>
          <div className="mt-1 text-right text-xs text-cyan-200/90">{progress}%</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

