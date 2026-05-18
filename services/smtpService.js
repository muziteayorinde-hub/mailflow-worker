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
    hasPassword: !!password,
  });

  return nodemailer.createTransport({
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

    // Prevent hanging forever
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,

    logger: true,
    debug: true,
  });
}

/**
 * Test SMTP
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
      "SMTP VERIFY ERROR FULL"
    );

    console.error({
      message:
        error?.message,
      code:
        error?.code,
      command:
        error?.command,
      response:
        error?.response,
      responseCode:
        error?.responseCode,
      stack:
        error?.stack,
    });

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

    /**
     * Safe attachment handling
     */
    const mailAttachments =
      [];

    for (const file of payload.attachments ||
      []) {
      try {
        if (
          !file ||
          !file.filename ||
          !file.content
        ) {
          console.log(
            "Skipping invalid attachment"
          );
          continue;
        }

        const bytes =
          Buffer.byteLength(
            file.content,
            "base64"
          );

        console.log(
          "SMTP ATTACHMENT",
          file.filename,
          `${bytes} bytes`
        );

        mailAttachments.push({
          filename:
            file.filename,

          content:
            Buffer.from(
              file.content,
              "base64"
            ),

          contentType:
            file.contentType ||
            "application/octet-stream",
        });
      } catch (err) {
        console.error(
          "ATTACHMENT ERROR",
          err
        );
      }
    }

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
          mailAttachments.length >
          0
            ? mailAttachments
            : undefined,

        inReplyTo:
          payload.inReplyTo ||
          payload.in_reply_to,

        references:
          payload.inReplyTo ||
          payload.in_reply_to
            ? [
                payload
                  .inReplyTo ||
                  payload.in_reply_to,
              ]
            : undefined,
      });

    console.log(
      "EMAIL SENT SUCCESS"
    );

    console.log(info);

    return {
      success: true,
      messageId:
        info.messageId,
    };
  } catch (error) {
    console.error(
      "SMTP SEND ERROR FULL"
    );

    console.error({
      message:
        error?.message,

      code:
        error?.code,

      command:
        error?.command,

      response:
        error?.response,

      responseCode:
        error?.responseCode,

      stack:
        error?.stack,
    });

    return {
      success: false,
      error:
        error?.message ||
        "SMTP send failed",
      details: {
        message:
          error?.message,
        code:
          error?.code,
        response:
          error?.response,
      },
    };
  }
}
