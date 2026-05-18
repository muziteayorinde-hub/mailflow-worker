// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { fetchEmails } from "./services/imapService.js";
import {
  sendEmail,
  testSmtp,
} from "./services/smtpService.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "50mb",
  })
);

// ------------------------------------
// HEALTH CHECK
// ------------------------------------
app.get("/", (req, res) => {
  return res.json({
    success: true,
    status: "MailFlow Worker Running",
  });
});

// ------------------------------------
// FETCH EMAILS
// ------------------------------------
app.post("/mail/fetch", async (req, res) => {
  try {
    console.log("FETCH EMAILS");

    const body = req.body || {};

    const result = await fetchEmails({
      email: body.email,
      password: body.password,

      imapHost: body.imapHost,
      imapPort: body.imapPort,

      secure: body.secure,
      mailbox: body.mailbox || "INBOX",

      limit: body.limit || 50,
      since_uid: body.since_uid,

      include_attachments:
        body.include_attachments ?? false,

      attachments_metadata_only:
        body.attachments_metadata_only ?? true,

      full_resync:
        body.full_resync ?? false,
    });

    return res.json(result);
  } catch (error) {
    console.error(
      "FETCH EMAIL ERROR",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ------------------------------------
// TEST SMTP
// ------------------------------------
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

    console.log(
      "TEST SMTP CONFIG",
      smtpConfig
    );

    const result =
      await testSmtp(smtpConfig);

    return res.json(result);
  } catch (error) {
    console.error(
      "TEST SMTP ERROR",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ------------------------------------
// SEND EMAIL
// ------------------------------------
app.post("/mail/send", async (req, res) => {
  try {
    console.log("SEND EMAIL");

    const body = req.body || {};

    console.log("REQUEST BODY", {
      to: body.to,
      subject: body.subject,
      hasPassword: !!body.password,
    });

    // IMPORTANT:
    // pass SMTP config from DB/UI
    const smtpConfig = {
      smtpHost: body.smtpHost,
      smtpPort: body.smtpPort,
      username: body.username,
      password: body.password,
      secure: body.secure,
      requireTLS: body.requireTLS,
    };

    console.log(
      "SMTP CONFIG RECEIVED",
      {
        smtpHost:
          smtpConfig.smtpHost,
        smtpPort:
          smtpConfig.smtpPort,
        username:
          smtpConfig.username,
        secure:
          smtpConfig.secure,
        requireTLS:
          smtpConfig.requireTLS,
        hasPassword:
          !!smtpConfig.password,
      }
    );

    const result =
      await sendEmail({
        smtpConfig,

        from: body.from,
        to: body.to,
        cc: body.cc || [],
        bcc: body.bcc || [],

        subject: body.subject,
        text: body.text,
        html: body.html,

        attachments:
          body.attachments || [],

        inReplyTo:
          body.inReplyTo,

        references:
          body.references,
      });

    if (!result.success) {
      return res
        .status(400)
        .json(result);
    }

    return res.json(result);
  } catch (error) {
    console.error(
      "SEND EMAIL ERROR",
      error
    );

    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// ------------------------------------
// START SERVER
// ------------------------------------
app.listen(PORT, () => {
  console.log(
    `MailFlow Worker running on port ${PORT}`
  );
});
