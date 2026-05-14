import nodemailer from "nodemailer";

/*
|--------------------------------------------------------------------------
| CREATE TRANSPORTER
|--------------------------------------------------------------------------
*/

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,

    port: Number(
      process.env.SMTP_PORT || 587
    ),

    secure: false,

    auth: {
      user:
        process.env.SMTP_USER,

      pass:
        process.env.SMTP_PASS,
    },

    tls: {
      rejectUnauthorized: false,
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
      "SMTP TEST ERROR:",
      error
    );

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
    const transporter =
      createTransporter();

    /*
    |--------------------------------------------------------------------------
    | ATTACHMENTS
    |--------------------------------------------------------------------------
    */

    const mailAttachments = (
      data.attachments || []
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

        /*
        |--------------------------------------------------------------------------
        | IMPORTANT FIX
        |--------------------------------------------------------------------------
        */

        content:
          Buffer.from(
            file.content,
            "base64"
          ),

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
          data.from,

        to:
          data.to,

        cc:
          data.cc,

        bcc:
          data.bcc,

        subject:
          data.subject,

        text:
          data.text,

        html:
          data.html,

        attachments:
          mailAttachments,

        inReplyTo:
          data.in_reply_to,
      });

    console.log(
      "EMAIL SENT:",
      info.messageId
    );

    return {
      success: true,
      messageId:
        info.messageId,
    };
  } catch (error) {
    console.error(
      "SMTP SEND ERROR:",
      error
    );

    return {
      success: false,
      error:
        error.message,
    };
  }
}
