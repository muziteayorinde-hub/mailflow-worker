import Imap from "node-imap";

function parseMessage(stream) {
  return new Promise((resolve) => {
    let buffer = "";

    stream.on("data", (chunk) => {
      buffer += chunk.toString("utf8");
    });

    stream.once("end", () => {
      resolve(buffer);
    });
  });
}

export async function fetchEmails(data) {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: data.email,
      password: data.password,
      host: data.imapHost,
      port: Number(data.imapPort || 993),
      tls: true,
      tlsOptions: {
        rejectUnauthorized: false,
      },
      authTimeout: 30000,
      connTimeout: 30000,
    });

    const emails = [];

    imap.once("ready", () => {
      imap.openBox("INBOX", true, (err) => {
        if (err) {
          imap.end();

          return resolve({
            success: false,
            error: err.message,
          });
        }

        imap.search(["ALL"], (err, results) => {
          if (err) {
            imap.end();

            return resolve({
              success: false,
              error: err.message,
            });
          }

          if (!results || !results.length) {
            imap.end();

            return resolve({
              success: true,
              emails: [],
            });
          }

          const latest = results.slice(-20);

          const fetcher = imap.fetch(latest, {
            bodies: "",
            struct: true,
          });

          fetcher.on("message", (msg) => {
            const email = {
              subject: "",
              from: "",
              date: "",
              body: "",
            };

            msg.on("body", async (stream) => {
              const raw = await parseMessage(stream);

              email.body = raw;
            });

            msg.once("attributes", (attrs) => {
              const envelope = attrs.envelope;

              email.subject =
                envelope?.subject || "";

              email.date =
                envelope?.date || "";

              email.from =
                envelope?.from?.[0]?.mailbox +
                  "@" +
                  envelope?.from?.[0]?.host || "";
            });

            msg.once("end", () => {
              emails.push(email);
            });
          });

          fetcher.once("error", (err) => {
            imap.end();

            return resolve({
              success: false,
              error: err.message,
            });
          });

          fetcher.once("end", () => {
            imap.end();

            return resolve({
              success: true,
              emails,
            });
          });
        });
      });
    });

    imap.once("error", (err) => {
      return resolve({
        success: false,
        error: err.message,
      });
    });

    imap.connect();
  });
}
