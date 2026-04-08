import { motion } from "framer-motion";

export default function Loader({ label = "Loading...", fullscreen = false }) {
  return (
    <div
      className={`flex items-center justify-center ${
        fullscreen ? "min-h-screen" : "min-h-[180px]"
      }`}
    >
      <div className="glass-card neon-ring w-full max-w-sm p-6 text-center">
        <div className="mx-auto mb-3 h-11 w-11">
          <motion.div
            className="h-full w-full rounded-full border-4 border-indigo-400/25 border-t-cyan-300"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, ease: "linear", duration: 1 }}
          />
        </div>
        <p className="text-sm text-slate-200">{label}</p>
      </div>
    </div>
  );
}
