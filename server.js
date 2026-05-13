import express from "express";
import cors from "cors";

import { testImap } from "./services/imapService.js";
import { testSmtp, sendEmail } from "./services/smtpService.js";

const app = express();

app.use(cors());

app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    status: "MailFlow Worker Running",
  });
});

app.post("/mail/test", async (req, res) => {
  try {
    console.log("Incoming payload:", req.body);

    const data = req.body;

    if (!data.imapHost || !data.smtpHost) {
      return res.json({
        success: false,
        error: "Missing mail server configuration",
      });
    }

    const imapResult = await testImap(data);

    if (!imapResult.success) {
      return res.json(imapResult);
    }

    const smtpResult = await testSmtp(data);

    if (!smtpResult.success) {
      return res.json(smtpResult);
    }

    return res.json({
      success: true,
    });
  } catch (e) {
    console.error("MAIL TEST ERROR:", e);

    return res.json({
      success: false,
      error: e?.message || "Worker error",
    });
  }
});

app.post("/mail/send", async (req, res) => {
  try {
    const result = await sendEmail(req.body);

    return res.json(result);
  } catch (e) {
    return res.json({
      success: false,
      error: e?.message || "Send failed",
    });
  }
});

app.use((err, _req, res, _next) => {
  console.error("Unhandled:", err);

  return res.status(200).json({
    success: false,
    error: err?.message || "Worker error",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Worker running on port ${PORT}`);
});
