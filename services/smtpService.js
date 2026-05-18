// services/smtpService.js

import nodemailer from "nodemailer";

// -----------------------------------------------------
// Build SMTP transport config
// Maps worker payload -> nodemailer config
// -----------------------------------------------------
function createTransportConfig(config = {}) {
  const host = config.smtpHost;
  const port = Number(config.smtpPort);

  const secure =
    typeof config.secure === "boolean"
      ? config.secure
      : config.secure === "true";

  const requireTLS =
    typeof config.requireTLS ===
    "boolean"
      ? config.requireTLS
      : config.requireTLS ===
        "true";

  const username =
    config.username || "";

  const password =
    config.password || "";

  console.log(
    "SMTP CONFIG",
    {
      host,
      port,
      secure,
      requireTLS,
      username,
      hasPassword:
        !!password,
    }
  );

  return {
    host,
    port,
    secure,
    requireTLS,

    auth: {
      user: username,
      pass: password,
    },

    tls: {
      rejectUnauthorized:
        false,
    },

    // generous timeouts
    connectionTimeout:
      60000,
    greetingTimeout:
      60000,
    socketTimeout:
      60000,

    logger: true,
    debug: true,
  };
}

// -----------------------------------------------------
// SEND EMAIL
// IMPORTANT:
// NO transporter.verify()
// -----------------------------------------------------
export async function sendEmail(
  smtpConfig = {},
  mailOptions = {}
) {
  try {
    console.log(
      "SEND EMAIL"
    );

    const transportConfig =
      createTransportConfig(
        smtpConfig
      );

    const transporter =
      nodemailer.createTransport(
        transportConfig
      );

    // Direct send
    // no verify()

    const info =
      await transporter.sendMail(
        mailOptions
      );

    console.log(
      "EMAIL SENT SUCCESS",
      {
        messageId:
          info.messageId,
        response:
          info.response,
        accepted:
          info.accepted,
        rejected:
          info.rejected,
      }
    );

    return {
      success: true,
      messageId:
        info.messageId,
      response:
        info.response,
      accepted:
        info.accepted,
      rejected:
        info.rejected,
    };
  } catch (err) {
    console.error(
      "SMTP SEND ERROR FULL",
      {
        message:
          err.message,
        code: err.code,
        command:
          err.command,
        response:
          err.response,
        responseCode:
          err.responseCode,
        stack:
          err.stack,
      }
    );

    throw err;
  }
}

// -----------------------------------------------------
// TEST SMTP
// verify ONLY here
// -----------------------------------------------------
export async function testSmtp(
  smtpConfig = {}
) {
  try {
    console.log(
      "VERIFYING SMTP..."
    );

    const transportConfig =
      createTransportConfig(
        smtpConfig
      );

    const transporter =
      nodemailer.createTransport(
        transportConfig
      );

    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    return {
      ok: true,
    };
  } catch (err) {
    console.error(
      "SMTP TEST ERROR",
      {
        message:
          err.message,
        code: err.code,
        command:
          err.command,
        response:
          err.response,
        responseCode:
          err.responseCode,
      }
    );

    throw err;
  }
}

export default {
  sendEmail,
  testSmtp,
};
