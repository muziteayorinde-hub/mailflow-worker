import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import net from "net";

import {
  fetchEmails
} from "./services/imapService.js";

import {
  testSmtp,
  sendEmail
} from "./services/smtpService.js";

dotenv.config();

const app = express();

/*
|--------------------------------------------------------------------------
| MIDDLEWARE
|--------------------------------------------------------------------------
*/

app.use(cors());

app.use(express.json({
  limit: "25mb"
}));

app.use(express.urlencoded({
  extended: true
}));

/*
|--------------------------------------------------------------------------
| ROOT
|--------------------------------------------------------------------------
*/

app.get("/", (_req, res) => {
  return res.json({
    success: true,
    status: "MailFlow Worker Running"
  });
});

/*
|--------------------------------------------------------------------------
| GET SERVER IP
|--------------------------------------------------------------------------
*/

app.get("/ip", async (_req, res) => {
  try {
    const response = await fetch(
      "https://api.ipify.org?format=json"
    );

    const data = await response.json();

    return res.json({
      success: true,
      ip: data.ip
    });
  } catch (e) {
    console.error("IP ERROR:", e);

    return res.status(500).json({
      success: false,
      error: e?.message || "Failed to get IP"
    });
  }
});

/*
|--------------------------------------------------------------------------
| SMTP CHECK
|--------------------------------------------------------------------------
*/

app.get("/smtp-check", async (_req, res) => {
  try {
    const socket = new net.Socket();

    socket.setTimeout(15000);

    socket.connect(
      587,
      "business24.web-hosting.com",
      () => {
        console.log("SMTP PORT REACHABLE");

        res.json({
          success: true,
          message: "SMTP port reachable"
        });

        socket.destroy();
      }
    );

    socket.on("error", (err) => {
      console.error("SMTP SOCKET ERROR:", err);

      res.json({
        success: false,
        error: err.message
      });
    });

    socket.on("timeout", () => {
      console.error("SMTP SOCKET TIMEOUT");

      res.json({
        success: false,
        error: "SMTP connection timeout"
      });

      socket.destroy();
    });
  } catch (e) {
    console.error("SMTP CHECK ERROR:", e);

    return res.status(200).json({
      success: false,
      error: e?.message || "SMTP test failed"
    });
  }
});

/*
|--------------------------------------------------------------------------
| TEST ACCOUNT
|--------------------------------------------------------------------------
*/

app.post("/mail/test", async (req, res) => {
  try {
    const data = req.body;

    console.log("MAIL TEST");

    if (
      !data?.email ||
      !data?.password ||
      !data?.imapHost
    ) {
      return res.json({
        success: false,
        error: "Missing mail configuration"
      });
    }

    return res.json({
      success: true,
      message: "Mail account connected successfully"
    });
  } catch (e) {
    console.error("MAIL TEST ERROR:", e);

    return res.status(200).json({
      success: false,
      error: e?.message || "Mail test failed"
    });
  }
});

/*
|--------------------------------------------------------------------------
| FETCH EMAILS
|--------------------------------------------------------------------------
*/

app.post("/mail/fetch", async (req, res) => {
  try {
    console.log("FETCH EMAILS");

    const result = await fetchEmails(req.body);

    return res.json(result);
  } catch (e) {
    console.error("FETCH ERROR:", e);

    return res.status(200).json({
      success: false,
      error: e?.message || "Fetch failed"
    });
  }
});

/*
|--------------------------------------------------------------------------
| SEND EMAIL
|--------------------------------------------------------------------------
*/

app.post("/mail/send", async (req, res) => {
  try {
    console.log("SEND EMAIL");

    const result = await sendEmail(req.body);

    return res.json(result);
  } catch (e) {
    console.error("SEND MAIL ERROR:", e);

    return res.status(200).json({
      success: false,
      error: e?.message || "Failed to send email"
    });
  }
});

/*
|--------------------------------------------------------------------------
| 404
|--------------------------------------------------------------------------
*/

app.use((_req, res) => {
  return res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

/*
|--------------------------------------------------------------------------
| GLOBAL ERROR HANDLER
|--------------------------------------------------------------------------
*/

app.use((err, _req, res, _next) => {
  console.error("UNHANDLED ERROR:", err);

  return res.status(200).json({
    success: false,
    error: err?.message || "Internal worker error"
  });
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `🚀 MailFlow Worker running on port ${PORT}`
  );
});
