import dotenv from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env") });

let phone = String(process.argv[2] || "9628069125").replace(/\D/g, "");
if (phone.length === 10) phone = `91${phone}`;
const mode = process.argv[3] || "template";

const { sendProactive, inServiceWindow } = await import("../openworld/outbound.js");
const { offerMessage } = await import("../openworld/intros.js");

const intro = {
  id: `manual_test_${Date.now()}`,
  candidatePhone: phone,
  roleTitle: "Mobile App Developer",
  companyName: "OpenWorldX (template test)",
  recruiterRequested: true,
  recruiterNote: "Template API test — ignore if unexpected.",
};

const candidate = {
  phone,
  displayName: "Test",
  lastInboundAt: mode === "session" ? new Date().toISOString() : "",
};
const payload = offerMessage(intro, candidate);

console.log("phone", phone, "mode", mode);
console.log("inServiceWindow", inServiceWindow(candidate));

const useTemplate = mode === "template" ? "always" : "when_required";
const delivery = await sendProactive(phone, candidate, { ...payload, useTemplate });
console.log(JSON.stringify(delivery, null, 2));
