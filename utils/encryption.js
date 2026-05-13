const crypto = require('crypto');

const algorithm = 'aes-256-cbc';

const key = crypto
  .createHash('sha256')
  .update(process.env.MAIL_ENCRYPTION_KEY)
  .digest();

function encrypt(text) {
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted
  };
}

function decrypt(hash) {
  const decipher = crypto.createDecipheriv(
    algorithm,
    key,
    Buffer.from(hash.iv, 'hex')
  );

  let decrypted = decipher.update(hash.encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = {
  encrypt,
  decrypt
};
