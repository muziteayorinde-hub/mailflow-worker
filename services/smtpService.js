import nodemailer from "nodemailer";

/**
 * Create SMTP transporter
 */
function createTransporter(config = {}) {
  const smtpHost =
    config.smtpHost ||
    process.env.SMTP_HOST;

  const smtpPort =
    Number(config.smtpPort) ||
    Number(process.env.SMTP_PORT) ||
    587;

  const username =
    config.username ||
    process.env.SMTP_USER;

  const password =
    config.password ||
    process.env.SMTP_PASS;

  const secure =
    config.secure ??
    smtpPort === 465;

  const requireTLS =
    config.requireTLS ??
    smtpPort === 587;

  console.log("SMTP CONFIG", {
    host: smtpHost,
    port: smtpPort,
    secure,
    requireTLS,
    username,
  });

  const transporter =
    nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,

      secure,
      requireTLS,

      auth: {
        user: username,
        pass: password,
      },

      tls:
        config.tlsOptions || {
          rejectUnauthorized: false,
        },

      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,

      logger: true,
      debug: true,
    });

  return transporter;
}

/**
 * Test SMTP connection
 */
export async function testSmtp(
  config = {}
) {
  try {
    console.log(
      "TESTING SMTP..."
    );

    const transporter =
      createTransporter(config);

    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    return {
      success: true,
      message:
        "SMTP connection successful",
    };
  } catch (error) {
    console.error(
      "SMTP VERIFY ERROR"
    );

    console.error(error);

    return {
      success: false,
      error:
        error?.message ||
        "SMTP verification failed",
    };
  }
}

/**
 * Send Email
 */
export async function sendEmail(
  payload = {}
) {
  try {
    console.log(
      "SEND PAYLOAD",
      {
        from:
          payload.from,
        to:
          payload.to,
        subject:
          payload.subject,
      }
    );

    const transporter =
      createTransporter(
        payload
      );

    console.log(
      "VERIFYING SMTP..."
    );

    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    // Convert attachments
    const mailAttachments =
      (
        payload.attachments ||
        []
      ).map((file) => {
        const bytes =
          file?.content
            ? Buffer.byteLength(
                file.content,
                "base64"
              )
            : 0;

        console.log(
          "SMTP ATTACHMENT",
          file.filename,
          `${bytes} bytes`
        );

        return {
          filename:
            file.filename,

          content:
            file.content
              ? Buffer.from(
                  file.content,
                  "base64"
                )
              : undefined,

          contentType:
            file.contentType,
        };
      });

    console.log(
      "SMTP attachments count:",
      mailAttachments.length
    );

    console.log(
      "SENDING EMAIL..."
    );

    const info =
      await transporter.sendMail({
        from:
          payload.from,

        to:
          payload.to,

        cc:
          payload.cc,

        bcc:
          payload.bcc,

        subject:
          payload.subject,

        text:
          payload.text,

        html:
          payload.html,

        attachments:
          mailAttachments,

        inReplyTo:
          payload.in_reply_to,

        references:
          payload.in_reply_to
            ? [
                payload.in_reply_to,
              ]
            : undefined,
      });

    console.log(
      "EMAIL SENT SUCCESS"
    );

    console.log(
      info
    );

    return {
      success: true,
      messageId:
        info.messageId,
    };
  } catch (error) {
    console.error(
      "SMTP SEND ERROR"
    );

    console.error(error);

    return {
      success: false,
      error:
        error?.message ||
        "SMTP send failed",
    };
  }
}
