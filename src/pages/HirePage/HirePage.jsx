import { useEffect, useId, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LightMode } from "@chakra-ui/react";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  MapPin,
  Paperclip,
  Sparkles,
  Users,
} from "lucide-react";

const MAX_BYTES = 8 * 1024 * 1024;
const SEARCH_STEPS = [
  { after: 0, label: "Reading your job description…" },
  { after: 4000, label: "Scanning the candidate pool…" },
  { after: 9000, label: "Ranking the best matches…" },
];

const c = {
  page: "#F8FAFC",
  surface: "#FFFFFF",
  muted: "#F1F5F9",
  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  text: "#0F172A",
  textSecondary: "#475569",
  textMuted: "#64748B",
  brand: "#2563EB",
  brandSubtle: "#EFF6FF",
  brandBorder: "#BFDBFE",
  green: "#16A34A",
  greenSubtle: "#F0FDF4",
  amber: "#B45309",
  amberSubtle: "#FFFBEB",
  red: "#B91C1C",
  redSubtle: "#FEF2F2",
};

function apiUrl(path) {
  const origin = typeof window !== "undefined" ? window.location.origin : "https://openworldx.com";
  return `${origin}/api/hire/${path}`;
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

async function postJson(path, body) {
  const response = await fetch(apiUrl(path), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}

function scoreTone(score) {
  if (score >= 80) return { label: "Strong match", color: c.green, bg: c.greenSubtle };
  if (score >= 60) return { label: "Good match", color: c.brand, bg: c.brandSubtle };
  return { label: "Partial match", color: c.amber, bg: c.amberSubtle };
}

const css = `
.hp-input { width: 100%; box-sizing: border-box; height: 46px; padding: 0 14px; border: 1px solid ${c.borderStrong}; border-radius: 10px; font: inherit; font-size: 16px; color: ${c.text}; background: #fff; outline: none; }
.hp-input:focus, .hp-textarea:focus { border-color: ${c.brand}; box-shadow: 0 0 0 3px ${c.brandSubtle}; }
.hp-textarea { width: 100%; box-sizing: border-box; min-height: 190px; padding: 12px 14px; border: 1px solid ${c.borderStrong}; border-radius: 10px; font: inherit; font-size: 15px; line-height: 1.6; color: ${c.text}; background: #fff; resize: vertical; outline: none; }
#hp-root svg { flex-shrink: 0; }
.hp-input::placeholder, .hp-textarea::placeholder { color: #94A3B8; opacity: 1; }
.hp-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
.hp-results { display: grid; grid-template-columns: 1fr; gap: 16px; }
@media (min-width: 720px) {
  .hp-row { grid-template-columns: 1fr 1fr 1fr; }
  .hp-results { grid-template-columns: 1fr 1fr; }
}
@keyframes hp-spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100dvh",
    background: c.page,
    color: c.text,
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.92)",
    backdropFilter: "blur(8px)",
    borderBottom: `1px solid ${c.border}`,
  },
  topInner: {
    maxWidth: 1040,
    margin: "0 auto",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandLink: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: c.text,
    fontWeight: 700,
    fontSize: 17,
  },
  backLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    color: c.textSecondary,
    textDecoration: "none",
    fontSize: 15,
  },
  main: { maxWidth: 1040, margin: "0 auto", padding: "40px 20px 72px" },
  eyebrow: {
    margin: 0,
    fontSize: 13.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: c.brand,
  },
  title: { margin: "12px 0 0", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 700, lineHeight: 1.15, letterSpacing: "-0.02em" },
  lead: { margin: "14px 0 0", maxWidth: 640, fontSize: 18, lineHeight: 1.65, color: c.textSecondary },
  card: {
    marginTop: 28,
    background: c.surface,
    border: `1px solid ${c.border}`,
    borderRadius: 16,
    padding: "clamp(18px, 3vw, 28px)",
  },
  label: { display: "block", marginBottom: 6, fontSize: 14, fontWeight: 600, color: c.textSecondary },
  tabs: { display: "inline-flex", padding: 4, borderRadius: 10, background: c.muted, marginTop: 22 },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 38,
    padding: "0 14px",
    border: "none",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  drop: {
    marginTop: 14,
    minHeight: 150,
    borderRadius: 12,
    border: `1.5px dashed ${c.borderStrong}`,
    background: c.muted,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: 20,
    cursor: "pointer",
    color: c.textMuted,
  },
  error: {
    marginTop: 14,
    display: "flex",
    gap: 8,
    alignItems: "flex-start",
    padding: "10px 12px",
    borderRadius: 10,
    background: c.redSubtle,
    color: c.red,
    fontSize: 14.5,
    lineHeight: 1.45,
  },
  submit: {
    marginTop: 20,
    width: "100%",
    height: 50,
    border: "none",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 17,
    fontWeight: 700,
    color: "#fff",
    background: c.brand,
    cursor: "pointer",
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "2.5px solid rgba(255,255,255,0.4)",
    borderTopColor: "#fff",
    animation: "hp-spin 0.8s linear infinite",
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    height: 28,
    padding: "0 10px",
    borderRadius: 999,
    fontSize: 13,
    fontWeight: 500,
    background: c.muted,
    color: c.textSecondary,
    border: `1px solid ${c.border}`,
  },
  chipMatched: { background: c.brandSubtle, color: c.brand, border: `1px solid ${c.brandBorder}` },
  meta: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: c.textSecondary },
};

const JobSummary = ({ job, poolSize, matchCount }) => (
  <div style={{ ...s.card, marginTop: 36 }}>
    <p style={s.eyebrow}>Role we matched against</p>
    <h2 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700 }}>{job.title}</h2>
    {job.summary && <p style={{ margin: "8px 0 0", color: c.textSecondary, lineHeight: 1.6 }}>{job.summary}</p>}
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 14 }}>
      {job.location && (
        <span style={s.meta}>
          <MapPin size={16} aria-hidden /> {job.location}
          {job.remoteOk ? " · remote OK" : ""}
        </span>
      )}
      {job.experienceMin != null && (
        <span style={s.meta}>
          <Briefcase size={16} aria-hidden /> {job.experienceMin}
          {job.experienceMax != null ? `–${job.experienceMax}` : "+"} yrs
        </span>
      )}
      <span style={s.meta}>
        <Users size={16} aria-hidden /> {matchCount} match{matchCount === 1 ? "" : "es"} from {poolSize} profiles
      </span>
    </div>
    {job.mustHaveSkills.length > 0 && (
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
        {job.mustHaveSkills.map((skill) => (
          <span key={skill} style={s.chip}>
            {skill}
          </span>
        ))}
      </div>
    )}
  </div>
);

const MatchCard = ({ match, index, onRequestIntro, introState }) => {
  const tone = scoreTone(match.score);
  const matched = new Set(match.matchedSkills.map((m) => m.toLowerCase()));
  const skills = [...match.skills].sort((a, b) => matched.has(b.toLowerCase()) - matched.has(a.toLowerCase()));
  const education = [match.degree, match.graduationYear && `Class of ${match.graduationYear}`].filter(Boolean).join(" · ");

  return (
    <article style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 16, padding: 20, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: c.textMuted }}>Candidate {String.fromCharCode(65 + index)}</p>
          <h3 style={{ margin: "4px 0 0", fontSize: 18, fontWeight: 700, lineHeight: 1.35 }}>
            {match.headline || match.roles[0] || "Matched candidate"}
          </h3>
        </div>
        <div style={{ flexShrink: 0, textAlign: "center", padding: "6px 10px", borderRadius: 12, background: tone.bg, color: tone.color }}>
          <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{match.score}%</div>
          <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 2 }}>{tone.label}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
        {(match.college || education) && (
          <span style={s.meta}>
            <GraduationCap size={16} aria-hidden /> {[match.college, education].filter(Boolean).join(" — ")}
          </span>
        )}
        {match.experienceYears != null && (
          <span style={s.meta}>
            <Briefcase size={16} aria-hidden /> {match.experienceYears === 0 ? "Fresher" : `${match.experienceYears} yrs experience`}
          </span>
        )}
        {match.location && (
          <span style={s.meta}>
            <MapPin size={16} aria-hidden /> {match.location}
          </span>
        )}
      </div>

      {match.reasons.length > 0 && (
        <ul style={{ margin: "14px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
          {match.reasons.map((reason) => (
            <li key={reason} style={{ display: "flex", gap: 8, fontSize: 14.5, lineHeight: 1.5 }}>
              <CheckCircle2 size={16} color={c.green} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
              {reason}
            </li>
          ))}
          {match.gaps.map((gap) => (
            <li key={gap} style={{ display: "flex", gap: 8, fontSize: 14.5, lineHeight: 1.5, color: c.textMuted }}>
              <AlertCircle size={16} color={c.amber} style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
              {gap}
            </li>
          ))}
        </ul>
      )}

      {skills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 14 }}>
          {skills.slice(0, 10).map((skill) => (
            <span key={skill} style={{ ...s.chip, ...(matched.has(skill.toLowerCase()) ? s.chipMatched : null) }}>
              {skill}
            </span>
          ))}
        </div>
      )}

      <div style={{ flex: 1 }} />
      <button
        type="button"
        onClick={() => onRequestIntro(match.matchId)}
        disabled={introState === "sending" || introState === "sent"}
        style={{
          marginTop: 18,
          height: 44,
          borderRadius: 999,
          fontSize: 15.5,
          fontWeight: 700,
          cursor: introState ? "default" : "pointer",
          border: introState === "sent" ? `1px solid ${c.green}` : `1.5px solid ${c.brand}`,
          background: introState === "sent" ? c.greenSubtle : "#fff",
          color: introState === "sent" ? c.green : c.brand,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {introState === "sent" ? (
          <>
            <CheckCircle2 size={17} aria-hidden /> Intro requested — we&apos;ll email you
          </>
        ) : introState === "sending" ? (
          "Requesting…"
        ) : (
          "Request intro"
        )}
      </button>
    </article>
  );
};

const HirePage = () => {
  const fileInputId = useId();
  const [mode, setMode] = useState("upload");
  const [form, setForm] = useState({ companyName: "", contactName: "", email: "" });
  const [jdText, setJdText] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [stepLabel, setStepLabel] = useState(SEARCH_STEPS[0].label);
  const [result, setResult] = useState(null);
  const [intro, setIntro] = useState({});

  useEffect(() => {
    if (!searching) return undefined;
    setStepLabel(SEARCH_STEPS[0].label);
    const timers = SEARCH_STEPS.slice(1).map((step) => setTimeout(() => setStepLabel(step.label), step.after));
    return () => timers.forEach(clearTimeout);
  }, [searching]);

  const onField = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onFileChange = async (e) => {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return;
    try {
      const bytes = new Uint8Array(await picked.arrayBuffer());
      const isPdf = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
      const isText = /\.txt$/i.test(picked.name);
      if (!isPdf && !isText) {
        setError("Please upload the JD as a PDF, or switch to “Paste text”.");
        return;
      }
      if (picked.size > MAX_BYTES) {
        setError("That file is over 8 MB. Please upload a smaller PDF.");
        return;
      }
      setError("");
      setFile({ name: picked.name, size: picked.size, bytes });
    } catch {
      setError("Couldn't open that file. Download it to your device first, then try again.");
    } finally {
      input.value = "";
    }
  };

  const hasJd = mode === "upload" ? Boolean(file) : jdText.trim().length > 0;
  const canSubmit = hasJd && form.companyName.trim() && form.contactName.trim() && form.email.trim() && !searching;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError("");
    setSearching(true);
    setResult(null);
    setIntro({});
    try {
      const payload =
        mode === "upload"
          ? { ...form, fileName: file.name, fileBase64: bytesToBase64(file.bytes) }
          : { ...form, jdText };
      const data = await postJson("match", payload);
      setResult(data);
      requestAnimationFrame(() => document.getElementById("hp-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const onRequestIntro = async (matchId) => {
    setIntro((prev) => ({ ...prev, [matchId]: "sending" }));
    try {
      await postJson("intro", { jobId: result.jobId, matchId });
      setIntro((prev) => ({ ...prev, [matchId]: "sent" }));
    } catch (err) {
      setIntro((prev) => ({ ...prev, [matchId]: undefined }));
      setError(err.message);
    }
  };

  const tabStyle = (active) => ({
    ...s.tab,
    background: active ? "#fff" : "transparent",
    color: active ? c.text : c.textMuted,
    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.08)" : "none",
  });

  return (
    <LightMode>
      <style>{css}</style>
      <div id="hp-root" style={s.page}>
        <header style={s.topBar}>
          <div style={s.topInner}>
            <RouterLink to="/" style={s.brandLink}>
              <img src="/logohero.jpeg" alt="" aria-hidden width={26} height={26} style={{ objectFit: "contain", mixBlendMode: "multiply" }} />
              OpenWorldX
            </RouterLink>
            <RouterLink to="/" style={s.backLink}>
              <ArrowLeft size={16} aria-hidden /> Back to home
            </RouterLink>
          </div>
        </header>

        <main style={s.main}>
          <p style={s.eyebrow}>For recruiters</p>
          <h1 style={s.title}>Find matched IIT &amp; NIT talent for your role</h1>
          <p style={s.lead}>
            Share your job description. We read it, scan candidates who built verified profiles with Mira, and show you
            the best fits with clear reasons — in under a minute.
          </p>

          <form onSubmit={onSubmit} style={s.card}>
            <div className="hp-row">
              <div>
                <label style={s.label} htmlFor="hp-company">Company</label>
                <input id="hp-company" className="hp-input" value={form.companyName} onChange={onField("companyName")} placeholder="Acme Technologies" autoComplete="organization" />
              </div>
              <div>
                <label style={s.label} htmlFor="hp-name">Your name</label>
                <input id="hp-name" className="hp-input" value={form.contactName} onChange={onField("contactName")} placeholder="Priya Sharma" autoComplete="name" />
              </div>
              <div>
                <label style={s.label} htmlFor="hp-email">Work email</label>
                <input id="hp-email" type="email" className="hp-input" value={form.email} onChange={onField("email")} placeholder="priya@acme.com" autoComplete="email" />
              </div>
            </div>

            <div style={s.tabs} role="tablist" aria-label="How to share the job description">
              <button type="button" role="tab" aria-selected={mode === "upload"} style={tabStyle(mode === "upload")} onClick={() => setMode("upload")}>
                <Paperclip size={16} aria-hidden /> Upload PDF
              </button>
              <button type="button" role="tab" aria-selected={mode === "paste"} style={tabStyle(mode === "paste")} onClick={() => setMode("paste")}>
                <ClipboardList size={16} aria-hidden /> Paste text
              </button>
            </div>

            {mode === "upload" ? (
              <>
                <input id={fileInputId} type="file" accept=".pdf,.txt,application/pdf,text/plain" style={{ display: "none" }} onChange={onFileChange} disabled={searching} />
                <label htmlFor={fileInputId} style={{ ...s.drop, ...(file ? { borderStyle: "solid", borderColor: c.brandBorder, background: c.brandSubtle, color: c.text } : null) }}>
                  <FileText size={32} strokeWidth={1.5} color={file ? c.brand : "#94A3B8"} aria-hidden />
                  {file ? (
                    <>
                      <span style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{file.name}</span>
                      <span style={{ marginTop: 2, fontSize: 13.5, color: c.textMuted }}>
                        {Math.max(1, Math.round(file.size / 1024))} KB · tap to change
                      </span>
                    </>
                  ) : (
                    <>
                      <span style={{ marginTop: 8, fontSize: 16, fontWeight: 600, color: c.text }}>Choose your job description</span>
                      <span style={{ marginTop: 2, fontSize: 13.5 }}>PDF · max 8 MB</span>
                    </>
                  )}
                </label>
              </>
            ) : (
              <textarea
                className="hp-textarea"
                style={{ marginTop: 14 }}
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description — role, responsibilities, required skills, experience, location…"
                aria-label="Job description"
              />
            )}

            {error && (
              <div role="alert" style={s.error}>
                <AlertCircle size={17} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" disabled={!canSubmit} aria-busy={searching} style={{ ...s.submit, ...(canSubmit || searching ? null : { background: "#BFDBFE", color: c.textMuted, cursor: "not-allowed" }) }}>
              {searching ? <span style={s.spinner} aria-hidden /> : <Sparkles size={18} aria-hidden />}
              {searching ? stepLabel : "Find matching candidates"}
            </button>
            <p style={{ margin: "12px 0 0", fontSize: 13, color: c.textMuted, textAlign: "center" }}>
              Candidate identities stay private until they accept an introduction.
            </p>
          </form>

          {result && (
            <section id="hp-results" style={{ scrollMarginTop: 80 }}>
              <JobSummary job={result.job} poolSize={result.poolSize} matchCount={result.matches.length} />
              {result.matches.length > 0 ? (
                <div className="hp-results" style={{ marginTop: 20 }}>
                  {result.matches.map((match, i) => (
                    <MatchCard key={match.matchId} match={match} index={i} onRequestIntro={onRequestIntro} introState={intro[match.matchId]} />
                  ))}
                </div>
              ) : (
                <div style={{ ...s.card, textAlign: "center", color: c.textSecondary }}>
                  <Users size={32} color="#94A3B8" aria-hidden />
                  <p style={{ margin: "10px 0 0", fontSize: 17, fontWeight: 600, color: c.text }}>No strong matches yet</p>
                  <p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
                    We&apos;ve saved your role. Our team will reach out at {form.email} as matching candidates join.
                  </p>
                </div>
              )}
            </section>
          )}
        </main>
      </div>
    </LightMode>
  );
};

export default HirePage;
