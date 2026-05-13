const nodemailer = require('nodemailer');

async function sendEmail(data) {
  try {
    const transporter = nodemailer.createTransport({
      host: data.smtpHost || 'energyelectronicszw.com',

      // Use STARTTLS port
      port: Number(data.smtpPort || 587),

      // IMPORTANT:
      // secure must be false for STARTTLS
      secure: false,

      // Upgrade connection to TLS
      requireTLS: true,

      auth: {
        user: data.email,
        pass: data.password
      },

      tls: {
        rejectUnauthorized: false
      },

      connectionTimeout: 30000,
      greetingTimeout: 30000,
      socketTimeout: 30000
    });

    // Verify SMTP connection first
    await transporter.verify();

    console.log('SMTP connection successful');

    const info = await transporter.sendMail({
      from: data.from || data.email,

      to: data.to,

      cc: data.cc || undefined,

      bcc: data.bcc || undefined,

      subject: data.subject || '',

      text: data.text || '',

      html: data.html || '',

      attachments: data.attachments || []
    });

    console.log('Email sent:', info.messageId);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response
    };

  } catch (error) {
    console.error('SMTP Error:', error);

    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  sendEmail
};
