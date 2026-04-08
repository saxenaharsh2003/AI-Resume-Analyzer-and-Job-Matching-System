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

  const skills = result?.skills || [];
  const education = result?.education || [];
  const experience = result?.experience || [];
  const projects = result?.projects || [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      <SectionList title="Skills" items={skills} />
      <SectionList title="Education" items={education} />
      <SectionList title="Experience" items={experience} />
      <SectionList title="Projects" items={projects} />
    </motion.section>
  );
}