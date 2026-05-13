import nodemailer from "nodemailer";

function mapNetError(e, label = "SMTP") {
  const code = e?.code || e?.errno || "";

  console.error("SMTP ERROR:", e);

  if (
    [
      "ETIMEDOUT",
      "ESOCKET",
      "ECONNREFUSED",
      "ECONNRESET",
      "EHOSTUNREACH",
    ].includes(code)
  ) {
    return "The hosting provider is blocking external SMTP access from cloud servers.";
  }

  if (/timeout/i.test(e?.message || "")) {
    return `${label} connection timeout`;
  }

  return e?.message || `${label} error`;
}

export async function testSmtp(data) {
  console.log("Testing SMTP:", {
    host: data.smtpHost,
    port: 587,
  });

  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,

      // FORCE STARTTLS
      port: 587,

      secure: false,

      requireTLS: true,

      auth: {
        user: data.email,
        pass: data.password,
      },

      // Shared hosting compatibility
      tls: {
        rejectUnauthorized: false,
      },

      // Long timeouts
      connectionTimeout: 120000,

      greetingTimeout: 120000,

      socketTimeout: 120000,
    });

    await transporter.verify();

    console.log("SMTP SUCCESS");

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
  console.log("Sending Email:", {
    host: data.smtpHost,
    to: data.to,
  });

  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost,

      // FORCE STARTTLS
      port: 587,

      secure: false,

      requireTLS: true,

      auth: {
        user: data.email,
        pass: data.password,
      },

      tls: {
        rejectUnauthorized: false,
      },

      connectionTimeout: 120000,

      greetingTimeout: 120000,

      socketTimeout: 120000,
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

    console.log("EMAIL SENT:", info.messageId);

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
