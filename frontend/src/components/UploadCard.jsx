import { motion } from "framer-motion";
import { useState } from "react";

export default function UploadCard({ setFile, handleUpload, loading }) {
  const [ripple, setRipple] = useState({ x: 0, y: 0, key: 0 });

  const onClickAnalyze = async (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      key: Date.now(),
    });
    await handleUpload();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="p-3 md:p-4"
    >
      <p className="typo-subtitle mb-3 text-sm">
        Upload your resume in PDF or DOCX format.
      </p>
      <input
        type="file"
        accept=".pdf,.docx"
        onChange={(e) => setFile(e.target.files[0])}
        className="mb-4 w-full rounded-lg border border-white/20 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 file:mr-4 file:rounded-md file:border-0 file:bg-indigo-500 file:px-3 file:py-2 file:text-white hover:file:bg-indigo-600"
      />

      <motion.button
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={onClickAnalyze}
        className="relative w-full overflow-hidden rounded-lg bg-gradient-to-r from-indigo-500 to-violet-500 px-4 py-2.5 font-semibold text-white transition hover:scale-[1.01] hover:from-indigo-400 hover:to-violet-400 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={loading}
      >
        <span key={ripple.key} className="pointer-events-none absolute block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/50 ripple-animate" style={{ left: ripple.x, top: ripple.y }} />
        {loading ? "Analyzing..." : "Analyze Resume"}
      </motion.button>
    </motion.div>
  );
}