const nodemailer = require("nodemailer");

/*
|--------------------------------------------------------------------------
| SEND EMAIL
|--------------------------------------------------------------------------
*/

async function sendEmail(
  data
) {
  try {
    /*
    |--------------------------------------------------------------------------
    | SMTP TRANSPORT
    |--------------------------------------------------------------------------
    */

    const transporter =
      nodemailer.createTransport({
        host:
          process.env.SMTP_HOST,

        port: Number(
          process.env.SMTP_PORT ||
            587
        ),

        secure: false,

        auth: {
          user:
            process.env.SMTP_USER,

          pass:
            process.env.SMTP_PASS
        },

        tls: {
          rejectUnauthorized:
            false
        }
      });

    /*
    |--------------------------------------------------------------------------
    | ATTACHMENTS FIX
    |--------------------------------------------------------------------------
    */

    const mailAttachments =
      (
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
            file.contentType
        };
      });

    console.log(
      "SMTP attachments count:",
      mailAttachments.length
    );

    /*
    |--------------------------------------------------------------------------
    | SEND EMAIL
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
          data.in_reply_to
      });

    console.log(
      "EMAIL SENT:",
      info.messageId
    );

    return {
      success: true,
      messageId:
        info.messageId
    };
  } catch (e) {
    console.error(
      "SMTP SEND ERROR:",
      e
    );

    return {
      success: false,
      error:
        e.message
    };
  }
}

module.exports = {
  sendEmail
};
