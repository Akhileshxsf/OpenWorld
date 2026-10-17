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
  "profileCompleteness",
];

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
- profileCompleteness (number 0-1; boost when resume + goals + location preference + CTC expectations are known)
`.trim();
}
