import nodemailer from "nodemailer";

/**
 * Creates SMTP transporter from request payload
 */
function createTransporter(config) {
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

    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000,
  });
}

/**
 * SMTP connection test
 */
export async function testSmtp(config) {
  try {
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
      "SMTP VERIFY ERROR",
      error
    );

    return {
      success: false,
      error:
        error?.message ||
        "SMTP verification failed",
    };
  }
}

/**
 * Send email
 */
export async function sendEmail(
  payload
) {
  try {
    const transporter =
      createTransporter(payload);

    const {
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,
      attachments = [],
      in_reply_to,
    } = payload;

    // Convert base64 → Buffer
    const mailAttachments =
      attachments.map((file) => {
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

    // Verify connection first
    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    // Send mail
    const info =
      await transporter.sendMail({
        from,
        to,
        cc,
        bcc,
        subject,
        text,
        html,

        attachments:
          mailAttachments,

        inReplyTo:
          in_reply_to,

        references:
          in_reply_to
            ? [in_reply_to]
            : undefined,
      });

    console.log(
      "EMAIL SENT SUCCESS",
      info.messageId
    );

    return {
      success: true,
      messageId:
        info.messageId,
    };
  } catch (error) {
    console.error(
      "SMTP SEND ERROR",
      error
    );

    return {
      success: false,
      error:
        error?.message ||
        "SMTP send failed",
    };
  }
}
