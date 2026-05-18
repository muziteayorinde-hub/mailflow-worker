const smtpHost =
  config.smtpHost ||
  process.env.SMTP_HOST;

const smtpPort =
  Number(config.smtpPort) ||
  Number(process.env.SMTP_PORT) ||
  587;

const username =
  config.username ||
  process.env.SMTP_USER;

const password =
  config.password ||
  process.env.SMTP_PASS;

// force boolean parsing
const secure =
  String(config.secure) === "true" ||
  config.secure === true ||
  smtpPort === 465;

const requireTLS =
  String(config.requireTLS) === "true" ||
  config.requireTLS === true;

console.log("SMTP CONFIG", {
  host: smtpHost,
  port: smtpPort,
  secure,
  requireTLS,
  username,
  hasPassword: !!password,
});
