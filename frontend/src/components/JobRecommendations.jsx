import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BookOpenCheck,
  Bookmark,
  BookmarkCheck,
  Building2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  ListFilter,
  Sparkles,
} from "lucide-react";

function sortJobs(jobs, sortMode) {
  if (sortMode === "skill_based") {
    return [...jobs].sort((a, b) => {
      const aMatched = (a?.matched_skills || []).length;
      const bMatched = (b?.matched_skills || []).length;
      if (bMatched !== aMatched) return bMatched - aMatched;
      return (b?.match_percentage || 0) - (a?.match_percentage || 0);
    });
  }
  return [...jobs].sort((a, b) => (b?.match_percentage || 0) - (a?.match_percentage || 0));
}

function MatchProgress({ value }) {
  const safe = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-300">
        <span>Match</span>
        <span>{safe}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safe}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-violet-400 shadow-[0_0_14px_rgba(99,102,241,0.7)]"
        />
      </div>
    </div>
  );
}

function GapBadge({ severity }) {
  const s = (severity || "low").toLowerCase();
  const cls =
    s === "high"
      ? "border-rose-300/35 bg-rose-400/10 text-rose-200"
      : s === "medium"
      ? "border-amber-300/35 bg-amber-400/10 text-amber-200"
      : "border-emerald-300/35 bg-emerald-400/10 text-emerald-200";
  return <span className={`rounded-full border px-2.5 py-1 text-xs ${cls}`}>Gap: {s}</span>;
}

export default function JobRecommendations({ jobs = [] }) {
  const [sortMode, setSortMode] = useState("highest_match");
  const [expanded, setExpanded] = useState({});
  const [savedJobs, setSavedJobs] = useState({});

  const sortedJobs = useMemo(() => sortJobs(jobs, sortMode), [jobs, sortMode]);
  const jobKey = (job, idx) => `${job.title}-${job.company}-${idx}`;

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleSaved = (key) => {
    setSavedJobs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <section className="mt-5">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="typo-section-title flex items-center gap-2">
            <Sparkles size={18} className="text-cyan-300" />
            Recommended Jobs for You
          </h3>
          <p className="typo-subtitle text-sm">Based on skill overlap with current opportunities</p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-slate-900/50 px-2 py-1 text-xs">
          <ListFilter size={14} className="text-slate-300" />
          <button
            onClick={() => setSortMode("highest_match")}
            className={`rounded-md px-2 py-1 transition ${
              sortMode === "highest_match"
                ? "bg-cyan-500/20 text-cyan-200"
                : "text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            Highest match %
          </button>
          <button
            onClick={() => setSortMode("skill_based")}
            className={`rounded-md px-2 py-1 transition ${
              sortMode === "skill_based"
                ? "bg-violet-500/20 text-violet-200"
                : "text-slate-300 hover:bg-slate-800/70"
            }`}
          >
            Skill-based
          </button>
        </div>
      </div>

      {sortedJobs.length ? (
        <div className="grid grid-cols-1 gap-4">
          {sortedJobs.map((job, idx) => (
            <motion.article
              key={jobKey(job, idx)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card p-0 transition-all duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
            >
              <div className="p-4 md:p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-slate-800/80 text-cyan-200">
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-lg font-semibold text-slate-100">
                        {job.title || "Untitled Role"}
                      </h4>
                      <p className="mt-1 truncate text-sm text-slate-300">
                        {job.company || "Unknown Company"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleSaved(jobKey(job, idx))}
                      className="rounded-md border border-white/20 bg-slate-900/50 p-1.5 text-slate-300 transition hover:bg-slate-800/70 hover:text-cyan-200"
                      title={savedJobs[jobKey(job, idx)] ? "Saved" : "Save job"}
                    >
                      {savedJobs[jobKey(job, idx)] ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
                    </button>
                    <span className="rounded-full border border-cyan-300/35 bg-cyan-300/10 px-2.5 py-1 text-xs font-medium text-cyan-200">
                      {Math.max(0, Math.min(100, Number(job?.match_percentage) || 0))}% match
                    </span>
                  </div>
                </div>

                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="rounded-full border border-white/15 bg-slate-900/50 px-2.5 py-1 text-xs text-slate-300">
                    {(job?.matched_skills || []).length} skills matched
                  </div>
                  <GapBadge severity={job?.gap_severity} />
                </div>

                <MatchProgress value={job.match_percentage} />

                <div className="mt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => toggleExpand(jobKey(job, idx))}
                    className="inline-flex items-center gap-1 rounded-md border border-white/15 bg-slate-900/45 px-2.5 py-1.5 text-xs text-slate-200 transition hover:bg-slate-800/70"
                  >
                    {expanded[jobKey(job, idx)] ? (
                      <>
                        Hide details <ChevronUp size={14} />
                      </>
                    ) : (
                      <>
                        View job details <ChevronDown size={14} />
                      </>
                    )}
                  </button>
                  {savedJobs[jobKey(job, idx)] ? (
                    <span className="text-xs text-emerald-300">Saved</span>
                  ) : (
                    <span className="text-xs text-slate-400">Not saved</span>
                  )}
                </div>

                <AnimatePresence initial={false}>
                  {expanded[jobKey(job, idx)] && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 12 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="rounded-lg border border-white/10 bg-slate-900/35 p-3">
                          <p className="typo-label mb-2 flex items-center gap-1.5">
                            <AlertTriangle size={13} className="text-rose-300" />
                            Missing skills
                          </p>
                          {job?.missing_skills?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {job.missing_skills.map((skill) => (
                                <span
                                  key={`${job.title}-${skill}`}
                                  className="rounded-md border border-rose-300/25 bg-rose-400/10 px-2 py-0.5 text-xs text-rose-200"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-emerald-300">Strong fit. No major missing skills.</p>
                          )}
                        </div>

                        {job?.description ? (
                          <div className="rounded-lg border border-white/10 bg-slate-900/35 p-3">
                            <p className="typo-label mb-2 text-xs text-slate-200">Job description</p>
                            <p className="text-xs leading-relaxed text-slate-300">{job.description}</p>
                          </div>
                        ) : null}

                        <div className="rounded-lg border border-white/10 bg-slate-900/35 p-3">
                          <p className="typo-label mb-2 flex items-center gap-1.5">
                            <Lightbulb size={13} className="text-cyan-300" />
                            How to improve for this job
                          </p>
                          {job?.improvement_suggestions?.length ? (
                            <ul className="space-y-1.5">
                              {job.improvement_suggestions.slice(0, 3).map((item, i) => (
                                <li key={`${job.title}-tip-${i}`} className="text-xs leading-relaxed text-slate-300">
                                  • {item}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400">No specific suggestions available.</p>
                          )}
                        </div>

                        <div className="rounded-lg border border-white/10 bg-slate-900/35 p-3">
                          <p className="typo-label mb-2 flex items-center gap-1.5">
                            <BookOpenCheck size={13} className="text-violet-300" />
                            Recommended courses
                          </p>
                          {job?.recommended_courses?.length ? (
                            <ul className="space-y-1.5">
                              {job.recommended_courses.slice(0, 3).map((course, i) => (
                                <li key={`${job.title}-course-${i}`} className="text-xs text-slate-300">
                                  {course}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400">No course suggestions for this role.</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          ))}
        </div>
      ) : (
        <div className="glass-card neon-ring p-4">
          <p className="typo-subtitle text-sm">No recommendations available yet. Analyze a resume first.</p>
        </div>
      )}
    </section>
  );
}

