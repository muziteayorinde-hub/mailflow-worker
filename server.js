// server.js

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { sendEmail } from "./services/smtpService.js";
import { fetchEmails } from "./services/emailService.js";

dotenv.config();

const app = express();

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

/**
 * HEALTH CHECK
 */
app.get("/", (req, res) => {
  return res.json({
    ok: true,
    service: "mailflow-worker",
    status: "running",
    timestamp:
      new Date().toISOString(),
  });
});

/**
 * SEND EMAIL
 */
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
        cc = [],
        bcc = [],
        subject = "",
        text = "",
        html = "",
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
            !!smtpConfig
              ?.password,
        }
      );

      console.log(
        "SMTP CONFIG RECEIVED",
        {
          smtpHost:
            smtpConfig
              ?.smtpHost,
          smtpPort:
            smtpConfig
              ?.smtpPort,
          username:
            smtpConfig
              ?.username,
          secure:
            smtpConfig
              ?.secure,
          requireTLS:
            smtpConfig
              ?.requireTLS,
          hasPassword:
            !!smtpConfig
              ?.password,
        }
      );

      const info =
        await sendEmail(
          smtpConfig,
          {
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
          }
        );

      console.log(
        "EMAIL SENT SUCCESS",
        {
          messageId:
            info.messageId,
        }
      );

      return res.json({
        success: true,
        messageId:
          info.messageId,
        response:
          info.response,
      });
    } catch (err) {
      console.error(
        "SEND EMAIL ERROR",
        err
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            err.message,
        });
    }
  }
);

/**
 * FETCH EMAILS
 */
app.post(
  "/fetch-emails",
  async (req, res) => {
    try {
      console.log(
        "FETCH EMAILS REQUEST"
      );

      const {
        account,
        folder = "inbox",
        full_resync = false,
        limit = 50,
        include_attachments = false,
        attachments_metadata_only = true,
        since_uid,
      } = req.body;

      console.log(
        "FETCH CONFIG",
        {
          folder,
          full_resync,
          limit,
          since_uid,
          include_attachments,
          attachments_metadata_only,
        }
      );

      console.log(
        "SYNCING FOLDER",
        folder
      );

      const result =
        await fetchEmails(
          {
            account,
            folder,
            full_resync,
            limit,
            since_uid,
            include_attachments,
            attachments_metadata_only,
          }
        );

      console.log(
        "FETCH COMPLETE",
        {
          count:
            result
              ?.emails
              ?.length || 0,
        }
      );

      return res.json({
        success: true,
        emails:
          result
            ?.emails ||
          [],
        count:
          result
            ?.emails
            ?.length || 0,
      });
    } catch (err) {
      console.error(
        "FETCH EMAILS ERROR",
        err
      );

      return res
        .status(500)
        .json({
          success: false,
          error:
            err.message,
        });
    }
  }
);

/**
 * 404 HANDLER
 */
app.use((req, res) => {
  return res
    .status(404)
    .json({
      success: false,
      error:
        `Route not found: ${req.method} ${req.path}`,
    });
});

/**
 * START SERVER
 */
const PORT =
  process.env.PORT ||
  10000;

app.listen(PORT, () => {
  console.log(
    `Mailflow Worker running on port ${PORT}`
  );

  console.log(
    `Service live on port ${PORT}`
  );
});
