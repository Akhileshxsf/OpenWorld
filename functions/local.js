import "dotenv/config";
import express from "express";
import { handleGupshupWebhook } from "./handleWebhook.js";
import { handleMetaWebhook } from "./handleMetaWebhook.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.status(200).send("OpenWorld WhatsApp webhook is live");
});

app.post("/", async (req, res) => {
  try {
    await handleGupshupWebhook(req.body);
    res.status(200).send();
  } catch (error) {
    console.error("WhatsApp webhook failed", error);
    res.status(200).send();
  }
});

app.get("/meta", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token && token === process.env.META_VERIFY_TOKEN && challenge) {
    res.status(200).send(challenge);
    return;
  }

  res.status(403).send("Forbidden");
});

app.post("/meta", async (req, res) => {
  try {
    await handleMetaWebhook(req.body);
    res.status(200).send();
  } catch (error) {
    console.error("Meta WhatsApp webhook failed", error);
    res.status(200).send();
  }
});

const port = Number(process.env.PORT || 8080);
app.listen(port, () => {
  console.log(`WhatsApp webhook listening on http://localhost:${port}`);
});
