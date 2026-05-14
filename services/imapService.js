import Imap from "node-imap";

function cleanAddress(addr) {
  if (!addr) return "";

  const mailbox = addr.mailbox || "";
  const host = addr.host || "";

  return `${mailbox}@${host}`;
}

export async function fetchEmails(data) {
  return new Promise((resolve) => {
    const imap = new Imap({
      user: data.email,
      password: data.password,

      host:
        data.imapHost ||
        "business24.web-hosting.com",

      port: Number(
        data.imapPort || 993
      ),

      tls: true,

      tlsOptions: {
        rejectUnauthorized: false
      },

      authTimeout: 30000,
      connTimeout: 30000
    });

    const emails = [];

    imap.once("ready", () => {
      console.log("IMAP READY");

      imap.openBox(
        "INBOX",
        true,
        (err) => {
          if (err) {
            imap.end();

            return resolve({
              success: false,
              error: err.message
            });
          }

          imap.search(
            ["ALL"],
            (err, results) => {
              if (err) {
                imap.end();

                return resolve({
                  success: false,
                  error: err.message
                });
              }

              if (
                !results ||
                !results.length
              ) {
                imap.end();

                return resolve({
                  success: true,
                  emails: []
                });
              }

              const latest =
                results.slice(-25);

              const fetcher =
                imap.fetch(latest, {
                  bodies: ["TEXT"],
                  struct: true
                });

              fetcher.on(
                "message",
                (msg) => {
                  let body = "";

                  const email = {
                    id:
                      Date.now() +
                      "_" +
                      Math.random(),

                    subject: "",

                    from_address: "",

                    to_address:
                      data.email,

                    text_content: "",

                    html_content: "",

                    received_at:
                      new Date().toISOString(),

                    is_read: true,

                    folder: "INBOX"
                  };

                  msg.on(
                    "body",
                    (stream) => {
                      stream.on(
                        "data",
                        (chunk) => {
                          body +=
                            chunk.toString(
                              "utf8"
                            );
                        }
                      );
                    }
                  );

                  msg.once(
                    "attributes",
                    (attrs) => {
                      const env =
                        attrs.envelope;

                      email.id =
                        attrs.uid?.toString() ||
                        email.id;

                      email.subject =
                        env?.subject ||
                        "(No Subject)";

                      email.received_at =
                        env?.date
                          ? new Date(
                              env.date
                            ).toISOString()
                          : new Date().toISOString();

                      email.from_address =
                        cleanAddress(
                          env?.from?.[0]
                        );

                      email.to_address =
                        cleanAddress(
                          env?.to?.[0]
                        );
                    }
                  );

                  msg.once(
                    "end",
                    () => {
                      email.text_content =
                        body;

                      email.html_content =
                        `<pre>${body}</pre>`;

                      emails.push(email);
                    }
                  );
                }
              );

              fetcher.once(
                "error",
                (err) => {
                  imap.end();

                  return resolve({
                    success: false,
                    error: err.message
                  });
                }
              );

              fetcher.once(
                "end",
                () => {
                  imap.end();

                  emails.sort((a, b) => {
                    return (
                      new Date(
                        b.received_at
                      ) -
                      new Date(
                        a.received_at
                      )
                    );
                  });

                  console.log(
                    "SYNCED EMAILS:",
                    emails.length
                  );

                  return resolve({
                    success: true,
                    emails
                  });
                }
              );
            }
          );
        }
      );
    });

    imap.once("error", (err) => {
      console.error(
        "IMAP ERROR:",
        err
      );

      return resolve({
        success: false,
        error: err.message
      });
    });

    imap.connect();
  });
}
