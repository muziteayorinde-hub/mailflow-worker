// services/smtpService.js

import nodemailer from "nodemailer";

function createTransportConfig(config = {}) {
  return {
    host: config.host,
    port: Number(config.port),
    secure: Boolean(config.secure),
    requireTLS: Boolean(config.requireTLS),

    auth: {
      user: config.username,
      pass: config.password,
    },

    tls: {
      rejectUnauthorized: false,
    },

    // generous timeouts
    connectionTimeout: 60000,
    greetingTimeout: 60000,
    socketTimeout: 60000,

    logger: true,
    debug: true,
  };
}

// ------------------------------------------------
// SEND EMAIL
// NO verify() here
// ------------------------------------------------
export async function sendEmail(
  smtpConfig,
  mailOptions
) {
  const config =
    createTransportConfig(
      smtpConfig
    );

  console.log(
    "SMTP CONFIG",
    {
      host: config.host,
      port: config.port,
      secure:
        config.secure,
      requireTLS:
        config.requireTLS,
      username:
        smtpConfig.username,
      hasPassword:
        !!smtpConfig.password,
    }
  );

  try {
    const transporter =
      nodemailer.createTransport(
        config
      );

    // IMPORTANT:
    // directly send
    // no transporter.verify()

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
      ...info,
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

// ------------------------------------------------
// TEST SMTP
// verify ONLY here
// ------------------------------------------------
export async function testSmtp(
  smtpConfig
) {
  const config =
    createTransportConfig(
      smtpConfig
    );

  const transporter =
    nodemailer.createTransport(
      config
    );

  console.log(
    "VERIFYING SMTP..."
  );

  await transporter.verify();

  console.log(
    "SMTP VERIFIED"
  );

  return {
    ok: true,
  };
}

export default {
  sendEmail,
  testSmtp,
};
