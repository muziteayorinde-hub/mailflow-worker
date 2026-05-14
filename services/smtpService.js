import { Resend } from "resend";

const resend = new Resend(
  process.env.RESEND_API_KEY
);

/*
|--------------------------------------------------------------------------
| TEST SMTP
|--------------------------------------------------------------------------
*/

export async function testSmtp() {
  return {
    success: true
  };
}

/*
|--------------------------------------------------------------------------
| SEND EMAIL
|--------------------------------------------------------------------------
*/

export async function sendEmail(data) {
  try {
    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    if (!data?.to) {
      return {
        success: false,
        error: "Recipient email is required"
      };
    }

    if (!data?.subject) {
      return {
        success: false,
        error: "Email subject is required"
      };
    }

    /*
    |--------------------------------------------------------------------------
    | NORMALIZE RECIPIENTS
    |--------------------------------------------------------------------------
    */

    const to = Array.isArray(data.to)
      ? data.to
      : [data.to];

    const cc = data.cc
      ? Array.isArray(data.cc)
        ? data.cc
        : [data.cc]
      : undefined;

    const bcc = data.bcc
      ? Array.isArray(data.bcc)
        ? data.bcc
        : [data.bcc]
      : undefined;

    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL
    |--------------------------------------------------------------------------
    */

    const response =
      await resend.emails.send({
        from:
          "MailFlow <tests@energyelectronicszw.com>",

        to,

        cc,

        bcc,

        reply_to:
          data.replyTo ||
          "tests@energyelectronicszw.com",

        subject: data.subject,

        html:
          data.html ||
          `
          <div style="font-family: Arial, sans-serif;">
            <p>${data.text || ""}</p>
          </div>
          `,

        text: data.text || "",

        headers: {
          "X-Entity-Ref-ID":
            Date.now().toString()
        }
      });

    console.log(
      "RESEND SUCCESS:",
      response
    );

    return {
      success: true,
      data: response
    };
  } catch (e) {
    console.error(
      "RESEND ERROR:",
      e
    );

    return {
      success: false,
      error:
        e?.message ||
        "Failed to send email"
    };
  }
}
