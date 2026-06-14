import express from "express";
import { validateAuth } from "./auth.js";
import { sendSms } from "./vendel.js";
import { transformPayload } from "./transform.js";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post("/send", validateAuth, async (req, res) => {
  const { to, body, error } = transformPayload(req.body);

  if (error) {
    console.warn(`[adaptor] Bad request: ${error}`);
    return res.status(400).json({ error });
  }

  console.log(`[adaptor] Sending SMS to ${to}`);

  const result = await sendSms(to, body);

  if (!result.ok) {
    console.error(`[adaptor] Vendel error ${result.status}: ${result.detail}`);
    return res.status(result.status).json({ error: result.detail });
  }

  console.log(`[adaptor] SMS accepted, message_ids: ${result.data.message_ids}`);
  return res.status(200).json(result.data);
});

// Health check
app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`[adaptor] vendal-authentik-adaptor listening on port ${PORT}`);
});
