import Imap from "node-imap";
import { simpleParser } from "mailparser";

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
                  bodies: "",
                  markSeen: false
                });

              fetcher.on(
                "message",
                (msg) => {
                  let raw = "";

                  let uid = "";

                  msg.on(
                    "body",
                    (stream) => {
                      stream.on(
                        "data",
                        (chunk) => {
                          raw +=
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
                      uid =
                        attrs.uid?.toString() ||
                        Date.now().toString();
                    }
                  );

                  msg.once(
                    "end",
                    async () => {
                      try {
                        const parsed =
                          await simpleParser(
                            raw
                          );

                        emails.push({
                          id: uid,

                          subject:
                            parsed.subject ||
                            "(No Subject)",

                          from_address:
                            parsed.from?.text ||
                            "",

                          to_address:
                            parsed.to?.text ||
                            "",

                          text_content:
                            parsed.text ||
                            "",

                          html_content:
                            parsed.html ||
                            `<pre>${
                              parsed.text ||
                              ""
                            }</pre>`,

                          received_at:
                            parsed.date
                              ? new Date(
                                  parsed.date
                                ).toISOString()
                              : new Date().toISOString(),

                          folder:
                            "INBOX",

                          is_read: false
                        });
                      } catch (e) {
                        console.error(
                          "MAIL PARSE ERROR:",
                          e
                        );
                      }
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
      return resolve({
        success: false,
        error: err.message
      });
    });

    imap.connect();
  });
}
