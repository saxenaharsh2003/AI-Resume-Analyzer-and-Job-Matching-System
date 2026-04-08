import { motion } from "framer-motion";

function SectionList({ title, items }) {
  return (
    <motion.div whileHover={{ scale: 1.015 }} className="glass-card neon-ring p-4 transition-shadow">
      <h3 className="typo-label mb-2 text-sm">{title}</h3>
      {items?.length ? (
        <ul className="space-y-1 text-sm text-slate-200">
          {items.map((item, idx) => (
            <li key={`${title}-${idx}`} className="rounded-md border border-white/10 bg-slate-900/40 px-2 py-1.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-400">No data found.</p>
      )}
    </motion.div>
  );
}

export default function ResultCard({ result }) {
  if (!result) return null;

  const name = result?.resume?.name || "Not found";
  const email = result?.resume?.email || "Not found";
  const score = Number(result?.analysis?.score || 0);
  const match = Number(result?.job_match?.match_percentage || 0);
  const skills = result?.resume?.skills || [];
  const education = (result?.resume?.education || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const experience = (result?.resume?.experience || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const projects = result?.resume?.projects || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <motion.div whileHover={{ scale: 1.015 }} className="glass-card neon-ring p-4 transition-shadow lg:col-span-2">
        <h3 className="typo-label mb-2 text-sm">Candidate Overview</h3>
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-200 md:grid-cols-4">
          <p><span className="text-slate-400">Name:</span> {name}</p>
          <p><span className="text-slate-400">Email:</span> {email}</p>
          <p><span className="text-slate-400">Score:</span> {score}</p>
          <p><span className="text-slate-400">Job Match:</span> {match}%</p>
        </div>
      </motion.div>
      <SectionList title="Skills" items={skills} />
      <SectionList title="Education" items={education} />
      <SectionList title="Experience" items={experience} />
      <SectionList title="Projects" items={projects} />
    </motion.section>
  );
}