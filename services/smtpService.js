// services/smtpService.js

import nodemailer from "nodemailer";

/**
 * Build nodemailer transport config
 * IMPORTANT:
 * Frontend sends:
 * smtpHost, smtpPort, username, password
 */
function buildTransportConfig(
  smtpConfig = {}
) {
  const host =
    smtpConfig.smtpHost;

  const port = Number(
    smtpConfig.smtpPort
  );

  const secure =
    smtpConfig.secure === true ||
    smtpConfig.secure ===
      "true";

  const requireTLS =
    smtpConfig.requireTLS ===
      true ||
    smtpConfig.requireTLS ===
      "true";

  const username =
    smtpConfig.username ||
    "";

  const password =
    smtpConfig.password ||
    "";

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

    // timeouts
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

/**
 * SEND EMAIL
 * NO transporter.verify()
 */
export async function sendEmail(
  smtpConfig = {},
  mailOptions = {}
) {
  try {
    console.log(
      "SEND EMAIL"
    );

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

    const transportConfig =
      buildTransportConfig(
        smtpConfig
      );

    const transporter =
      nodemailer.createTransport(
        transportConfig
      );

    // IMPORTANT:
    // send directly
    // NO verify()

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

/**
 * TEST SMTP
 * verify ONLY here
 */
export async function testSmtp(
  smtpConfig = {}
) {
  try {
    console.log(
      "VERIFYING SMTP..."
    );

    const transportConfig =
      buildTransportConfig(
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
      }
    );

    throw err;
  }
}

export default {
  sendEmail,
  testSmtp,
};
