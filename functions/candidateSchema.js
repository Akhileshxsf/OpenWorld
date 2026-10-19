export const CANDIDATE_SOURCE = "whatsapp_meta";

export function defaultCandidate(phone, displayName = "") {
  return {
    phone: String(phone).replace(/\D/g, ""),
    displayName: displayName || "",
    profileText: "",
    intent: "looking_for_job",
    location: "",
    openToRemote: null,
    roles: [],
    skills: [],
    jobTypes: [],
    experienceYears: null,
    companies: [],
    projects: [],
    interests: [],
    seekingHelpWith: [],
    wantingToHelpWith: [],
    college: "",
    degree: "",
    education: "",
    graduationYear: null,
    email: "",
    githubUrl: "",
    linkedInUrl: "",
    portfolioUrl: "",
    certifications: [],
    careerGoals: "",
    locationPreference: "",
    currentCtc: "",
    expectedCtc: "",
    availability: "",
    employmentType: "",
    jobSeekingStatus: "",
    profileCompleteness: 0,
    linkedUserId: null,
    source: CANDIDATE_SOURCE,
  };
}

export const CANDIDATE_JSON_FIELDS = [
  "displayName",
  "profileText",
  "intent",
  "location",
  "openToRemote",
  "roles",
  "skills",
  "jobTypes",
  "experienceYears",
  "companies",
  "projects",
  "interests",
  "seekingHelpWith",
  "wantingToHelpWith",
  "college",
  "degree",
  "education",
  "graduationYear",
  "email",
  "githubUrl",
  "linkedInUrl",
  "portfolioUrl",
  "certifications",
  "careerGoals",
  "locationPreference",
  "currentCtc",
  "expectedCtc",
  "availability",
  "employmentType",
  "jobSeekingStatus",
  "profileCompleteness",
];

/** Chat-only details Mira needs before matching; order is the order she asks in. */
export const PROFILE_GAP_FIELDS = [
  {
    key: "careerGoals",
    label: "target roles",
    ask: "what roles they want next",
    question: "What kind of roles are you aiming for next?",
  },
  {
    key: "employmentType",
    label: "internship or full-time",
    ask: "whether they want an internship or a full-time role",
    question: "Are you looking for an internship or a full-time role?",
  },
  {
    key: "locationPreference",
    label: "preferred location",
    ask: "which cities they'd work in, or remote",
    question: "Which cities would you work in — or remote?",
  },
  {
    key: "expectedCtc",
    label: "expected salary",
    ask: "their expected salary (LPA or monthly stipend)",
    question: "What salary are you expecting (LPA, or monthly stipend for internships)?",
  },
  {
    key: "availability",
    label: "availability",
    ask: "when they can start (immediately, notice period, or after graduation)",
    question: "When can you start — immediately, after a notice period, or after graduation?",
  },
];

export function profileGaps(candidate) {
  return PROFILE_GAP_FIELDS.filter(({ key }) => !String(candidate?.[key] || "").trim());
}

export function schemaPromptDescription() {
  return `
Return a single JSON object with these keys (use null, "" or [] when unknown):
- displayName (string, from resume header if present)
- profileText (string, detailed third-person summary of the whole resume for recruiters, ~150–350 words when content allows; include education, experience, projects, skills, achievements, links — well-written prose, not bullet list)
- intent (string, e.g. "looking_for_job")
- location (string, city/region if on resume)
- openToRemote (boolean or null)
- roles (string array, target or suitable job titles inferred from resume)
- skills (string array)
- jobTypes (string array, e.g. "full-time")
- experienceYears (number or null)
- companies (string array, employers / internships)
- projects (string array, project names or short labels)
- interests (string array)
- seekingHelpWith (string array, infer e.g. "software engineer roles" from resume if no chat yet)
- wantingToHelpWith (string array, usually [])
- college (string, e.g. "NIT Delhi")
- degree (string, e.g. "B.Tech Computer Science")
- education (string, one-line education summary)
- graduationYear (number or null)
- email (string)
- githubUrl (string, full URL if present)
- linkedInUrl (string, full URL if present)
- portfolioUrl (string, full URL if present)
- certifications (string array)
- careerGoals (string, what jobs/roles they want — usually filled from WhatsApp chat, not resume)
- locationPreference (string, where they want to work — from chat; e.g. "Bangalore", "remote", "Hyderabad only")
- currentCtc (string, current salary if they share it, e.g. "10 LPA" or "fresher / not applicable")
- expectedCtc (string, expected salary, e.g. "18–20 LPA")
- availability (string, when they can start, e.g. "immediately", "30 days notice", "after graduation, June 2027" — from chat only)
- employmentType (string, one of "internship", "full-time", "either" — from chat only)
- jobSeekingStatus (string, one of "actively_looking", "open", "not_looking" — from chat only; "not_looking" when they say they got a job or want to pause)
- profileCompleteness (number 0-1; boost when resume + goals + location preference + CTC expectations + availability are known)
`.trim();
}
