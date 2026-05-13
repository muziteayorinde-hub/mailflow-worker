const nodemailer = require('nodemailer');

async function sendEmail(data) {
  const transporter = nodemailer.createTransport({
    host: data.smtpHost,
    port: 465,
    secure: true,
    auth: {
      user: data.email,
      pass: data.password
    }
  });

  const info = await transporter.sendMail({
    from: data.email,
    to: data.to,
    subject: data.subject,
    html: data.html
  });

  return info;
}

module.exports = {
  sendEmail
};
