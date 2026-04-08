import { motion } from "framer-motion";

export default function SkillBar({ label, value, delay = 0 }) {
  const safeValue = Math.max(0, Math.min(100, value || 0));

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="capitalize">{label}</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-700/60">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          transition={{ duration: 0.8, delay }}
          className="h-2 rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500"
        />
      </div>
    </div>
  );
}

