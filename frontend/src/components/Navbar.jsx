import { motion } from "framer-motion";

export default function Navbar({ userName, onLogout }) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-3 z-50 mb-6 rounded-2xl border border-white/20 bg-slate-900/55 px-3 py-3 shadow-[0_12px_35px_rgba(2,6,23,0.55)] backdrop-blur-2xl md:px-5"
    >
      <div className="flex items-center justify-between gap-3">
        <motion.div whileHover={{ scale: 1.01 }} className="group flex items-center gap-2">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
          <span className="text-sm font-semibold tracking-wide text-slate-100 md:text-base">
            AI Resume Analyzer
          </span>
        </motion.div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <motion.span
          whileHover={{ scale: 1.03 }}
          className="max-w-[140px] truncate rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1 text-xs text-cyan-200 md:max-w-none md:px-3 md:text-sm"
        >
          {userName}
        </motion.span>
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.98 }}
          onClick={onLogout}
          className="rounded-lg border border-violet-400/45 bg-gradient-to-r from-indigo-500/20 to-violet-500/20 px-2.5 py-1.5 text-xs font-medium text-slate-100 transition hover:from-indigo-400/30 hover:to-violet-400/30 md:px-3 md:text-sm"
        >
          Logout
        </motion.button>
      </div>
    </motion.nav>
  );
}

