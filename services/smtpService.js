import nodemailer from "nodemailer";

export async function sendEmail(payload) {
  try {
    const {
      smtpHost,
      smtpPort,
      secure,
      requireTLS,
      username,
      password,
      tlsOptions,

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

    console.log("SMTP CONFIG", {
      host: smtpHost,
      port: smtpPort,
      secure,
      requireTLS,
      username,
    });

    // Convert base64 attachments → Buffer
    const mailAttachments = attachments.map((file) => {
      const bytes = file?.content
        ? Buffer.byteLength(file.content, "base64")
        : 0;

      console.log(
        "SMTP ATTACHMENT",
        file.filename,
        `${bytes} bytes`
      );

      return {
        filename: file.filename,
        content: file.content
          ? Buffer.from(file.content, "base64")
          : undefined,
        contentType: file.contentType,
      };
    });

    console.log(
      "SMTP attachments count:",
      mailAttachments.length
    );

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure:
        secure ??
        Number(smtpPort) === 465,

      requireTLS:
        requireTLS ??
        Number(smtpPort) === 587,

      auth: {
        user: username,
        pass: password,
      },

      tls: tlsOptions || {
        rejectUnauthorized: false,
      },

      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000,
    });

    // Verify SMTP connection
    await transporter.verify();

    console.log(
      "SMTP VERIFIED:",
      smtpHost,
      smtpPort
    );

    const info = await transporter.sendMail({
      from,
      to,
      cc,
      bcc,
      subject,
      text,
      html,

      attachments: mailAttachments,

      inReplyTo: in_reply_to,
      references: in_reply_to
        ? [in_reply_to]
        : undefined,
    });

    console.log(
      "EMAIL SENT SUCCESS",
      info.messageId
    );

    return {
      success: true,
      messageId: info.messageId,
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
