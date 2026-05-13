const { ImapFlow } = require('imapflow');

async function fetchEmails(config) {
  const client = new ImapFlow({
    host: config.imapHost,
    port: 993,
    secure: true,
    auth: {
      user: config.email,
      pass: config.password
    }
  });

  await client.connect();

  const emails = [];

  let lock = await client.getMailboxLock('INBOX');

  try {
    for await (let message of client.fetch('1:*', {
      envelope: true,
      source: true
    })) {
      emails.push({
        subject: message.envelope.subject,
        from: message.envelope.from,
        date: message.envelope.date,
        messageId: message.envelope.messageId
      });
    }
  } finally {
    lock.release();
  }

  await client.logout();

  return emails;
}

module.exports = {
  fetchEmails
};
