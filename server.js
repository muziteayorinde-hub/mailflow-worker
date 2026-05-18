// server.js

import express from "express";
import cors from "cors";
import { sendEmail } from "./services/smtpService.js";

const app = express();

app.use(cors());

app.use(
  express.json({
    limit: "50mb",
  })
);

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

      // IMPORTANT FIX:
      // pass smtpConfig FIRST
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

const PORT =
  process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(
    `MailFlow Worker running on port ${PORT}`
  );
});
