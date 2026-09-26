# OpenWorld

OpenWorld is a React site plus a WhatsApp agent named Mira. The site is the product. The agent lives in `functions/` and replies on WhatsApp through Meta and Gupshup.

The live WhatsApp number is **+91 98771 74681**. That path uses Meta Cloud API. An older Gupshup number is still in the code, but Meta blocks its sends until the display name is approved.

## WhatsApp agent

Someone texts the business number. Meta or Gupshup POSTs that event to a Firebase Cloud Function. The function asks Groq for Mira's reply, sends the text back, and saves the turn in Firestore.

```
Phone
  -> WhatsApp
    -> Meta or Gupshup
      -> Cloud Function
        -> Groq
        -> Firestore
      -> reply back through Meta or Gupshup
    -> Phone
```

Two webhooks share Mira, Groq, and Firestore. They do not share the send API.

| Path | Function | Who calls it |
| --- | --- | --- |
| Meta, live number | `metaWhatsappWebhook` | Meta Cloud API |
| Gupshup, older number | `whatsappWebhook` | Gupshup |

Meta URL: `https://asia-south1-openworld-8f410.cloudfunctions.net/metaWhatsappWebhook`

Gupshup URL: `https://asia-south1-openworld-8f410.cloudfunctions.net/whatsappWebhook`

Both run in `asia-south1`. A message follows this order:

1. `index.js` accepts the HTTP request. A GET on the Meta function answers Meta's verify handshake. A POST is a real event. The function always answers `200` so the provider does not retry and double-send.
2. `handleMetaWebhook.js` or `handleWebhook.js` decides what the event is. Delivery receipts are logged and ignored. A real text message continues.
3. `meta.js` or `gupshup.js` pulls out the phone number, name, and text.
4. `chatStore.js` loads that phone's earlier messages.
5. `mira.js` sends the last 8 lines plus the new text to Groq (`openai/gpt-oss-120b`) and returns a short reply.
6. The same adapter marks the inbound message read, then sends Mira's text.
7. `chatStore.js` appends the user line and Mira's line.

`local.js` is the same handlers behind Express on port 8080, for a laptop test. Production uses `index.js`.

## How chats are stored

Firestore collection: `whatsappChats`.

One document per phone number. The document id is the number, for example `whatsappChats/919618069125`.

```json
{
  "phone": "919618069125",
  "name": "Akhilesh",
  "updatedAt": "<server time>",
  "messages": [
    { "sender": "user", "text": "Hi", "timestamp": "2026-09-26T05:56:00.000Z" },
    { "sender": "bot", "text": "Hey! Who do you want to meet?", "timestamp": "2026-09-26T05:56:01.000Z" }
  ]
}
```

Each reply appends those two objects. Older messages stay in Firestore. Mira only reads the last 8 when she replies. Images and other non-text messages are not saved. Website Mira chats are a different store and are not mixed into `whatsappChats`.

If Firestore is down, the function keeps the last 20 messages in memory on that instance. After a cold start that memory is empty, so Firestore is the real record.

## Other files

`src/` is the React + Vite website: landing page, feed, profile, and the in-app Mira chat. The landing **Chat on WhatsApp** button opens `wa.me` for `+91 98771 74681`. The site does not receive WhatsApp messages.

`firebase.json` deploys the `functions/` folder as the `whatsapp` codebase and hosts the built site from `dist/`.

`functions/.env.example` and `.env.example` list the variable names. Copy them to `functions/.env` and `.env` and fill in the keys. Those real env files are not in this repository.

## Run locally

```bash
npm install
npm run dev
```

Website: `http://localhost:5173`

WhatsApp function, from `functions/`:

```bash
npm install
npm run dev
```
