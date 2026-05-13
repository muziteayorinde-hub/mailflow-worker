const express = require('express');

const { fetchEmails } = require('../services/imapService');
const { sendEmail } = require('../services/smtpService');

const router = express.Router();

function validateToken(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth) {
    return res.status(401).json({ error: 'Missing token' });
  }

  const token = auth.replace('Bearer ', '');

  if (token !== process.env.MAIL_WORKER_TOKEN) {
    return res.status(403).json({ error: 'Invalid token' });
  }

  next();
}

router.post('/sync', validateToken, async (req, res) => {
  try {
    const emails = await fetchEmails(req.body);

    res.json({
      success: true,
      count: emails.length,
      emails
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.post('/send', validateToken, async (req, res) => {
  try {
    const result = await sendEmail(req.body);

    res.json({
      success: true,
      result
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
