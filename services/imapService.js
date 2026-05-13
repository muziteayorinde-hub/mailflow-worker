import Imap from "node-imap";

function mapNetError(e, label = "IMAP") {
  const code = e?.code || e?.errno || "";

  if (
    [
      "ETIMEDOUT",
      "ESOCKET",
      "ECONNREFUSED",
      "ECONNRESET",
      "EHOSTUNREACH",
    ].includes(code)
  ) {
    return "The hosting provider is blocking external IMAP/SMTP access from cloud servers.";
  }

  if (/timeout/i.test(e?.message || "")) {
    return `${label} connection timeout`;
  }

  return e?.message || `${label} error`;
}

export function testImap(data) {
  console.log("Testing IMAP:", {
    host: data.imapHost,
    port: data.imapPort,
  });

  return new Promise((resolve) => {
    const client = new Imap({
      user: data.email,

      password: data.password,

      host: data.imapHost,

      port: Number(data.imapPort || 993),

      tls: data.tls !== false,

      tlsOptions: {
        rejectUnauthorized:
          data?.tlsOptions?.rejectUnauthorized !== false,
      },

      authTimeout: Number(data.authTimeout || 60000),

      connTimeout: Number(data.connTimeout || 60000),
    });

    let settled = false;

    const done = (result) => {
      if (!settled) {
        settled = true;

        try {
          client.end();
        } catch {}

        resolve(result);
      }
    };

    client.once("ready", () => {
      done({
        success: true,
      });
    });

    client.once("error", (e) => {
      done({
        success: false,
        error: mapNetError(e, "IMAP"),
      });
    });

    client.once("end", () => {});

    try {
      client.connect();
    } catch (e) {
      done({
        success: false,
        error: mapNetError(e, "IMAP"),
      });
    }
  });
}
