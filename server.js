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

      const payload =
        req.body;

      console.log(
        "FETCH PAYLOAD",
        JSON.stringify(
          payload,
          null,
          2
        )
      );

      const result =
        await fetchEmails(
          payload
        );

      console.log(
        "FETCH COMPLETE"
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
 * AUTO EMAIL SYNC
 * Runs every 30 seconds
 */

async function autoSyncEmails() {
  try {
    console.log(
      "AUTO SYNC STARTED"
    );

    // Replace this with DB fetch
    const accounts =
      global.emailAccounts ||
      [];

    if (
      !accounts.length
    ) {
      console.log(
        "NO ACCOUNTS TO SYNC"
      );
      return;
    }

    for (const account of accounts) {
      try {
        console.log(
          `SYNCING ${account.email}`
        );

        const result =
          await fetchEmails(
            {
              account,
              folder:
                "INBOX",
              limit: 20,
              full_resync:
                false,
              include_attachments:
                false,
              attachments_metadata_only:
                true,
            }
          );

        console.log(
          `SYNC COMPLETE ${account.email}`,
          {
            emails:
              result
                ?.emails
                ?.length ||
              0,
          }
        );
      } catch (err) {
        console.error(
          `SYNC FAILED ${account.email}`,
          err.message
        );
      }
    }
  } catch (err) {
    console.error(
      "AUTO SYNC ERROR",
      err
    );
  }
}

// Start immediately
autoSyncEmails();

// Run every 30 seconds
setInterval(
  autoSyncEmails,
  30000
);

/**
 * 404 HANDLER
 */
app.use(
  (req, res) => {
    return res
      .status(404)
      .json({
        success: false,
        error: `Route not found: ${req.method} ${req.path}`,
      });
  }
);

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
});
