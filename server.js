// Mail sender route
// server.js

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import {
  sendEmail,
  testSmtp,
} from "./services/smtpService.js";

const app = express();

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  return res.json({
    success: true,
    status: "MailFlow Worker Running",
  });
});

// SMTP test route
app.post("/mail/test-smtp", async (req, res) => {
  try {
    const body = req.body || {};

    const smtpConfig = {
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
      username: body.username,
      password: body.password,
      secure: body.secure,
      requireTLS: body.requireTLS,
    };

    console.log("TEST SMTP CONFIG", smtpConfig);

    const result = await testSmtp(smtpConfig);

    return res.json(result);
  } catch (error) {
    console.error("TEST SMTP ERROR", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// SEND EMAIL ROUTE
app.post("/mail/send", async (req, res) => {
  try {
    console.log("SEND EMAIL");

    const body = req.body || {};

    console.log("REQUEST BODY", {
      hasBody: !!body,
      to: body.to,
      subject: body.subject,
      hasPassword: !!body.password,
    });

    // VERY IMPORTANT:
    // pass smtp config from frontend/db
    const smtpConfig = {
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
      username: body.username,
      password: body.password,
      secure: body.secure,
      requireTLS: body.requireTLS,
    };

    console.log("SMTP CONFIG RECEIVED", {
      smtpHost: smtpConfig.smtpHost,
      smtpPort: smtpConfig.smtpPort,
      username: smtpConfig.username,
      secure: smtpConfig.secure,
      requireTLS: smtpConfig.requireTLS,
      hasPassword: !!smtpConfig.password,
    });

    const result = await sendEmail({
      smtpConfig,

      from: body.from,
      to: body.to,
      cc: body.cc || [],
      bcc: body.bcc || [],

      subject: body.subject,
      text: body.text,
      html: body.html,

      attachments: body.attachments || [],

      inReplyTo: body.inReplyTo,
      references: body.references,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error("SEND EMAIL ROUTE ERROR", error);

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Mail worker running on port ${PORT}`);
});
