import { escapeHtml, sendEmail } from "./email.js";

function roleLabel(intro) {
  return `${intro.roleTitle || "your open role"}${intro.companyName ? ` at ${intro.companyName}` : ""}`;
}

function linkCell(label, value) {
  if (!/^https?:\/\//.test(value)) return escapeHtml(value);
  return `<a href="${escapeHtml(value)}" style="color:#2563EB">${escapeHtml(label === "Resume" ? "Download resume" : value)}</a>`;
}

function layout(innerHtml) {
  return `<div style="font-family:Roboto,Segoe UI,Arial,sans-serif;font-size:15px;line-height:1.55;color:#0F172A;max-width:620px">
${innerHtml}
<p style="margin-top:28px;color:#64748B;font-size:13px">— Mira, OpenWorldX · Replies to this email go to the candidate when they shared an email.</p>
</div>`;
}

function factsTable(facts) {
  return `<table cellpadding="6" style="border-collapse:collapse;font-size:14px;margin-top:8px">
${facts
  .map(
    ([label, value]) =>
      `<tr><td style="color:#64748B;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td>${linkCell(label, value)}</td></tr>`
  )
  .join("\n")}
</table>`;
}

function candidateFacts(candidate, resume, phone) {
  const education = [candidate.degree, candidate.college, candidate.graduationYear].filter(Boolean).join(", ");
  return [
    ["Name", candidate.displayName],
    ["WhatsApp", `+${phone}`],
    ["Email", candidate.email],
    ["Education", education],
    ["Experience", Number.isFinite(candidate.experienceYears) ? `${candidate.experienceYears} years` : ""],
    ["Skills", (candidate.skills || []).slice(0, 15).join(", ")],
    ["Looking for", [candidate.careerGoals, candidate.employmentType].filter(Boolean).join(" · ")],
    ["Location preference", candidate.locationPreference],
    ["Expected CTC", candidate.expectedCtc],
    ["Availability", candidate.availability],
    ["LinkedIn", candidate.linkedInUrl],
    ["GitHub", candidate.githubUrl],
    ["Resume", resume?.resumeUrl],
  ].filter(([, value]) => value);
}

function answersSection(intro) {
  const questions = intro.questions || [];
  if (!questions.length) return { text: "", html: "" };
  const rows = questions.map((q) => ({
    q: q.text,
    a: q.status === "answered" ? q.answer : q.status === "skipped" ? "(skipped)" : "(not answered yet)",
  }));
  return {
    text: ["Answers to your questions:", ...rows.map((r) => `• ${r.q}\n  ${r.a}`)].join("\n"),
    html: `<h3 style="margin:22px 0 6px;font-size:16px">Answers to your questions</h3>
<ol style="margin:0;padding-left:20px">${rows
      .map((r) => `<li style="margin-bottom:8px"><b>${escapeHtml(r.q)}</b><br>${escapeHtml(r.a)}</li>`)
      .join("")}</ol>`,
  };
}

function candidateQuestionsSection(intro) {
  const asked = intro.candidateQuestions || [];
  if (!asked.length) return { text: "", html: "" };
  return {
    text: ["The candidate asked you:", ...asked.map((q) => `• ${q}`)].join("\n"),
    html: `<h3 style="margin:22px 0 6px;font-size:16px">The candidate asked you</h3>
<ul style="margin:0;padding-left:20px">${asked.map((q) => `<li>${escapeHtml(q)}</li>`).join("")}</ul>`,
  };
}

export function emailCandidateInterested(intro, candidate, resume, { partial = false } = {}) {
  const name = candidate.displayName || "The candidate";
  const facts = candidateFacts(candidate, resume, intro.candidatePhone);
  const answers = answersSection(intro);
  const theirQuestions = candidateQuestionsSection(intro);
  const lead = partial
    ? `${name} said they're interested in ${roleLabel(intro)} but hasn't finished answering your questions. Here's what we have so far.`
    : `${name} is interested in ${roleLabel(intro)}${(intro.questions || []).length ? " and answered your questions" : ""}. Reach out to them directly.`;

  return sendEmail({
    to: intro.email,
    subject: `${name} is interested in ${intro.roleTitle || "your role"}${partial ? " (partial answers)" : ""} — OpenWorldX`,
    replyTo: candidate.email || undefined,
    text: [
      `Hi ${intro.contactName || "there"},`,
      "",
      lead,
      "",
      ...facts.map(([label, value]) => `${label}: ${value}`),
      "",
      answers.text,
      "",
      theirQuestions.text,
      "",
      candidate.profileText ? `Summary:\n${candidate.profileText}` : "",
      "",
      "— Mira, OpenWorldX",
    ].join("\n"),
    html: layout(`<p>Hi ${escapeHtml(intro.contactName || "there")},</p>
<p>${escapeHtml(lead)}</p>
${factsTable(facts)}
${answers.html}
${theirQuestions.html}
${candidate.profileText ? `<h3 style="margin:22px 0 6px;font-size:16px">Summary</h3><p style="margin:0">${escapeHtml(candidate.profileText)}</p>` : ""}`),
  });
}

const DECLINE_REASONS = {
  compensation: "the salary or location doesn't work for them",
  role_fit: "the role isn't the right fit for them",
  not_looking: "they're not looking for a change right now",
  withdrew: "they changed their mind while answering your questions",
};

export function emailCandidateDeclined(intro, candidate) {
  const name = candidate.displayName || "The candidate";
  const reason = DECLINE_REASONS[intro.declineReason];
  const line = `${name} has decided not to go ahead with ${roleLabel(intro)}${reason ? ` — ${reason}` : ""}.`;
  return sendEmail({
    to: intro.email,
    subject: `${name} passed on ${intro.roleTitle || "your role"} — OpenWorldX`,
    text: [`Hi ${intro.contactName || "there"},`, "", line, "", "Your other matches are still on your results page.", "", "— Mira, OpenWorldX"].join("\n"),
    html: layout(`<p>Hi ${escapeHtml(intro.contactName || "there")},</p><p>${escapeHtml(line)}</p><p>Your other matches are still on your results page.</p>`),
  });
}

export function emailNoResponse(intro, candidate) {
  const name = candidate.displayName || "The candidate";
  const line = `${name} hasn't replied on WhatsApp about ${roleLabel(intro)} for a week. You can still contact them directly at +${intro.candidatePhone}${candidate.email ? ` or ${candidate.email}` : ""}.`;
  return sendEmail({
    to: intro.email,
    subject: `No reply yet from ${name} — OpenWorldX`,
    text: [`Hi ${intro.contactName || "there"},`, "", line, "", "— Mira, OpenWorldX"].join("\n"),
    html: layout(`<p>Hi ${escapeHtml(intro.contactName || "there")},</p><p>${escapeHtml(line)}</p>`),
  });
}

export function emailFollowUpNudge(intro, candidate) {
  const name = candidate.displayName || "The candidate";
  const line = `A few days ago ${name} said they're interested in ${roleLabel(intro)}, and they haven't heard from you yet. Their details are in our earlier email — WhatsApp +${intro.candidatePhone}.`;
  return sendEmail({
    to: intro.email,
    subject: `Reminder: ${name} is waiting to hear from you — OpenWorldX`,
    text: [`Hi ${intro.contactName || "there"},`, "", line, "", "— Mira, OpenWorldX"].join("\n"),
    html: layout(`<p>Hi ${escapeHtml(intro.contactName || "there")},</p><p>${escapeHtml(line)}</p>`),
  });
}
