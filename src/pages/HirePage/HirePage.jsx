import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LightMode } from "@chakra-ui/react";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Clock,
  Copy,
  Download,
  FileText,
  Github,
  Globe,
  GraduationCap,
  Linkedin,
  Mail,
  MapPin,
  MessageCircle,
  Paperclip,
  Phone,
  Send,
  Sparkles,
  Users,
  XCircle,
} from "lucide-react";

const MAX_BYTES = 8 * 1024 * 1024;
const POLL_MS = 20000;
const SEARCH_STEPS = [
  { after: 0, label: "Reading your job description…" },
  { after: 4000, label: "Scanning the candidate pool…" },
  { after: 9000, label: "Ranking the best matches…" },
];
const IN_PROGRESS = ["pending_offer", "awaiting_candidate", "collecting_info", "finalizing"];
const MIRA_QUESTION_PLACEHOLDER = "Mira will ask them and mail you the details";

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
  brandHover: "#1D4ED8",
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

function readSavedJob() {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const jobId = params.get("job");
  const key = params.get("k");
  return jobId && key ? { jobId, key } : null;
}

function saveJobInUrl(jobId, key) {
  const url = new URL(window.location.href);
  url.searchParams.set("job", jobId);
  url.searchParams.set("k", key);
  window.history.replaceState(null, "", url.toString());
}

function scoreTone(score) {
  if (score >= 80) return { label: "Strong match", color: c.green, bg: c.greenSubtle };
  if (score >= 60) return { label: "Good match", color: c.brand, bg: c.brandSubtle };
  return { label: "Partial match", color: c.amber, bg: c.amberSubtle };
}

function resumeFileName(name) {
  const safe = String(name || "candidate")
    .replace(/[^\w]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `${safe || "candidate"}-resume.pdf`;
}

async function downloadResume(url, name) {
  const fileName = resumeFileName(name);
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("download failed");
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 1500);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

const DECLINE_REASONS = {
  compensation: "Salary or location didn't work for them",
  role_fit: "Not the right role for them",
  not_looking: "Not looking for a change right now",
  withdrew: "Changed their mind while answering",
};

function introStatus(intro, firstName) {
  const who = firstName || "The candidate";
  const answered = intro.questions.filter((q) => q.status !== "pending").length;
  switch (intro.status) {
    case "pending_offer":
    case "awaiting_candidate":
      return { tone: "amber", icon: Clock, title: `Waiting for ${who} to reply on WhatsApp`, body: "We'll email you as soon as they answer." };
    case "collecting_info":
    case "finalizing":
      return {
        tone: "brand",
        icon: CheckCircle2,
        title: `${who} is interested`,
        body: intro.questions.length ? `Answering your questions (${answered}/${intro.questions.length}) — we'll email you when done.` : "Sending you their details…",
      };
    case "accepted":
      return {
        tone: "green",
        icon: CheckCircle2,
        title: `${who} is interested — details emailed to you`,
        body: intro.partial ? "They didn't finish every question; here's what they shared." : "Reach out to them directly.",
      };
    case "declined":
    case "withdrawn":
      return { tone: "grey", icon: XCircle, title: `${who} passed on this role`, body: DECLINE_REASONS[intro.declineReason] || "" };
    case "expired":
      return { tone: "grey", icon: Clock, title: "No reply after 7 days", body: "You can still contact them directly." };
    case "candidate_not_looking":
      return { tone: "grey", icon: XCircle, title: `${who} isn't looking right now`, body: "" };
    case "undeliverable":
      return {
        tone: "red",
        icon: AlertCircle,
        title: "Couldn't reach them on WhatsApp",
        body: intro.delivery === "not_allowlisted" ? "Messaging is in test mode. Contact them directly for now." : "Please contact them directly.",
      };
    default:
      return { tone: "grey", icon: Clock, title: intro.status, body: "" };
  }
}

const TONES = {
  amber: { color: c.amber, bg: c.amberSubtle, border: "#FDE68A" },
  brand: { color: c.brand, bg: c.brandSubtle, border: c.brandBorder },
  green: { color: c.green, bg: c.greenSubtle, border: "#BBF7D0" },
  red: { color: c.red, bg: c.redSubtle, border: "#FECACA" },
  grey: { color: c.textSecondary, bg: c.muted, border: c.border },
};

const css = `
.hp-input { width: 100%; box-sizing: border-box; height: 46px; padding: 0 14px; border: 1px solid ${c.borderStrong}; border-radius: 10px; font: inherit; font-size: 16px; color: ${c.text}; background: #fff; outline: none; }
.hp-input:focus, .hp-textarea:focus { border-color: ${c.brand}; box-shadow: 0 0 0 3px ${c.brandSubtle}; }
.hp-textarea { width: 100%; box-sizing: border-box; min-height: 190px; padding: 12px 14px; border: 1px solid ${c.borderStrong}; border-radius: 10px; font: inherit; font-size: 15px; line-height: 1.6; color: ${c.text}; background: #fff; resize: vertical; outline: none; }
.hp-textarea.hp-small { min-height: 110px; font-size: 14.5px; }
#hp-root svg { flex-shrink: 0; }
.hp-input::placeholder, .hp-textarea::placeholder { color: #94A3B8; opacity: 1; }
.hp-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
.hp-facts { display: grid; grid-template-columns: 1fr; gap: 10px 20px; }
.hp-dl { display: grid; grid-template-columns: 1fr; gap: 10px 24px; }
.hp-contact { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid ${c.border}; background: #fff; color: ${c.text}; font-size: 13.5px; font-weight: 500; text-decoration: none; max-width: 100%; }
.hp-contact:hover { border-color: ${c.brandBorder}; background: ${c.brandSubtle}; color: ${c.brand}; }
.hp-contact span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp-download { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid ${c.brand}; background: ${c.brandSubtle}; color: ${c.brand}; font-size: 14.5px; font-weight: 700; text-decoration: none; cursor: pointer; }
.hp-download:hover { background: ${c.brand}; color: #fff; }
.hp-download:disabled { opacity: 0.55; cursor: default; }
.hp-ghost { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid ${c.borderStrong}; background: #fff; color: ${c.textSecondary}; font-size: 14px; font-weight: 600; cursor: pointer; }
.hp-ghost:hover { border-color: ${c.brandBorder}; color: ${c.brand}; background: ${c.brandSubtle}; }
@media (min-width: 720px) {
  .hp-row { grid-template-columns: 1fr 1fr 1fr; }
  .hp-facts { grid-template-columns: 1fr 1fr; }
  .hp-dl { grid-template-columns: 1fr 1fr; }
}
@keyframes hp-spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100dvh",
    background: `linear-gradient(180deg, #EEF4FF 0%, ${c.page} 220px)`,
    color: c.text,
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.94)",
    backdropFilter: "blur(12px)",
    borderBottom: `1px solid ${c.border}`,
  },
  topInner: {
    maxWidth: 880,
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
  main: { maxWidth: 880, margin: "0 auto", padding: "36px 20px 80px" },
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
    borderRadius: 18,
    padding: "clamp(18px, 3vw, 28px)",
    boxShadow: "0 1px 2px rgba(15,23,42,0.04)",
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
  meta: { display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: c.textSecondary, lineHeight: 1.45 },
  pillButton: {
    height: 46,
    borderRadius: 999,
    fontSize: 15.5,
    fontWeight: 700,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    cursor: "pointer",
  },
  sectionTitle: { margin: "0 0 8px", fontSize: 12.5, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: c.textMuted },
  section: { marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.border}` },
};

const HOW_IT_WORKS = [
  { n: "1", title: "Share the role", body: "Upload or paste the job description." },
  { n: "2", title: "Review full profiles", body: "Name, resume, contact and every detail we have." },
  { n: "3", title: "Reach out via Mira", body: "She asks them on WhatsApp and emails you the answers." },
];

const JobSummary = ({ job, poolSize, matchCount, resultsLink, onNewSearch }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultsLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", resultsLink);
    }
  };

  return (
    <div style={{ ...s.card, marginTop: 0 }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <p style={s.eyebrow}>Matched against</p>
          <h2 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 700 }}>{job.title}</h2>
        </div>
        <button type="button" className="hp-ghost" onClick={onNewSearch}>
          New search
        </button>
      </div>
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
      {resultsLink && (
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: `1px solid ${c.border}`, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, color: c.textMuted }}>Bookmark this page — candidate replies show up here and in your email.</span>
          <button type="button" onClick={copy} className="hp-contact" style={{ cursor: "pointer" }}>
            {copied ? <CheckCircle2 size={15} color={c.green} aria-hidden /> : <Copy size={15} aria-hidden />}
            <span>{copied ? "Link copied" : "Copy results link"}</span>
          </button>
        </div>
      )}
    </div>
  );
};

const DetailBlock = ({ title, children }) => (
  <section style={s.section}>
    <h4 style={s.sectionTitle}>{title}</h4>
    {children}
  </section>
);

const ContactDetails = ({ contact, name }) => {
  const [downloading, setDownloading] = useState(false);

  const onDownload = async () => {
    if (!contact.resumeUrl || downloading) return;
    setDownloading(true);
    try {
      await downloadResume(contact.resumeUrl, name);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <DetailBlock title="Contact & resume">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {contact.resumeUrl ? (
          <button type="button" className="hp-download" onClick={onDownload} disabled={downloading}>
            {downloading ? <span style={{ ...s.spinner, border: `2.5px solid ${c.brandBorder}`, borderTopColor: c.brand }} aria-hidden /> : <Download size={16} aria-hidden />}
            {downloading ? "Downloading…" : "Download resume"}
          </button>
        ) : (
          <span style={{ ...s.chip, height: 40, padding: "0 14px" }}>Resume not uploaded yet</span>
        )}
        {contact.phone && (
          <a href={`tel:${contact.phone}`} className="hp-contact">
            <Phone size={15} aria-hidden />
            <span>{contact.phone}</span>
          </a>
        )}
        {contact.email && (
          <a href={`mailto:${contact.email}`} className="hp-contact">
            <Mail size={15} aria-hidden />
            <span>{contact.email}</span>
          </a>
        )}
        {contact.whatsappUrl && (
          <a href={contact.whatsappUrl} className="hp-contact" target="_blank" rel="noopener noreferrer">
            <MessageCircle size={15} aria-hidden />
            <span>WhatsApp</span>
          </a>
        )}
        {contact.linkedInUrl && (
          <a href={contact.linkedInUrl} className="hp-contact" target="_blank" rel="noopener noreferrer">
            <Linkedin size={15} aria-hidden />
            <span>LinkedIn</span>
          </a>
        )}
        {contact.githubUrl && (
          <a href={contact.githubUrl} className="hp-contact" target="_blank" rel="noopener noreferrer">
            <Github size={15} aria-hidden />
            <span>GitHub</span>
          </a>
        )}
        {contact.portfolioUrl && (
          <a href={contact.portfolioUrl} className="hp-contact" target="_blank" rel="noopener noreferrer">
            <Globe size={15} aria-hidden />
            <span>Portfolio</span>
          </a>
        )}
      </div>
    </DetailBlock>
  );
};

const IntroPanel = ({ intro, firstName }) => {
  const status = introStatus(intro, firstName);
  const tone = TONES[status.tone];
  const Icon = status.icon;
  const answers = intro.questions.filter((q) => q.status === "answered" || q.status === "skipped");

  return (
    <div style={{ borderRadius: 12, border: `1px solid ${tone.border}`, background: tone.bg, padding: "14px 16px" }} aria-live="polite">
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start", color: tone.color, fontWeight: 700, fontSize: 15 }}>
        <Icon size={18} style={{ marginTop: 1 }} aria-hidden />
        <span>{status.title}</span>
      </div>
      {status.body && <p style={{ margin: "4px 0 0 26px", fontSize: 14, color: c.textSecondary, lineHeight: 1.5 }}>{status.body}</p>}
      {answers.length > 0 && (
        <ol style={{ margin: "10px 0 0", paddingLeft: 26, display: "flex", flexDirection: "column", gap: 8 }}>
          {answers.map((q) => (
            <li key={q.text} style={{ fontSize: 14, lineHeight: 1.5 }}>
              <div style={{ fontWeight: 600, color: c.text }}>{q.text}</div>
              <div style={{ color: q.status === "skipped" ? c.textMuted : c.textSecondary }}>{q.status === "skipped" ? "Skipped" : q.answer}</div>
            </li>
          ))}
        </ol>
      )}
      {intro.candidateQuestions.length > 0 && (
        <div style={{ margin: "10px 0 0 26px", fontSize: 14, lineHeight: 1.5 }}>
          <div style={{ fontWeight: 600 }}>They asked you:</div>
          {intro.candidateQuestions.map((q) => (
            <div key={q} style={{ color: c.textSecondary }}>
              • {q}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const ReachOutForm = ({ firstName, onSend, onCancel }) => {
  const [questions, setQuestions] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const fieldId = useId();

  const submit = async () => {
    setSending(true);
    setError("");
    try {
      await onSend({ note: "", questions });
    } catch (err) {
      setError(err.message);
      setSending(false);
    }
  };

  return (
    <div style={{ borderRadius: 14, border: `1px solid ${c.brandBorder}`, background: c.brandSubtle, padding: 16 }}>
      <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: c.text }}>
        Additional questions for {firstName || "the candidate"}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13.5, lineHeight: 1.5, color: c.textSecondary }}>
        Mira will message them on WhatsApp. If they say yes, she asks these questions and emails you the answers.
      </p>
      <label style={{ ...s.label, marginTop: 14 }} htmlFor={fieldId}>
        What do you want to ask?
      </label>
      <textarea
        id={fieldId}
        className="hp-textarea hp-small"
        maxLength={1500}
        value={questions}
        onChange={(e) => setQuestions(e.target.value)}
        placeholder={MIRA_QUESTION_PLACEHOLDER}
      />
      {error && (
        <div role="alert" style={s.error}>
          <AlertCircle size={17} style={{ marginTop: 1 }} aria-hidden />
          <span>{error}</span>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          type="button"
          onClick={submit}
          disabled={sending}
          style={{ ...s.pillButton, flex: 1, border: "none", background: c.brand, color: "#fff", cursor: sending ? "default" : "pointer" }}
        >
          {sending ? <span style={s.spinner} aria-hidden /> : <Send size={16} aria-hidden />}
          {sending ? "Sending…" : "Send via WhatsApp"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={sending}
          style={{ ...s.pillButton, padding: "0 18px", border: `1px solid ${c.borderStrong}`, background: "#fff", color: c.textSecondary }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

const MatchCard = ({ match, onReachOut }) => {
  const [composing, setComposing] = useState(false);
  const tone = scoreTone(match.score);
  const matched = new Set((match.matchedSkills || []).map((m) => m.toLowerCase()));
  const skills = [...(match.skills || [])].sort((a, b) => Number(matched.has(b.toLowerCase())) - Number(matched.has(a.toLowerCase())));
  const name = match.contact?.name || "Candidate";
  const firstName = match.contact?.name ? match.contact.name.split(/\s+/)[0] : "";
  const initial = name.charAt(0).toUpperCase();
  const education = [match.degree, match.graduationYear && `Class of ${match.graduationYear}`].filter(Boolean).join(" · ");
  const preferences = [
    { label: "Looking for", value: match.lookingFor },
    { label: "Employment type", value: match.employmentType },
    { label: "Expected CTC", value: match.expectedCtc },
    { label: "Availability", value: match.availability },
  ].filter((row) => row.value);

  return (
    <article style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 18, boxShadow: "0 1px 2px rgba(15,23,42,0.04)", overflow: "hidden" }}>
      <div style={{ padding: "22px 22px 8px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 14 }}>
          <div style={{ display: "flex", gap: 14, minWidth: 0 }}>
            <div
              aria-hidden
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: c.brandSubtle,
                color: c.brand,
                display: "grid",
                placeItems: "center",
                fontSize: 22,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              {initial}
            </div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: "-0.02em" }}>{name}</h3>
              {match.headline && <p style={{ margin: "4px 0 0", fontSize: 15, color: c.textSecondary, lineHeight: 1.5 }}>{match.headline}</p>}
              {match.paused && (
                <span style={{ ...s.chip, marginTop: 8, background: c.amberSubtle, color: c.amber, border: "1px solid #FDE68A" }}>Paused job search</span>
              )}
            </div>
          </div>
          <div style={{ flexShrink: 0, textAlign: "center", padding: "8px 12px", borderRadius: 14, background: tone.bg, color: tone.color }}>
            <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{match.score}%</div>
            <div style={{ fontSize: 11.5, fontWeight: 600, marginTop: 3 }}>{tone.label}</div>
          </div>
        </div>

        <div className="hp-facts" style={{ marginTop: 16 }}>
          {(match.college || education) && (
            <span style={s.meta}>
              <GraduationCap size={16} aria-hidden /> {[match.college, education].filter(Boolean).join(" — ")}
            </span>
          )}
          {match.experienceYears != null && (
            <span style={s.meta}>
              <Briefcase size={16} aria-hidden /> {match.experienceYears === 0 ? "Fresher" : `${match.experienceYears} yrs experience`}
              {match.roles?.length ? ` · ${match.roles.join(", ")}` : ""}
            </span>
          )}
          {match.location && (
            <span style={s.meta}>
              <MapPin size={16} aria-hidden /> {match.location}
            </span>
          )}
        </div>
      </div>

      <div style={{ padding: "0 22px 8px" }}>
        <ContactDetails contact={match.contact || {}} name={name} />

        {(match.reasons?.length > 0 || match.gaps?.length > 0) && (
          <DetailBlock title="Why they match">
            <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {(match.reasons || []).map((reason) => (
                <li key={reason} style={{ display: "flex", gap: 8, fontSize: 14.5, lineHeight: 1.5 }}>
                  <CheckCircle2 size={16} color={c.green} style={{ marginTop: 2 }} aria-hidden />
                  {reason}
                </li>
              ))}
              {(match.gaps || []).map((gap) => (
                <li key={gap} style={{ display: "flex", gap: 8, fontSize: 14.5, lineHeight: 1.5, color: c.textMuted }}>
                  <AlertCircle size={16} color={c.amber} style={{ marginTop: 2 }} aria-hidden />
                  {gap}
                </li>
              ))}
            </ul>
          </DetailBlock>
        )}

        {match.summary && (
          <DetailBlock title="About">
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.7, color: c.textSecondary }}>{match.summary}</p>
          </DetailBlock>
        )}

        {skills.length > 0 && (
          <DetailBlock title="Skills">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {skills.map((skill) => (
                <span key={skill} style={{ ...s.chip, ...(matched.has(skill.toLowerCase()) ? s.chipMatched : null) }}>
                  {skill}
                </span>
              ))}
            </div>
          </DetailBlock>
        )}

        {preferences.length > 0 && (
          <DetailBlock title="Preferences">
            <dl className="hp-dl" style={{ margin: 0 }}>
              {preferences.map((row) => (
                <div key={row.label}>
                  <dt style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: c.textMuted }}>{row.label}</dt>
                  <dd style={{ margin: "4px 0 0", fontSize: 15, color: c.text }}>{row.value}</dd>
                </div>
              ))}
            </dl>
          </DetailBlock>
        )}

        {match.companies?.length > 0 && (
          <DetailBlock title="Experience">
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: c.textSecondary }}>{match.companies.join(" · ")}</p>
          </DetailBlock>
        )}

        {match.projects?.length > 0 && (
          <DetailBlock title="Projects">
            <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: c.textSecondary }}>{match.projects.join(" · ")}</p>
          </DetailBlock>
        )}
      </div>

      <div style={{ marginTop: 8, padding: 18, borderTop: `1px solid ${c.border}`, background: c.muted }}>
        {match.intro ? (
          <IntroPanel intro={match.intro} firstName={firstName} />
        ) : composing ? (
          <ReachOutForm
            firstName={firstName}
            onCancel={() => setComposing(false)}
            onSend={async (payload) => {
              await onReachOut(match.matchId, payload);
              setComposing(false);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setComposing(true)}
            disabled={match.paused}
            style={{
              ...s.pillButton,
              width: "100%",
              border: "none",
              background: match.paused ? "#E2E8F0" : c.brand,
              color: match.paused ? c.textMuted : "#fff",
              cursor: match.paused ? "not-allowed" : "pointer",
            }}
          >
            <MessageCircle size={17} aria-hidden />
            Reach out
          </button>
        )}
      </div>
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
  const [access, setAccess] = useState(readSavedJob);
  const [loadingSaved, setLoadingSaved] = useState(Boolean(access));
  const [showForm, setShowForm] = useState(!readSavedJob());
  const accessRef = useRef(access);
  accessRef.current = access;

  const refresh = useCallback(async () => {
    const current = accessRef.current;
    if (!current) return null;
    const data = await postJson("job", { jobId: current.jobId, key: current.key });
    setResult(data);
    return data;
  }, []);

  useEffect(() => {
    if (!access || result) return;
    refresh()
      .then((data) => {
        if (data?.recruiter) setForm(data.recruiter);
        if (data) setShowForm(false);
      })
      .catch((err) => {
        setError(err.message);
        setAccess(null);
        setShowForm(true);
      })
      .finally(() => setLoadingSaved(false));
    // Only on first load with a saved link.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasPending = Boolean(result?.matches.some((m) => m.intro && IN_PROGRESS.includes(m.intro.status)));
  useEffect(() => {
    if (!hasPending) return undefined;
    const tick = () => document.visibilityState === "visible" && refresh().catch(() => {});
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [hasPending, refresh]);

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
    try {
      const payload =
        mode === "upload"
          ? { ...form, fileName: file.name, fileBase64: bytesToBase64(file.bytes) }
          : { ...form, jdText };
      const { accessKey, ...data } = await postJson("match", payload);
      const saved = { jobId: data.jobId, key: accessKey };
      setAccess(saved);
      saveJobInUrl(saved.jobId, saved.key);
      setResult(data);
      setShowForm(false);
      requestAnimationFrame(() => document.getElementById("hp-results")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const onReachOut = async (matchId, { note, questions }) => {
    const { intro } = await postJson("reach-out", { jobId: access.jobId, key: access.key, matchId, note, questions });
    setResult((prev) => ({
      ...prev,
      matches: prev.matches.map((m) => (m.matchId === matchId ? { ...m, intro } : m)),
    }));
  };

  const tabStyle = (active) => ({
    ...s.tab,
    background: active ? "#fff" : "transparent",
    color: active ? c.text : c.textMuted,
    boxShadow: active ? "0 1px 2px rgba(15,23,42,0.08)" : "none",
  });

  const resultsLink = access && typeof window !== "undefined" ? window.location.href : "";

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
          {(!result || showForm) && (
            <>
              <p style={s.eyebrow}>For recruiters</p>
              <h1 style={s.title}>Find matched IIT &amp; NIT talent for your role</h1>
              <p style={s.lead}>
                Share a job description. We show you the best fits with their name, resume and full profile. Reach out
                and Mira will ask them on WhatsApp, then email you the details.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginTop: 22 }}>
                {HOW_IT_WORKS.map((step) => (
                  <div key={step.n} style={{ background: c.surface, border: `1px solid ${c.border}`, borderRadius: 14, padding: "14px 16px" }}>
                    <div style={{ width: 26, height: 26, borderRadius: 8, background: c.brandSubtle, color: c.brand, display: "grid", placeItems: "center", fontSize: 13, fontWeight: 800 }}>
                      {step.n}
                    </div>
                    <p style={{ margin: "10px 0 0", fontSize: 15, fontWeight: 700 }}>{step.title}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13.5, lineHeight: 1.5, color: c.textMuted }}>{step.body}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {loadingSaved ? (
            <div style={{ ...s.card, display: "flex", alignItems: "center", gap: 10, color: c.textSecondary }}>
              <span style={{ ...s.spinner, border: `2.5px solid ${c.brandBorder}`, borderTopColor: c.brand }} aria-hidden />
              Loading your results…
            </div>
          ) : showForm ? (
            <form onSubmit={onSubmit} style={s.card}>
              {result && (
                <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Search another role</p>
                  <button type="button" className="hp-ghost" onClick={() => setShowForm(false)}>
                    Back to results
                  </button>
                </div>
              )}
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
                  <AlertCircle size={17} style={{ marginTop: 1 }} aria-hidden />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" disabled={!canSubmit} aria-busy={searching} style={{ ...s.submit, ...(canSubmit || searching ? null : { background: "#BFDBFE", color: c.textMuted, cursor: "not-allowed" }) }}>
                {searching ? <span style={s.spinner} aria-hidden /> : <Sparkles size={18} aria-hidden />}
                {searching ? stepLabel : result ? "Search again" : "Find matching candidates"}
              </button>
              <p style={{ margin: "12px 0 0", fontSize: 13, color: c.textMuted, textAlign: "center" }}>
                Please use candidate details only to discuss this role with them.
              </p>
            </form>
          ) : null}

          {result && (
            <section id="hp-results" style={{ scrollMarginTop: 80, marginTop: showForm ? 28 : 0 }}>
              <JobSummary
                job={result.job}
                poolSize={result.poolSize}
                matchCount={result.matches.length}
                resultsLink={resultsLink}
                onNewSearch={() => {
                  setShowForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
              {result.matches.length > 0 ? (
                <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
                  {result.matches.map((match) => (
                    <MatchCard key={match.matchId} match={match} onReachOut={onReachOut} />
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
