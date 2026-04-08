import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { BriefcaseBusiness, Gauge, Target, UserRound } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import SkillBar from "./SkillBar";

const PIE_COLORS = ["#22d3ee", "#6366f1"];

function buildSkillData(skills, result) {
  const pool = [
    ...(result?.resume?.experience ? [result.resume.experience] : []),
    ...(result?.resume?.projects || []),
    ...(result?.resume?.education ? [result.resume.education] : []),
  ]
    .join(" ")
    .toLowerCase();

  return (skills || []).slice(0, 8).map((skill) => {
    const escaped = skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const freq = (pool.match(new RegExp(`\\b${escaped}\\b`, "g")) || []).length;
    const value = Math.min(100, 35 + freq * 18);
    return { name: skill, value };
  });
}

function CountUp({ value, suffix = "", duration = 900, className = "" }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Number(value) || 0);
    let raf = 0;
    let start = 0;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min(1, (ts - start) / duration);
      const eased = 1 - (1 - progress) * (1 - progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <span className={className}>{display}{suffix}</span>;
}

function CircularProgress({ value, label }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (safe / 100) * c;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle cx="70" cy="70" r={r} stroke="rgba(148,163,184,0.25)" strokeWidth="10" fill="none" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          stroke="url(#scoreGradient)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#22d3ee" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="-mt-[86px] text-center">
        <p className="text-3xl font-bold text-cyan-300">
          <CountUp value={safe} />
        </p>
        <p className="typo-label mt-0.5">{label}</p>
      </div>
      <div className="h-[58px]" />
    </div>
  );
}

function experienceSummary(experience = []) {
  const text = experience.join(" ").toLowerCase();
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const uniqueYears = [...new Set(yearMatches.map((y) => Number(y)))].sort((a, b) => a - b);
  const estimatedYears =
    uniqueYears.length >= 2 ? Math.max(0, uniqueYears[uniqueYears.length - 1] - uniqueYears[0]) : Math.min(6, Math.ceil(experience.length / 2));
  const highlights = experience.slice(0, 3);
  return { estimatedYears, highlights, entries: experience.length };
}

export default function Dashboard({ result }) {
  if (!result) return null;

  const name = result?.resume?.name || "Not found";
  const email = result?.resume?.email || "Not found";
  const score = Number(result?.analysis?.score || 0);
  const match = Number(result?.job_match?.match_percentage || 0);
  const skills = result?.resume?.skills || [];
  const experience = (result?.resume?.experience || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const matchedSkills = result?.job_match?.matched_skills || [];
  const missingSkills = result?.job_match?.missing_skills || [];
  const suggestions = result?.analysis?.suggestions || [];
  const skillData = buildSkillData(skills, result);
  const expSummary = experienceSummary(experience);

  const matchData = [
    { name: "Matched", value: match },
    { name: "Missing", value: Math.max(0, 100 - match) },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="mt-6 space-y-5"
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
        <motion.div whileHover={{ scale: 1.02 }} className="glass-card neon-ring p-4 lg:col-span-1">
          <div className="mb-2 flex items-center gap-2">
            <UserRound size={16} className="text-cyan-300" />
            <p className="typo-label">Candidate</p>
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-100">{name}</h3>
          <p className="typo-subtitle mt-1 break-all text-sm">{email}</p>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card neon-ring p-4 lg:col-span-2">
          <div className="mb-2 flex items-center gap-2">
            <Gauge size={16} className="text-violet-300" />
            <p className="typo-label">Resume Score</p>
          </div>
          <CircularProgress value={score} label="Overall Score" />
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} className="glass-card neon-ring p-4 text-center lg:col-span-1">
          <div className="mb-2 flex items-center justify-center gap-2">
            <Target size={16} className="text-cyan-300" />
            <p className="typo-label">Job Match</p>
          </div>
          <p className="mt-4 text-5xl font-bold text-cyan-300">
            <CountUp value={match} suffix="%" />
          </p>
          <p className="typo-subtitle mt-2 text-xs">Role alignment estimate</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-card neon-ring h-[320px] p-4 xl:col-span-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
        >
          <h4 className="typo-label mb-4 flex items-center gap-2 text-sm">
            <BarChart3Icon />
            Skills Bar Chart
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={skillData}>
              <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
              <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.01 }}
          className="glass-card neon-ring h-[320px] p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h4 className="typo-label mb-4 flex items-center gap-2 text-sm">
            <Target size={14} className="text-cyan-300" />
            Match vs Missing Skills
          </h4>
          <ResponsiveContainer width="100%" height="72%">
            <PieChart>
              <Pie
                data={matchData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {matchData.map((entry, idx) => (
                  <Cell key={entry.name} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155" }}
                labelStyle={{ color: "#e2e8f0" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-1 grid grid-cols-2 gap-2 text-xs text-slate-300">
            <p>Matched: {match}%</p>
            <p>Missing: {Math.max(0, 100 - match)}%</p>
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <div>
              <p className="mb-1 text-xs text-cyan-200">Matched skills</p>
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.length ? (
                  matchedSkills.slice(0, 8).map((skill) => (
                    <span key={`m-${skill}`} className="rounded-md border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[11px] text-cyan-200">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No matched skills from JD.</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 text-xs text-rose-200">Missing skills</p>
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.length ? (
                  missingSkills.slice(0, 8).map((skill) => (
                    <span key={`x-${skill}`} className="rounded-md border border-rose-300/25 bg-rose-400/10 px-2 py-0.5 text-[11px] text-rose-200">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">No missing skills from JD.</span>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <motion.div whileHover={{ scale: 1.01 }} className="glass-card neon-ring p-4 xl:col-span-2">
          <h4 className="typo-label mb-3 text-sm">
            Skill Progress
          </h4>
          <div className="space-y-3">
            {skillData.length ? (
              skillData.map((item, idx) => (
                <SkillBar key={item.name} label={item.name} value={item.value} delay={idx * 0.08} />
              ))
            ) : (
              <p className="text-sm text-slate-400">No skills detected.</p>
            )}
          </div>
        </motion.div>

        <motion.div whileHover={{ scale: 1.01 }} className="glass-card neon-ring p-4">
          <h4 className="typo-label mb-3 flex items-center gap-2 text-sm">
            <BriefcaseBusiness size={14} className="text-violet-300" />
            Experience Summary
          </h4>
          <p className="text-4xl font-bold text-violet-300">
            <CountUp value={expSummary.estimatedYears} />
            <span className="ml-1 text-lg font-semibold text-slate-200">yrs</span>
          </p>
          <p className="typo-subtitle mt-1 text-xs">
            Based on entries and timeline signals
          </p>
          <div className="mt-3 rounded-xl border border-white/10 bg-slate-900/35 p-3">
            <p className="typo-label mb-2">Highlights</p>
            {expSummary.highlights.length ? (
              <ul className="space-y-1.5">
                {expSummary.highlights.map((line, idx) => (
                  <li key={`${line}-${idx}`} className="text-xs leading-relaxed text-slate-300">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">No experience details extracted yet.</p>
            )}
            <p className="mt-2 text-xs text-slate-400">Entries: {expSummary.entries}</p>
          </div>
        </motion.div>
      </div>

      <motion.div whileHover={{ scale: 1.005 }} className="glass-card neon-ring p-4">
        <h4 className="typo-label mb-3 text-sm">Suggestions</h4>
        {suggestions.length ? (
          <ul className="space-y-1.5">
            {suggestions.map((item, idx) => (
              <li key={`s-${idx}`} className="text-sm text-slate-200">
                • {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-400">No suggestions available.</p>
        )}
      </motion.div>
    </motion.section>
  );
}

function BarChart3Icon() {
  return <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />;
}