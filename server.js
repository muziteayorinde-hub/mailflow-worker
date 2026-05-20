import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { sendEmail } from "./services/smtpService.js";
import { fetchEmails } from "./services/emailService.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// Health check
app.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "mailflow-worker",
    status: "running"
  });
});

/**
 * SEND EMAIL
 */
app.post("/send-email", async (req, res) => {
  try {
    console.log("SEND EMAIL");

    const {
      smtpConfig,
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments,
      inReplyTo,
      references
    } = req.body;

    const info = await sendEmail(
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
        references
      }
    );

    return res.json({
      success: true,
      messageId: info.messageId,
      response: info.response
    });

  } catch (err) {
    console.error(
      "SEND EMAIL ERROR",
      err
    );

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

/**
 * FETCH EMAILS
 */
app.post("/fetch-emails", async (req, res) => {
  try {
    console.log(
      "FETCH EMAILS REQUEST",
      req.body
    );

    const {
      account,
      folder = "inbox",
      full_resync = false,
      limit = 50,
      include_attachments = false,
      attachments_metadata_only = true
    } = req.body;

    console.log(
      "FETCHING FOLDER",
      folder
    );

    console.log(
      "FULL RESYNC",
      full_resync
    );

    const result =
      await fetchEmails({
        account,
        folder,
        full_resync,
        limit,
        include_attachments,
        attachments_metadata_only
      });

    console.log(
      "FETCH COMPLETE"
    );

    return res.json({
      success: true,
      emails:
        result?.emails || [],
      count:
        result?.count || 0
    });

  } catch (err) {
    console.error(
      "FETCH EMAILS ERROR",
      err
    );

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT =
  process.env.PORT ||
  10000;

app.listen(PORT, () => {
  console.log(
    `Mailflow Worker running on port ${PORT}`
  );
});
```

Then redeploy Render.

After deploy test:

```text id="v7n3pk"
https://mailflow-worker.onrender.com/
```

should return JSON.

And:

```text id="m8x2qa"
POST /fetch-emails
```

should stop giving:

```text id="y4r9cv"
Cannot POST /fetch-emails
```
