// services/emailService.js

import Imap from "imap";
import { simpleParser } from "mailparser";

export async function fetchEmails(payload) {
  return new Promise(
    (resolve, reject) => {

      console.log(
        "FETCH PAYLOAD",
        JSON.stringify(payload, null, 2)
      );

      // Handle both payload shapes
      const account =
        payload.account ||
        payload;

      if (!account) {
        return reject(
          new Error(
            "No account data received"
          )
        );
      }

      const username =
        account.username ||
        account.email ||
        account.imap_username;

      const password =
        account.password ||
        account.imap_password;

      const host =
        account.imapHost ||
        account.imap_host ||
        "business24.web-hosting.com";

      const port =
        Number(
          account.imapPort ||
          account.imap_port
        ) || 993;

      const folder =
        payload.folder ||
        "INBOX";

      const limit =
        payload.limit ||
        50;

      console.log(
        "FINAL IMAP CONFIG",
        {
          username,
          host,
          port,
          hasPassword:
            !!password,
        }
      );

      const imap =
        new Imap({
          user: username,
          password,
          host,
          port,
          tls: true,
          tlsOptions: {
            rejectUnauthorized:
              false,
          },
        });

      const emails = [];

      imap.once(
        "ready",
        () => {
          console.log(
            "IMAP CONNECTED"
          );

          imap.openBox(
            folder,
            true,
            (
              err,
              box
            ) => {
              if (err) {
                reject(
                  err
                );
                return;
              }

              const total =
                box.messages
                  .total;

              const start =
                Math.max(
                  1,
                  total -
                    limit +
                    1
                );

              const fetch =
                imap.seq.fetch(
                  `${start}:${total}`,
                  {
                    bodies: "",
                    struct: true,
                  }
                );

              fetch.on(
                "message",
                (msg) => {
                  msg.on(
                    "body",
                    async (
                      stream
                    ) => {
                      try {
                        const parsed =
                          await simpleParser(
                            stream
                          );

                        emails.push({
                          subject:
                            parsed.subject ||
                            "",
                          from:
                            parsed.from
                              ?.text ||
                            "",
                          to:
                            parsed.to
                              ?.text ||
                            "",
                          text:
                            parsed.text ||
                            "",
                          html:
                            parsed.html ||
                            "",
                          date:
                            parsed.date,
                        });
                      } catch (
                        err
                      ) {
                        console.error(
                          "PARSE ERROR",
                          err
                        );
                      }
                    }
                  );
                }
              );

              fetch.once(
                "error",
                reject
              );

              fetch.once(
                "end",
                () => {
                  console.log(
                    "FETCH COMPLETE"
                  );

                  imap.end();

                  resolve({
                    emails:
                      emails.reverse(),
                  });
                }
              );
            }
          );
        }
      );

      imap.once(
        "error",
        (err) => {
          console.error(
            "IMAP ERROR",
            err
          );

          reject(err);
        }
      );

      imap.connect();
    }
  );
}
