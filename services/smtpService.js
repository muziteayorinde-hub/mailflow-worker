import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

export async function testSmtp() {
  return {
    success: true,
  };
}

export async function sendEmail(data) {
  try {
    const result = await resend.emails.send({
      from:
        data.from ||
        `MailFlow <tests@energyelectronicszw.com>`,

      to: data.to,

      cc: data.cc,

      bcc: data.bcc,

      subject: data.subject,

      html:
        data.html ||
        `<p>${data.text || "No content"}</p>`,

      text: data.text,

      reply_to:
        data.replyTo ||
        data.email,
    });

    return {
      success: true,
      data: result,
    };
  } catch (e) {
    console.error("RESEND ERROR:", e);

    return {
      success: false,
      error:
        e?.message ||
        "Failed to send email",
    };
  }
}
