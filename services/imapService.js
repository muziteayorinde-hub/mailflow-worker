import Imap from "node-imap";

function cleanAddress(addr) {
  if (!addr) return "";

  const mailbox = addr.mailbox || "";
  const host = addr.host || "";

  return `${mailbox}@${host}`;
}

function getBody(buffer) {
  return buffer
    ?.toString("utf8")
    ?.replace(/\r\n/g, "\n") || "";
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
        (err, box) => {
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
                results.length === 0
              ) {
                imap.end();

                return resolve({
                  success: true,
                  emails: []
                });
              }

              /*
              |--------------------------------------------------------------------------
              | GET LATEST EMAILS
              |--------------------------------------------------------------------------
              */

              const latest =
                results.slice(-25);

              const fetcher =
                imap.fetch(latest, {
                  bodies: ["HEADER", "TEXT"],
                  struct: true
                });

              fetcher.on(
                "message",
                (msg) => {
                  const email = {
                    id: "",
                    from: "",
                    to: "",
                    subject: "",
                    date: "",
                    body: ""
                  };

                  msg.on(
                    "body",
                    (stream, info) => {
                      let buffer = "";

                      stream.on(
                        "data",
                        (chunk) => {
                          buffer +=
                            chunk.toString(
                              "utf8"
                            );
                        }
                      );

                      stream.once(
                        "end",
                        () => {
                          if (
                            info.which ===
                            "TEXT"
                          ) {
                            email.body =
                              buffer;
                          }
                        }
                      );
                    }
                  );

                  msg.once(
                    "attributes",
                    (attrs) => {
                      email.id =
                        attrs.uid?.toString();

                      const env =
                        attrs.envelope;

                      email.subject =
                        env?.subject || "";

                      email.date =
                        env?.date || "";

                      email.from =
                        cleanAddress(
                          env?.from?.[0]
                        );

                      email.to =
                        cleanAddress(
                          env?.to?.[0]
                        );
                    }
                  );

                  msg.once(
                    "end",
                    () => {
                      emails.push(email);
                    }
                  );
                }
              );

              fetcher.once(
                "error",
                (err) => {
                  console.error(
                    "FETCH ERROR:",
                    err
                  );

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
                  console.log(
                    "FETCH COMPLETE"
                  );

                  imap.end();

                  emails.sort((a, b) => {
                    return (
                      new Date(
                        b.date
                      ) -
                      new Date(a.date)
                    );
                  });

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

    imap.once("end", () => {
      console.log("IMAP CLOSED");
    });

    imap.connect();
  });
}
