import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { LightMode } from "@chakra-ui/react";
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
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
const RETRYABLE = ["undeliverable", "expired"];
const MIRA_QUESTION_PLACEHOLDER = "Mira will ask them and mail you the details";
const PAGE_SIZE = 4;

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
        body: "Mira couldn't send the message. Try again, or contact them directly.",
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
.hp-glass {
  background: rgba(255, 255, 255, 0.58);
  backdrop-filter: blur(18px) saturate(160%);
  -webkit-backdrop-filter: blur(18px) saturate(160%);
  border: 1px solid rgba(255, 255, 255, 0.72);
  box-shadow: 0 8px 32px rgba(15, 23, 42, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.85);
}
.hp-glass-strong {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: blur(20px) saturate(170%);
  -webkit-backdrop-filter: blur(20px) saturate(170%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.09), inset 0 1px 0 rgba(255, 255, 255, 0.95);
}
.hp-input { width: 100%; box-sizing: border-box; height: 46px; padding: 0 14px; border: 1px solid rgba(203, 213, 225, 0.9); border-radius: 12px; font: inherit; font-size: 16px; color: ${c.text}; background: rgba(255,255,255,0.85); outline: none; }
.hp-input:focus, .hp-textarea:focus { border-color: ${c.brand}; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
.hp-textarea { width: 100%; box-sizing: border-box; min-height: 190px; padding: 12px 14px; border: 1px solid rgba(203, 213, 225, 0.9); border-radius: 12px; font: inherit; font-size: 15px; line-height: 1.6; color: ${c.text}; background: rgba(255,255,255,0.85); resize: vertical; outline: none; }
.hp-textarea.hp-small { min-height: 110px; font-size: 14.5px; }
#hp-root svg { flex-shrink: 0; }
.hp-input::placeholder, .hp-textarea::placeholder { color: #94A3B8; opacity: 1; }
.hp-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
.hp-facts { display: grid; grid-template-columns: 1fr; gap: 10px 20px; }
.hp-dl { display: grid; grid-template-columns: 1fr; gap: 10px 24px; }
.hp-contact { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(226, 232, 240, 0.95); background: rgba(255,255,255,0.72); color: ${c.text}; font-size: 13.5px; font-weight: 500; text-decoration: none; max-width: 100%; }
.hp-contact:hover { border-color: ${c.brandBorder}; background: ${c.brandSubtle}; color: ${c.brand}; }
.hp-contact span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hp-download { display: inline-flex; align-items: center; justify-content: center; gap: 8px; height: 40px; padding: 0 16px; border-radius: 999px; border: 1.5px solid ${c.brand}; background: rgba(239, 246, 255, 0.9); color: ${c.brand}; font-size: 14.5px; font-weight: 700; text-decoration: none; cursor: pointer; }
.hp-download:hover { background: ${c.brand}; color: #fff; }
.hp-download:disabled { opacity: 0.55; cursor: default; }
.hp-ghost { display: inline-flex; align-items: center; gap: 6px; height: 36px; padding: 0 12px; border-radius: 999px; border: 1px solid rgba(203, 213, 225, 0.95); background: rgba(255,255,255,0.55); color: ${c.textSecondary}; font-size: 14px; font-weight: 600; cursor: pointer; }
.hp-ghost:hover { border-color: ${c.brandBorder}; color: ${c.brand}; background: rgba(239, 246, 255, 0.85); }
.hp-results-shell { margin-top: 16px; }
.hp-list-detail { display: grid; grid-template-columns: 1fr; gap: 12px; min-width: 0; margin-top: 12px; }
.hp-more-btn { display: inline-flex; align-items: center; gap: 4px; margin: 10px 0 0; padding: 0; border: none; background: none; font: inherit; font-size: 14px; font-weight: 600; color: ${c.brand}; cursor: pointer; }
.hp-more-btn:hover { color: ${c.brandHover}; text-decoration: underline; }
.hp-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.hp-contact.hp-compact { height: 32px; font-size: 12.5px; padding: 0 10px; }
.hp-download.hp-compact { height: 32px; font-size: 13px; padding: 0 12px; }
.hp-candidate-row { width: 100%; text-align: left; padding: 14px 16px; border-radius: 16px; border: 1px solid transparent; background: rgba(255,255,255,0.35); cursor: pointer; transition: background 0.15s, border-color 0.15s, box-shadow 0.15s; }
.hp-candidate-row:hover { background: rgba(255,255,255,0.62); border-color: rgba(191, 219, 254, 0.9); }
.hp-candidate-row.hp-selected { background: rgba(255,255,255,0.88); border-color: ${c.brandBorder}; box-shadow: 0 4px 20px rgba(37, 99, 235, 0.12); }
.hp-pagination { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 14px; padding-top: 14px; border-top: 1px solid rgba(226, 232, 240, 0.8); flex-wrap: wrap; }
.hp-page-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 36px; height: 36px; padding: 0 10px; border-radius: 10px; border: 1px solid rgba(203, 213, 225, 0.95); background: rgba(255,255,255,0.65); font: inherit; font-size: 14px; font-weight: 600; color: ${c.textSecondary}; cursor: pointer; }
.hp-page-btn:hover:not(:disabled) { border-color: ${c.brandBorder}; color: ${c.brand}; background: rgba(239, 246, 255, 0.9); }
.hp-page-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.hp-page-btn.hp-page-active { background: ${c.brand}; border-color: ${c.brand}; color: #fff; }
@media (min-width: 720px) {
  .hp-row { grid-template-columns: 1fr 1fr 1fr; }
  .hp-facts { grid-template-columns: 1fr 1fr; }
  .hp-dl { grid-template-columns: 1fr 1fr; }
}
@media (min-width: 960px) {
  .hp-list-detail { grid-template-columns: minmax(220px, 260px) 1fr; align-items: start; }
}
@keyframes hp-spin { to { transform: rotate(360deg); } }
`;

const s = {
  page: {
    minHeight: "100dvh",
    background:
      "radial-gradient(ellipse 85% 55% at 15% -5%, rgba(37, 99, 235, 0.2), transparent)," +
      "radial-gradient(ellipse 55% 45% at 95% 5%, rgba(99, 102, 241, 0.14), transparent)," +
      `linear-gradient(180deg, #eef4ff 0%, ${c.page} 45%, #f1f5f9 100%)`,
    color: c.text,
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
  },
  topBar: {
    position: "sticky",
    top: 0,
    zIndex: 10,
    background: "rgba(255,255,255,0.55)",
    backdropFilter: "blur(16px) saturate(160%)",
    WebkitBackdropFilter: "blur(16px) saturate(160%)",
    borderBottom: "1px solid rgba(255,255,255,0.65)",
  },
  topInner: {
    maxWidth: 1120,
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
  main: { maxWidth: 1120, margin: "0 auto", padding: "36px 20px 80px" },
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
    borderRadius: 16,
    padding: "clamp(14px, 2.5vw, 20px)",
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
  section: { marginTop: 12, paddingTop: 12, borderTop: `1px solid rgba(226,232,240,0.75)` },
};

const MoreToggle = ({ open, onToggle, label = "…more" }) => (
  <button type="button" className="hp-more-btn" onClick={onToggle} aria-expanded={open}>
    {open ? "Show less" : label}
    <ChevronDown size={16} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} aria-hidden />
  </button>
);

const HOW_IT_WORKS = [
  { n: "1", title: "Share the role", body: "Upload or paste the job description." },
  { n: "2", title: "Review full profiles", body: "Name, resume, contact and every detail we have." },
  { n: "3", title: "Reach out via Mira", body: "She asks them on WhatsApp and emails you the answers." },
];

const JobSummary = ({ job, poolSize, matchCount, resultsLink, onNewSearch }) => {
  const [copied, setCopied] = useState(false);
  const [more, setMore] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(resultsLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", resultsLink);
    }
  };
  const skills = job.mustHaveSkills || [];
  const visibleSkills = more ? skills : skills.slice(0, 4);

  return (
    <div className="hp-glass" style={{ ...s.card, marginTop: 0, padding: "14px 16px" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.3 }}>{job.title}</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: c.textMuted }}>
            {matchCount} match{matchCount === 1 ? "" : "es"} · {poolSize} profiles
            {job.location ? ` · ${job.location}` : ""}
            {job.experienceMin != null ? ` · ${job.experienceMin}${job.experienceMax != null ? `–${job.experienceMax}` : "+"} yrs` : ""}
          </p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {resultsLink && (
            <button type="button" onClick={copy} className="hp-contact hp-compact" style={{ cursor: "pointer" }}>
              {copied ? <CheckCircle2 size={14} color={c.green} aria-hidden /> : <Copy size={14} aria-hidden />}
              <span>{copied ? "Copied" : "Copy link"}</span>
            </button>
          )}
          <button type="button" className="hp-ghost" style={{ height: 32, fontSize: 13 }} onClick={onNewSearch}>
            New search
          </button>
        </div>
      </div>
      {visibleSkills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {visibleSkills.map((skill) => (
            <span key={skill} style={{ ...s.chip, height: 24, fontSize: 12 }}>
              {skill}
            </span>
          ))}
        </div>
      )}
      {(job.summary || skills.length > 4) && (
        <MoreToggle open={more} onToggle={() => setMore((v) => !v)} label="…more about this role" />
      )}
      {more && (
        <div style={{ marginTop: 8 }}>
          {job.summary && <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: c.textSecondary }}>{job.summary}</p>}
          {skills.length > 4 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: job.summary ? 10 : 0 }}>
              {skills.slice(4).map((skill) => (
                <span key={skill} style={{ ...s.chip, height: 24, fontSize: 12 }}>
                  {skill}
                </span>
              ))}
            </div>
          )}
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

const ContactStrip = ({ contact, name, compact = false }) => {
  const [downloading, setDownloading] = useState(false);
  const cls = compact ? "hp-compact" : "";

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
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
      {contact.resumeUrl ? (
        <button type="button" className={`hp-download ${cls}`} onClick={onDownload} disabled={downloading}>
          {downloading ? <span style={{ ...s.spinner, border: `2.5px solid ${c.brandBorder}`, borderTopColor: c.brand }} aria-hidden /> : <Download size={14} aria-hidden />}
          {downloading ? "…" : "Resume"}
        </button>
      ) : null}
      {contact.phone && (
        <a href={`tel:${contact.phone}`} className={`hp-contact ${cls}`}>
          <Phone size={14} aria-hidden />
          <span>{compact ? "Call" : contact.phone}</span>
        </a>
      )}
      {contact.email && (
        <a href={`mailto:${contact.email}`} className={`hp-contact ${cls}`}>
          <Mail size={14} aria-hidden />
          <span>{compact ? "Email" : contact.email}</span>
        </a>
      )}
      {contact.whatsappUrl && (
        <a href={contact.whatsappUrl} className={`hp-contact ${cls}`} target="_blank" rel="noopener noreferrer">
          <MessageCircle size={14} aria-hidden />
          <span>WhatsApp</span>
        </a>
      )}
      {contact.linkedInUrl && (
        <a href={contact.linkedInUrl} className={`hp-contact ${cls}`} target="_blank" rel="noopener noreferrer">
          <Linkedin size={14} aria-hidden />
          <span>LinkedIn</span>
        </a>
      )}
      {contact.githubUrl && (
        <a href={contact.githubUrl} className={`hp-contact ${cls}`} target="_blank" rel="noopener noreferrer">
          <Github size={14} aria-hidden />
          <span>GitHub</span>
        </a>
      )}
      {contact.portfolioUrl && (
        <a href={contact.portfolioUrl} className={`hp-contact ${cls}`} target="_blank" rel="noopener noreferrer">
          <Globe size={14} aria-hidden />
          <span>Web</span>
        </a>
      )}
    </div>
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

function introBadge(intro) {
  if (!intro) return null;
  if (IN_PROGRESS.includes(intro.status)) return { label: "In progress", color: c.amber, bg: c.amberSubtle };
  if (intro.status === "accepted") return { label: "Interested", color: c.green, bg: c.greenSubtle };
  if (intro.status === "declined" || intro.status === "withdrawn") return { label: "Passed", color: c.textMuted, bg: c.muted };
  if (intro.status === "undeliverable") return { label: "Not reached", color: c.red, bg: c.redSubtle };
  return { label: intro.status.replace(/_/g, " "), color: c.textMuted, bg: c.muted };
}

const Pagination = ({ page, pageCount, total, onPage }) => {
  if (pageCount <= 1) return null;
  const from = page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const pages = Array.from({ length: pageCount }, (_, i) => i);

  return (
    <nav className="hp-pagination" aria-label="Candidate pages">
      <span style={{ fontSize: 13.5, color: c.textMuted }}>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
        <button type="button" className="hp-page-btn" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Previous page">
          <ChevronLeft size={18} aria-hidden />
        </button>
        {pages.map((i) => (
          <button
            key={i}
            type="button"
            className={`hp-page-btn${i === page ? " hp-page-active" : ""}`}
            onClick={() => onPage(i)}
            aria-label={`Page ${i + 1}`}
            aria-current={i === page ? "page" : undefined}
          >
            {i + 1}
          </button>
        ))}
        <button type="button" className="hp-page-btn" disabled={page >= pageCount - 1} onClick={() => onPage(page + 1)} aria-label="Next page">
          <ChevronRight size={18} aria-hidden />
        </button>
      </div>
    </nav>
  );
};

const CompactMatchRow = ({ match, selected, onSelect }) => {
  const name = match.contact?.name || "Candidate";
  const tone = scoreTone(match.score);
  const badge = introBadge(match.intro);
  const initial = name.charAt(0).toUpperCase();

  return (
    <button type="button" className={`hp-candidate-row${selected ? " hp-selected" : ""}`} onClick={() => onSelect(match.matchId)}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <div
          aria-hidden
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: "rgba(239, 246, 255, 0.95)",
            color: c.brand,
            display: "grid",
            placeItems: "center",
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
            <span style={{ fontWeight: 700, fontSize: 15, lineHeight: 1.3, textAlign: "left" }}>{name}</span>
            <span style={{ fontWeight: 800, fontSize: 14, color: tone.color, flexShrink: 0 }}>{match.score}%</span>
          </div>
          {match.headline && (
            <p className="hp-clamp-2" style={{ margin: "4px 0 0", fontSize: 12.5, color: c.textMuted, lineHeight: 1.45, textAlign: "left" }}>{match.headline}</p>
          )}
          {badge && (
            <span style={{ ...s.chip, marginTop: 8, height: 24, fontSize: 11.5, background: badge.bg, color: badge.color, border: "none" }}>{badge.label}</span>
          )}
        </div>
      </div>
    </button>
  );
};

const ResultsPanel = ({ result, resultsLink, onNewSearch, onReachOut }) => {
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const matches = result.matches || [];
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageMatches = matches.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [result.jobId]);

  useEffect(() => {
    if (!pageMatches.length) {
      setSelectedId(null);
      return;
    }
    if (!pageMatches.some((m) => m.matchId === selectedId)) {
      setSelectedId(pageMatches[0].matchId);
    }
  }, [safePage, matches, pageMatches, selectedId]);

  const selected = matches.find((m) => m.matchId === selectedId) || pageMatches[0];

  return (
    <div className="hp-results-shell">
      <JobSummary job={result.job} poolSize={result.poolSize} matchCount={matches.length} resultsLink={resultsLink} onNewSearch={onNewSearch} />
      <div className="hp-list-detail">
        <div className="hp-glass" style={{ ...s.card, marginTop: 0, padding: 12 }}>
          <p style={{ ...s.sectionTitle, marginBottom: 8, fontSize: 13 }}>Candidates</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pageMatches.map((match) => (
              <CompactMatchRow key={match.matchId} match={match} selected={match.matchId === selectedId} onSelect={setSelectedId} />
            ))}
          </div>
          <Pagination page={safePage} pageCount={pageCount} total={matches.length} onPage={setPage} />
        </div>
        <div style={{ minWidth: 0 }}>
          {selected ? (
            <MatchCard key={selected.matchId} match={selected} onReachOut={onReachOut} />
          ) : (
            <div className="hp-glass" style={{ ...s.card, marginTop: 0, textAlign: "center", color: c.textMuted }}>
              Select a candidate to view their full profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MatchCard = ({ match, onReachOut }) => {
  const [composing, setComposing] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const tone = scoreTone(match.score);
  const matched = new Set((match.matchedSkills || []).map((m) => m.toLowerCase()));
  const skills = [...(match.skills || [])].sort((a, b) => Number(matched.has(b.toLowerCase())) - Number(matched.has(a.toLowerCase())));
  const name = match.contact?.name || "Candidate";
  const firstName = match.contact?.name ? match.contact.name.split(/\s+/)[0] : "";
  const education = [match.degree, match.graduationYear && `'${String(match.graduationYear).slice(-2)}`].filter(Boolean).join(" · ");
  const preferences = [
    { label: "Looking for", value: match.lookingFor },
    { label: "Employment type", value: match.employmentType },
    { label: "Expected CTC", value: match.expectedCtc },
    { label: "Availability", value: match.availability },
  ].filter((row) => row.value);
  const reasons = match.reasons || [];
  const gaps = match.gaps || [];
  const previewReasons = showMore ? reasons : reasons.slice(0, 2);
  const previewGaps = showMore ? gaps : gaps.slice(0, 1);
  const hiddenReasons = !showMore && reasons.length > 2;
  const hiddenGaps = !showMore && gaps.length > 1;
  const previewSkills = showMore ? skills : skills.slice(0, 8);
  const hasExtraProfile =
    reasons.length > 2 ||
    gaps.length > 1 ||
    skills.length > 8 ||
    Boolean(match.summary) ||
    preferences.length > 0 ||
    (match.companies?.length > 0) ||
    (match.projects?.length > 0);

  const factLine = [
    match.experienceYears != null ? (match.experienceYears === 0 ? "Fresher" : `${match.experienceYears} yrs`) : null,
    match.location,
    match.college || education || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="hp-glass-strong" style={{ borderRadius: 16, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px 10px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, lineHeight: 1.25 }}>{name}</h3>
              <span style={{ fontWeight: 800, fontSize: 14, color: tone.color }}>{match.score}% · {tone.label}</span>
            </div>
            {match.headline && (
              <p className={showMore ? undefined : "hp-clamp-2"} style={{ margin: "4px 0 0", fontSize: 13.5, color: c.textSecondary, lineHeight: 1.45 }}>
                {match.headline}
              </p>
            )}
            {match.paused && (
              <span style={{ ...s.chip, marginTop: 6, height: 22, fontSize: 11, background: c.amberSubtle, color: c.amber, border: "1px solid #FDE68A" }}>Paused</span>
            )}
            {factLine && <p style={{ margin: "6px 0 0", fontSize: 12.5, color: c.textMuted, lineHeight: 1.4 }}>{factLine}</p>}
          </div>
        </div>

        <div style={{ marginTop: 10 }}>
          <ContactStrip contact={match.contact || {}} name={name} compact />
        </div>

        {(previewReasons.length > 0 || previewGaps.length > 0) && (
          <ul style={{ margin: "10px 0 0", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {previewReasons.map((reason) => (
              <li key={reason} style={{ display: "flex", gap: 6, fontSize: 13, lineHeight: 1.45 }}>
                <CheckCircle2 size={14} color={c.green} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden />
                <span>{reason}</span>
              </li>
            ))}
            {previewGaps.map((gap) => (
              <li key={gap} style={{ display: "flex", gap: 6, fontSize: 13, lineHeight: 1.45, color: c.textMuted }}>
                <AlertCircle size={14} color={c.amber} style={{ marginTop: 2, flexShrink: 0 }} aria-hidden />
                <span>{gap}</span>
              </li>
            ))}
          </ul>
        )}

        {previewSkills.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}>
            {previewSkills.map((skill) => (
              <span key={skill} style={{ ...s.chip, height: 24, fontSize: 11.5, ...(matched.has(skill.toLowerCase()) ? s.chipMatched : null) }}>
                {skill}
              </span>
            ))}
            {!showMore && skills.length > 8 && (
              <span style={{ ...s.chip, height: 24, fontSize: 11.5, color: c.textMuted }}>+{skills.length - 8}</span>
            )}
          </div>
        )}

        {(hasExtraProfile || hiddenReasons || hiddenGaps) && (
          <MoreToggle open={showMore} onToggle={() => setShowMore((v) => !v)} label="…more" />
        )}

        {showMore && (
          <div style={{ marginTop: 4 }}>
            {match.summary && (
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.55, color: c.textSecondary }}>{match.summary}</p>
            )}
            {preferences.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 12.5, color: c.textMuted, lineHeight: 1.5 }}>
                {preferences.map((row) => `${row.label}: ${row.value}`).join(" · ")}
              </p>
            )}
            {match.companies?.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5, color: c.textSecondary }}>
                <strong style={{ fontWeight: 600, color: c.text }}>Experience: </strong>
                {match.companies.join(" · ")}
              </p>
            )}
            {match.projects?.length > 0 && (
              <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.5, color: c.textSecondary }}>
                <strong style={{ fontWeight: 600, color: c.text }}>Projects: </strong>
                {match.projects.join(" · ")}
              </p>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid rgba(226,232,240,0.85)", background: "rgba(241,245,249,0.45)" }}>
        {match.intro && <IntroPanel intro={match.intro} firstName={firstName} />}
        {(!match.intro || RETRYABLE.includes(match.intro.status)) &&
          (composing ? (
            <div style={{ marginTop: match.intro ? 12 : 0 }}>
              <ReachOutForm
                firstName={firstName}
                onCancel={() => setComposing(false)}
                onSend={async (payload) => {
                  await onReachOut(match.matchId, payload);
                  setComposing(false);
                }}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              disabled={match.paused}
              style={{
                ...s.pillButton,
                width: "100%",
                height: 40,
                marginTop: match.intro ? 8 : 0,
                fontSize: 14,
                border: "none",
                background: match.paused ? "#E2E8F0" : c.brand,
                color: match.paused ? c.textMuted : "#fff",
                cursor: match.paused ? "not-allowed" : "pointer",
              }}
            >
              <MessageCircle size={16} aria-hidden />
              {match.intro ? "Try again via WhatsApp" : "Reach out"}
            </button>
          ))}
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
                  <div key={step.n} className="hp-glass" style={{ borderRadius: 16, padding: "14px 16px" }}>
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
            <div className="hp-glass" style={{ ...s.card, display: "flex", alignItems: "center", gap: 10, color: c.textSecondary }}>
              <span style={{ ...s.spinner, border: `2.5px solid ${c.brandBorder}`, borderTopColor: c.brand }} aria-hidden />
              Loading your results…
            </div>
          ) : showForm ? (
            <form onSubmit={onSubmit} className="hp-glass-strong" style={s.card}>
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
              {result.matches.length > 0 ? (
                <ResultsPanel
                  result={result}
                  resultsLink={resultsLink}
                  onNewSearch={() => {
                    setShowForm(true);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onReachOut={onReachOut}
                />
              ) : (
                <>
                  <JobSummary
                    job={result.job}
                    poolSize={result.poolSize}
                    matchCount={0}
                    resultsLink={resultsLink}
                    onNewSearch={() => {
                      setShowForm(true);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                  <div className="hp-glass" style={{ ...s.card, textAlign: "center", color: c.textSecondary }}>
                    <Users size={32} color="#94A3B8" aria-hidden />
                    <p style={{ margin: "10px 0 0", fontSize: 17, fontWeight: 600, color: c.text }}>No strong matches yet</p>
                    <p style={{ margin: "6px 0 0", lineHeight: 1.6 }}>
                      We&apos;ve saved your role. Our team will reach out at {form.email} as matching candidates join.
                    </p>
                  </div>
                </>
              )}
            </section>
          )}
        </main>
      </div>
    </LightMode>
  );
};

export default HirePage;
