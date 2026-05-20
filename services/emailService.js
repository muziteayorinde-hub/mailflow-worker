// services/emailService.js

import Imap from "imap";
import { simpleParser } from "mailparser";

export async function fetchEmails({
  account,
  folder = "INBOX",
  limit = 50,
}) {
  return new Promise(
    (resolve, reject) => {

      const imap =
        new Imap({
          user:
            account.username ||
            account.email,

          password:
            account.password,

          host:
            account.imapHost ||
            "business24.web-hosting.com",

          port:
            Number(
              account.imapPort
            ) || 993,

          tls: true,

          tlsOptions: {
            rejectUnauthorized: false,
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
                    bodies:
                      "",
                    struct: true,
                  }
                );

              fetch.on(
                "message",
                (
                  msg
                ) => {
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

                        emails.push(
                          {
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
                          }
                        );
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
        (
          err
        ) => {
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
