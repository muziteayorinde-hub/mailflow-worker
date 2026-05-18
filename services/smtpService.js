// services/smtpService.js

import nodemailer from "nodemailer";

function toBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    return value.toLowerCase() === "true";
  }
  return fallback;
}

function buildTransportConfig(config = {}) {
  const smtpHost =
    config.smtpHost ||
    process.env.SMTP_HOST ||
    "";

  const smtpPort =
    Number(config.smtpPort) ||
    Number(process.env.SMTP_PORT) ||
    587;

  const username =
    config.username ||
    process.env.SMTP_USER ||
    "";

  const password =
    config.password ||
    process.env.SMTP_PASS ||
    "";

  // Smart defaults for Namecheap/private email
  const secure =
    config.secure !== undefined
      ? toBoolean(config.secure)
      : smtpPort === 465;

  const requireTLS =
    config.requireTLS !== undefined
      ? toBoolean(config.requireTLS)
      : smtpPort === 587;

  const transportConfig = {
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,

    auth: {
      user: username,
      pass: password,
    },

    tls: {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    },

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,

    pool: true,
    maxConnections: 3,
    maxMessages: 100,

    logger: true,
    debug: true,
  };

  console.log("SMTP CONFIG", {
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    username,
    hasPassword: !!password,
  });

  return transportConfig;
}

export async function testSmtp(config = {}) {
  try {
    console.log("VERIFYING SMTP...");

    const transporter = nodemailer.createTransport(
      buildTransportConfig(config)
    );

    await transporter.verify();

    console.log("SMTP VERIFIED");

    return {
      success: true,
      message: "SMTP connection successful",
    };
  } catch (error) {
    console.error("SMTP VERIFY ERROR", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

export async function sendEmail(payload = {}) {
  try {
    const {
      smtpConfig = {},

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
    } = payload;

    console.log("SEND PAYLOAD", {
      from,
      to,
      subject,
      attachmentsCount: attachments.length,
    });

    const transporter = nodemailer.createTransport(
      buildTransportConfig(smtpConfig)
    );

    console.log("VERIFYING SMTP...");
    await transporter.verify();
    console.log("SMTP VERIFIED");

    const mailOptions = {
      from,
      to,
      cc,
      bcc,

      subject,
      text,
      html,

      attachments: attachments.map((file) => ({
        filename: file.filename || file.name,
        content: file.content,
        path: file.path,
        contentType: file.contentType,
      })),

      headers: {},
    };

    if (inReplyTo) {
      mailOptions.inReplyTo = inReplyTo;
    }

    if (references) {
      mailOptions.references = references;
    }

    const info = await transporter.sendMail(mailOptions);

    console.log("EMAIL SENT SUCCESS", {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
    };
  } catch (error) {
    console.error("SMTP SEND ERROR FULL", {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
      stack: error.stack,
    });

    return {
      success: false,
      error: error.message,
      code: error.code,
    };
  }
}

export default {
  sendEmail,
  testSmtp,
};
