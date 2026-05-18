// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import {
  sendEmail,
  testSmtp,
} from "./services/smtpService.js";

dotenv.config();

const app = express();

// ------------------------------------
// Middleware
// ------------------------------------
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
// Health check
// ------------------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message:
      "MailFlow Worker running",
  });
});

// ------------------------------------
// SMTP test
// ------------------------------------
app.post(
  "/test-smtp",
  async (req, res) => {
    try {
      const { smtpConfig } =
        req.body;

      console.log(
        "TEST SMTP"
      );

      console.log(
        "SMTP CONFIG RECEIVED",
        {
          smtpHost:
            smtpConfig?.smtpHost,
          smtpPort:
            smtpConfig?.smtpPort,
          username:
            smtpConfig?.username,
          secure:
            smtpConfig?.secure,
          requireTLS:
            smtpConfig?.requireTLS,
          hasPassword:
            !!smtpConfig?.password,
        }
      );

      const result =
        await testSmtp(
          smtpConfig
        );

      return res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.error(
        "SMTP TEST ERROR",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err.message,
      });
    }
  }
);

// ------------------------------------
// SEND EMAIL
// ------------------------------------
app.post(
  "/send-email",
  async (req, res) => {
    try {
      console.log(
        "SEND EMAIL"
      );

      const {
        smtpConfig,

        from,
        to,
        cc,
        bcc,

        subject,
        text,
        html,

        attachments = [],

        inReplyTo,
        references,
      } = req.body;

      console.log(
        "REQUEST BODY",
        {
          to,
          subject,
          hasPassword:
            !!smtpConfig?.password,
        }
      );

      console.log(
        "SMTP CONFIG RECEIVED",
        {
          smtpHost:
            smtpConfig?.smtpHost,
          smtpPort:
            smtpConfig?.smtpPort,
          username:
            smtpConfig?.username,
          secure:
            smtpConfig?.secure,
          requireTLS:
            smtpConfig?.requireTLS,
          hasPassword:
            !!smtpConfig?.password,
        }
      );

      const mailOptions = {
        from,
        to,
        cc,
        bcc,

        subject,
        text,
        html,

        attachments,

        inReplyTo,
        references,
      };

      // IMPORTANT FIX
      // pass smtpConfig first
      const result =
        await sendEmail(
          smtpConfig,
          mailOptions
        );

      return res.json({
        success: true,
        result,
      });
    } catch (err) {
      console.error(
        "SEND EMAIL ERROR",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err.message,
      });
    }
  }
);

// ------------------------------------
// Start server
// ------------------------------------
const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(
    `MailFlow Worker running on port ${PORT}`
  );
});
