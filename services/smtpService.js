// services/smtpService.js

import nodemailer from "nodemailer";

/**
 * Build SMTP config safely
 */
function buildTransportConfig(smtpConfig = {}) {
  const host =
    smtpConfig.smtpHost ||
    smtpConfig.host ||
    "business24.web-hosting.com";

  const port = Number(
    smtpConfig.smtpPort ||
      smtpConfig.port ||
      587
  );

  const secure =
    smtpConfig.secure === true;

  const requireTLS =
    smtpConfig.requireTLS === true;

  const username =
    smtpConfig.username ||
    smtpConfig.user ||
    "";

  const password =
    smtpConfig.password ||
    smtpConfig.pass ||
    "";

  const config = {
    host,
    port,
    secure,
    requireTLS,

    auth: {
      user: username,
      pass: password,
    },

    // prevent hanging forever
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    pool: false,

    tls: {
      rejectUnauthorized: false,
    },
  };

  console.log(
    "SMTP CONFIG",
    {
      host: config.host,
      port: config.port,
      secure: config.secure,
      requireTLS:
        config.requireTLS,
      username,
      hasPassword:
        !!password,
    }
  );

  return config;
}

/**
 * SEND EMAIL
 * IMPORTANT:
 * NO transporter.verify() here
 * because shared SMTP often times out
 */
export async function sendEmail(
  smtpConfig,
  mailOptions
) {
  try {
    const transportConfig =
      buildTransportConfig(
        smtpConfig
      );

    const transporter =
      nodemailer.createTransport(
        transportConfig
      );

    console.log(
      "SENDING EMAIL",
      {
        to: mailOptions?.to,
        subject:
          mailOptions?.subject,
        attachments:
          mailOptions
            ?.attachments
            ?.length || 0,
      }
    );

    // IMPORTANT:
    // send directly
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
      }
    );

    return info;
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
        stack: err.stack,
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
  smtpConfig
) {
  try {
    const transportConfig =
      buildTransportConfig(
        smtpConfig
      );

    const transporter =
      nodemailer.createTransport(
        transportConfig
      );

    console.log(
      "VERIFYING SMTP..."
    );

    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    return {
      success: true,
    };
  } catch (err) {
    console.error(
      "SMTP TEST ERROR",
      err
    );

    throw err;
  }
}
