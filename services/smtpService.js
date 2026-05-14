import nodemailer from "nodemailer";

/*
|--------------------------------------------------------------------------
| CREATE SMTP TRANSPORTER
|--------------------------------------------------------------------------
*/

function createTransporter() {
  const port = Number(
    process.env.SMTP_PORT || 587
  );

  const secure =
    port === 465;

  console.log(
    "SMTP CONFIG:",
    {
      host:
        process.env.SMTP_HOST,
      port,
      secure,
      user:
        process.env.SMTP_USER,
    }
  );

  return nodemailer.createTransport({
    host:
      process.env.SMTP_HOST,

    port,

    secure,

    auth: {
      user:
        process.env.SMTP_USER,

      pass:
        process.env.SMTP_PASS,
    },

    tls: {
      rejectUnauthorized:
        false,
    },
  });
}

/*
|--------------------------------------------------------------------------
| TEST SMTP
|--------------------------------------------------------------------------
*/

export async function testSmtp() {
  try {
    const transporter =
      createTransporter();

    await transporter.verify();

    console.log(
      "SMTP VERIFIED"
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error(
      "SMTP VERIFY ERROR:"
    );

    console.error(error);

    return {
      success: false,
      error:
        error.message,
    };
  }
}

/*
|--------------------------------------------------------------------------
| SEND EMAIL
|--------------------------------------------------------------------------
*/

export async function sendEmail(
  data
) {
  try {
    console.log(
      "SEND EMAIL PAYLOAD:",
      {
        from:
          data.from,

        to:
          data.to,

        subject:
          data.subject,

        attachments:
          data.attachments
            ?.length || 0,
      }
    );

    const transporter =
      createTransporter();

    /*
    |--------------------------------------------------------------------------
    | VERIFY SMTP FIRST
    |--------------------------------------------------------------------------
    */

    await transporter.verify();

    console.log(
      "SMTP READY"
    );

    /*
    |--------------------------------------------------------------------------
    | ATTACHMENTS
    |--------------------------------------------------------------------------
    */

    const mailAttachments =
      (
        data.attachments ||
        []
      ).map((file) => {
        console.log(
          "SMTP ATTACHMENT:",
          file.filename,
          Buffer.byteLength(
            file.content,
            "base64"
          )
        );

        return {
          filename:
            file.filename,

          content:
            Buffer.from(
              file.content,
              "base64"
            ),

          encoding:
            "base64",

          contentType:
            file.contentType,
        };
      });

    console.log(
      "SMTP attachments count:",
      mailAttachments.length
    );

    /*
    |--------------------------------------------------------------------------
    | SEND MAIL
    |--------------------------------------------------------------------------
    */

    const info =
      await transporter.sendMail({
        from:
          data.from ||
          process.env.SMTP_USER,

        to:
          data.to,

        cc:
          data.cc ||
          undefined,

        bcc:
          data.bcc ||
          undefined,

        subject:
          data.subject ||
          "(No Subject)",

        text:
          data.text || "",

        html:
          data.html || "",

        attachments:
          mailAttachments,

        inReplyTo:
          data.in_reply_to ||
          undefined,
      });

    console.log(
      "EMAIL SENT SUCCESS:",
      info.messageId
    );

    return {
      success: true,
      messageId:
        info.messageId,
    };
  } catch (error) {
    console.error(
      "SMTP SEND ERROR:"
    );

    console.error(error);

    return {
      success: false,
      error:
        error.message,
    };
  }
}
