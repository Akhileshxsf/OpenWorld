import { useEffect, useId, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { LightMode } from "@chakra-ui/react";
import { AlertCircle, CheckCircle2, FileText, MessageCircle, Paperclip } from "lucide-react";

const MIRA_WHATSAPP_URL = `https://wa.me/${String(import.meta.env.VITE_WHATSAPP_NUMBER || "919877174681").replace(/\D/g, "")}`;
const NEW_LINK_WHATSAPP_URL = `${MIRA_WHATSAPP_URL}?text=${encodeURIComponent("Send me a new resume upload link")}`;
const OUTDATED_LINK_MESSAGE = "This upload link is old or incomplete.";
const WHATSAPP_REDIRECT_MS = 2000;
const MAX_BYTES = 8 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = [".pdf", ".doc", ".docx"];
const UPLOAD_STEPS = [
  { after: 0, label: "Uploading…" },
  { after: 4000, label: "Reading your resume…" },
  { after: 10000, label: "Building your profile…" },
];

function getUploadApiUrl() {
  if (import.meta.env.VITE_RESUME_UPLOAD_API) {
    return import.meta.env.VITE_RESUME_UPLOAD_API;
  }
  if (typeof window !== "undefined" && window.location.origin) {
    return `${window.location.origin}/api/upload-resume`;
  }
  return "https://openworldx.com/api/upload-resume";
}

function bytesToBase64(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

function hasPdfSignature(bytes) {
  return bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
}

function formatFileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file, bytes) {
  const name = file.name.toLowerCase();
  const knownExtension = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
  if (!knownExtension && !hasPdfSignature(bytes)) {
    return "Please choose a PDF or Word file (.pdf, .doc, .docx).";
  }
  if (file.size > MAX_BYTES) {
    return `This file is ${formatFileSize(file.size)}. The limit is 8 MB.`;
  }
  return "";
}

const PDFJS_CDN = "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build";

function loadPdfjsFromCdn() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${PDFJS_CDN}/pdf.min.js`;
    script.onload = () => (window.pdfjsLib ? resolve(window.pdfjsLib) : reject(new Error("pdf.js missing")));
    script.onerror = () => reject(new Error("pdf.js CDN load failed"));
    document.head.appendChild(script);
  });
}

/** A tab opened before a redeploy references chunks that no longer exist, so fall back to the CDN build. */
async function loadPdfjs() {
  try {
    const [pdfjs, { default: workerUrl }] = await Promise.all([
      import("pdfjs-dist"),
      import("pdfjs-dist/build/pdf.worker.min.js?url"),
    ]);
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    return pdfjs;
  } catch (error) {
    console.warn("Bundled pdf.js failed, using CDN", error);
    const pdfjs = await loadPdfjsFromCdn();
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_CDN}/pdf.worker.min.js`;
    return pdfjs;
  }
}

/** Renders page 1 to an image. pdf.js is loaded only when a PDF is picked to keep the page light. */
async function renderPdfFirstPage(bytes, targetWidth) {
  const pdfjs = await loadPdfjs();
  // pdf.js transfers the buffer to its worker, so give it a copy and keep the original for upload.
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const page = await pdf.getPage(1);
  const base = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: targetWidth / base.width });

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const context = canvas.getContext("2d");
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
  await page.render({ canvasContext: context, viewport }).promise;

  const result = { src: canvas.toDataURL("image/jpeg", 0.85), pages: pdf.numPages };
  pdf.destroy();
  return result;
}

const styles = {
  page: {
    minHeight: "100dvh",
    boxSizing: "border-box",
    background: "#F8FAFC",
    color: "#0F172A",
    fontFamily: 'Roboto, system-ui, -apple-system, "Segoe UI", sans-serif',
    padding: "max(56px, calc(env(safe-area-inset-top) + 40px)) 18px max(40px, env(safe-area-inset-bottom))",
  },
  brand: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: 8,
    fontSize: 14.5,
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: "#2563EB",
  },
  title: {
    margin: "14px 0 0",
    fontSize: 27,
    fontWeight: 700,
    lineHeight: 1.2,
  },
  body: {
    margin: "12px 0 0",
    fontSize: 17,
    lineHeight: 1.65,
    color: "#475569",
  },
  card: {
    marginTop: 32,
    boxSizing: "border-box",
    height: "clamp(340px, 45dvh, 420px)",
    background: "#FFFFFF",
    border: "1px solid #E2E8F0",
    borderRadius: 13,
    padding: 18,
    display: "flex",
    flexDirection: "column",
  },
  cardHeading: {
    margin: 0,
    fontSize: 16,
    fontWeight: 700,
  },
  cardHint: {
    margin: "2px 0 0",
    fontSize: 14,
    color: "#64748B",
  },
  previewPanel: {
    position: "relative",
    flex: 1,
    minHeight: 120,
    marginTop: 12,
    borderRadius: 10,
    overflow: "hidden",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
  },
  placeholder: {
    background: "#F1F5F9",
    border: "1.5px dashed #CBD5E1",
    color: "#64748B",
  },
  previewFilled: {
    background: "#F1F5F9",
    border: "1px solid #E2E8F0",
    justifyContent: "flex-start",
    padding: "10px 10px 0",
  },
  previewImage: {
    display: "block",
    width: "100%",
    borderRadius: "4px 4px 0 0",
    boxShadow: "0 1px 4px rgba(15, 23, 42, 0.15)",
    background: "#FFFFFF",
  },
  skeleton: {
    width: "100%",
    flex: 1,
    borderRadius: "4px 4px 0 0",
    background: "linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)",
    backgroundSize: "200% 100%",
    animation: "ow-shimmer 1.2s linear infinite",
  },
  fileRow: {
    marginTop: 12,
    display: "flex",
    alignItems: "center",
    gap: 12,
    minWidth: 0,
  },
  choose: {
    flexShrink: 0,
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    height: 40,
    padding: "0 14px",
    background: "#FFFFFF",
    border: "1.5px solid #2563EB",
    color: "#2563EB",
    fontSize: 16,
    fontWeight: 600,
    borderRadius: 8,
    cursor: "pointer",
  },
  fileInfo: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
  },
  fileName: {
    display: "flex",
    alignItems: "center",
    gap: 5,
    fontSize: 15,
    fontWeight: 600,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  fileMeta: {
    fontSize: 13,
    color: "#64748B",
  },
  error: {
    marginTop: 10,
    display: "flex",
    alignItems: "flex-start",
    gap: 6,
    padding: "8px 10px",
    borderRadius: 8,
    background: "#FEF2F2",
    color: "#B91C1C",
    fontSize: 14,
    lineHeight: 1.4,
  },
  upload: {
    marginTop: 12,
    flexShrink: 0,
    width: "100%",
    height: 46,
    border: "none",
    borderRadius: 999,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    fontSize: 18,
    fontWeight: 700,
    transition: "background 0.2s, color 0.2s",
  },
  uploadIdle: {
    background: "#BFDBFE",
    color: "#64748B",
    cursor: "not-allowed",
  },
  uploadReady: {
    background: "#2563EB",
    color: "#FFFFFF",
    cursor: "pointer",
  },
  spinner: {
    width: 18,
    height: 18,
    borderRadius: "50%",
    border: "2.5px solid rgba(255, 255, 255, 0.4)",
    borderTopColor: "#FFFFFF",
    animation: "ow-spin 0.8s linear infinite",
  },
};

const keyframes = `
@keyframes ow-spin { to { transform: rotate(360deg); } }
@keyframes ow-shimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
`;

/** Phones in Chrome's "Desktop site" mode ignore the viewport meta and render ~980px wide. */
function getDesktopModeZoom() {
  if (typeof window === "undefined") return 1;
  const isTouchPhone = navigator.maxTouchPoints > 0 && window.screen.width > 0 && window.screen.width < 600;
  const ratio = window.innerWidth / window.screen.width;
  return isTouchPhone && ratio > 1.5 ? ratio : 1;
}

const ResumeUploadPage = () => {
  const [zoom] = useState(getDesktopModeZoom);
  const fileInputId = useId();
  const [searchParams] = useSearchParams();
  const phone = useMemo(() => String(searchParams.get("phone") || "").replace(/\D/g, ""), [searchParams]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const linkToken = searchParams.get("t") || "";
  const [error, setError] = useState(phone && linkToken ? "" : OUTDATED_LINK_MESSAGE);
  const [linkProblem, setLinkProblem] = useState(!(phone && linkToken));
  const [uploading, setUploading] = useState(false);
  const [stepLabel, setStepLabel] = useState(UPLOAD_STEPS[0].label);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!file?.isPdf) {
      setPreview(null);
      return undefined;
    }
    let cancelled = false;
    setPreview({ status: "loading" });
    renderPdfFirstPage(file.bytes, 900)
      .then((result) => !cancelled && setPreview({ status: "ready", ...result }))
      .catch((err) => {
        console.error("PDF preview failed", err);
        if (!cancelled) setPreview({ status: "failed" });
      });
    return () => {
      cancelled = true;
    };
  }, [file]);

  useEffect(() => {
    if (!done) return undefined;
    const timer = setTimeout(() => window.location.assign(MIRA_WHATSAPP_URL), WHATSAPP_REDIRECT_MS);
    return () => clearTimeout(timer);
  }, [done]);

  useEffect(() => {
    if (!uploading) return undefined;
    setStepLabel(UPLOAD_STEPS[0].label);
    const timers = UPLOAD_STEPS.slice(1).map((step) => setTimeout(() => setStepLabel(step.label), step.after));
    return () => timers.forEach(clearTimeout);
  }, [uploading]);

  const onFileChange = async (e) => {
    const input = e.target;
    const picked = input.files?.[0];
    if (!picked) return;

    // Cloud-backed pickers (Google Drive, WhatsApp documents) can revoke access once the input is reset.
    let bytes;
    try {
      bytes = new Uint8Array(await picked.arrayBuffer());
    } catch (err) {
      console.error("Could not read file", err);
      setError("Couldn't open that file. If it's in Google Drive, download it to your phone first, then choose it again.");
      return;
    } finally {
      input.value = "";
    }

    const problem = validateFile(picked, bytes);
    if (problem) {
      setError(problem);
      return;
    }
    const isPdf = hasPdfSignature(bytes);
    const lowerName = picked.name.toLowerCase();
    const name = isPdf && !lowerName.endsWith(".pdf") ? `${picked.name || "resume"}.pdf` : picked.name;
    if (!linkProblem) setError("");
    setFile({ name, size: picked.size, bytes, isPdf });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!phone || !file || uploading || linkProblem) return;

    setError("");
    setUploading(true);
    try {
      const fileBase64 = bytesToBase64(file.bytes);
      const response = await fetch(getUploadApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, token: linkToken, fileName: file.name, fileBase64 }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (/link/i.test(data.error || "")) {
          setLinkProblem(true);
          throw new Error(OUTDATED_LINK_MESSAGE);
        }
        throw new Error(data.error || "Upload failed. Please try again.");
      }
      setDone(true);
    } catch (err) {
      console.error(err);
      setError(err.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const ready = Boolean(phone && file) && !uploading && !linkProblem;
  const pageCount = preview?.status === "ready" ? preview.pages : null;
  const fileMeta = file
    ? [pageCount ? `${pageCount} page${pageCount === 1 ? "" : "s"}` : null, formatFileSize(file.size)]
        .filter(Boolean)
        .join(" · ")
    : "";

  const renderPreview = () => {
    if (!file) {
      return (
        <>
          <FileText size={30} strokeWidth={1.5} color="#94A3B8" aria-hidden />
          <span style={{ marginTop: 8, fontSize: 15, padding: "0 16px" }}>File preview will be shown here</span>
          <span style={{ marginTop: 2, fontSize: 13, color: "#94A3B8" }}>Tap to choose your resume</span>
        </>
      );
    }
    if (preview?.status === "loading") {
      return <div style={styles.skeleton} aria-label="Loading preview" />;
    }
    if (preview?.status === "ready") {
      return <img src={preview.src} alt={`First page of ${file.name}`} style={styles.previewImage} />;
    }
    return (
      <div style={{ margin: "auto", display: "flex", flexDirection: "column", alignItems: "center", color: "#475569" }}>
        <FileText size={40} strokeWidth={1.5} color="#2563EB" aria-hidden />
        <span style={{ marginTop: 8, fontSize: 15, fontWeight: 600, maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {file.name}
        </span>
        <span style={{ fontSize: 13, color: "#64748B" }}>
          {file.isPdf ? "Preview unavailable — the file will still upload" : "Word document · ready to upload"}
        </span>
      </div>
    );
  };

  return (
    <LightMode>
      <style>{keyframes}</style>
      <main style={zoom === 1 ? styles.page : { ...styles.page, zoom, minHeight: `calc(100dvh / ${zoom})` }}>
        <p style={styles.brand}>
          <img
            src="/logohero.jpeg"
            alt=""
            aria-hidden
            width={22}
            height={22}
            style={{ objectFit: "contain", mixBlendMode: "multiply", margin: "-3px 0" }}
          />
          OpenWorldX · Mira
        </p>
        <h1 style={styles.title}>Upload your resume</h1>
        <p style={styles.body}>
          PDF or Word — we&apos;ll use this with your WhatsApp profile.{" "}
          {phone ? `Linked to +${phone}.` : "Use the link from WhatsApp."}
        </p>

        {done ? (
          <section style={{ ...styles.card, justifyContent: "center", padding: "0 28px" }}>
            <CheckCircle2 size={40} color="#16A34A" aria-hidden />
            <p style={{ margin: "12px 0 0", fontSize: 24, fontWeight: 700 }}>Resume received!</p>
            <p style={{ ...styles.body, marginTop: 10 }}>
              Taking you back to WhatsApp — Mira has sent you a message there.
            </p>
            <a
              href={MIRA_WHATSAPP_URL}
              style={{ ...styles.upload, ...styles.uploadReady, background: "#25D366", marginTop: 24, textDecoration: "none" }}
            >
              <MessageCircle size={20} aria-hidden />
              Back to WhatsApp
            </a>
          </section>
        ) : (
          <form onSubmit={onSubmit} style={styles.card}>
            <p style={styles.cardHeading}>Your resume</p>
            <p style={styles.cardHint}>PDF or Word · max 8 MB</p>

            <input
              id={fileInputId}
              type="file"
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              aria-label="Resume file"
              style={{ display: "none" }}
              disabled={uploading}
              onChange={onFileChange}
            />

            <label
              htmlFor={fileInputId}
              style={{ ...styles.previewPanel, ...(file ? styles.previewFilled : styles.placeholder) }}
            >
              {renderPreview()}
            </label>

            <div style={styles.fileRow}>
              <label htmlFor={fileInputId} style={{ ...styles.choose, opacity: uploading ? 0.5 : 1 }}>
                <Paperclip size={17} aria-hidden />
                {file ? "Change" : "Choose File"}
              </label>
              {file && (
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>
                    <CheckCircle2 size={15} color="#16A34A" style={{ flexShrink: 0 }} aria-hidden />
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{file.name}</span>
                  </span>
                  <span style={styles.fileMeta}>{fileMeta}</span>
                </div>
              )}
            </div>

            {error && (
              <div role="alert" style={styles.error}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} aria-hidden />
                <span>
                  {error}
                  {linkProblem && (
                    <>
                      {" "}
                      <a href={NEW_LINK_WHATSAPP_URL} style={{ color: "#B91C1C", fontWeight: 700 }}>
                        Get a new link on WhatsApp
                      </a>
                    </>
                  )}
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={!ready && !uploading}
              aria-busy={uploading}
              style={{ ...styles.upload, ...(ready || uploading ? styles.uploadReady : styles.uploadIdle) }}
            >
              {uploading && <span style={styles.spinner} aria-hidden />}
              {uploading ? stepLabel : "Upload resume"}
            </button>
          </form>
        )}
      </main>
    </LightMode>
  );
};

export default ResumeUploadPage;
