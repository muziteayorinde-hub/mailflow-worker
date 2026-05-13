import nodemailer from "nodemailer";

function mapNetError(e, label = "SMTP") {
  const code = e?.code || e?.errno || "";

  if (
    [
      "ETIMEDOUT",
      "ESOCKET",
      "ECONNREFUSED",
      "ECONNRESET",
      "EHOSTUNREACH",
    ].includes(code)
  ) {
    return "The hosting provider is blocking external IMAP/SMTP access from cloud servers.";
  }

  if (/timeout/i.test(e?.message || "")) {
    return `${label} connection timeout`;
  }

  return e?.message || `${label} error`;
}

export async function testSmtp(data) {
  console.log("Testing SMTP:", {
    host: data.smtpHost,
    port: data.smtpPort,
  });

  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,

      port: Number(data.smtpPort || 587),

      // true ONLY for port 465
      secure: data.secure === true,

      // STARTTLS support
      requireTLS: data.requireTLS === true,

      auth: {
        user: data.email,
        pass: data.password,
      },

      tls: {
        rejectUnauthorized:
          data?.tlsOptions?.rejectUnauthorized !== false,
      },

      connectionTimeout:
        Number(data.connectionTimeout || 60000),

      greetingTimeout:
        Number(data.greetingTimeout || 60000),

      socketTimeout:
        Number(data.socketTimeout || 60000),
    });

    await transporter.verify();

    return {
      success: true,
    };
  } catch (e) {
    return {
      success: false,
      error: mapNetError(e, "SMTP"),
    };
  }
}

export async function sendEmail(data) {
  console.log("Sending email:", {
    host: data.smtpHost,
    port: data.smtpPort,
    to: data.to,
  });

  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,

      port: Number(data.smtpPort || 587),

      secure: data.secure === true,

      requireTLS: data.requireTLS === true,

      auth: {
        user: data.email,
        pass: data.password,
      },

      tls: {
        rejectUnauthorized:
          data?.tlsOptions?.rejectUnauthorized !== false,
      },

      connectionTimeout:
        Number(data.connectionTimeout || 60000),

      greetingTimeout:
        Number(data.greetingTimeout || 60000),

      socketTimeout:
        Number(data.socketTimeout || 60000),
    });

    const info = await transporter.sendMail({
      from: data.from || data.email,

      to: data.to,

      cc: data.cc || undefined,

      bcc: data.bcc || undefined,

      subject: data.subject || "",

      text: data.text || "",

      html: data.html || "",

      attachments: data.attachments || [],
    });

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (e) {
    return {
      success: false,
      error: mapNetError(e, "SMTP"),
    };
  }
}
