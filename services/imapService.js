import Imap from "node-imap";
import { simpleParser } from "mailparser";

const SUPABASE_URL =
  process.env.SUPABASE_URL;

const MAIL_WORKER_TOKEN =
  process.env.MAIL_WORKER_TOKEN;

/*
|--------------------------------------------------------------------------
| PERSIST EMAIL
|--------------------------------------------------------------------------
*/

async function persistEmail(
  accountId,
  email
) {
  try {
    console.log(
      "PERSISTING EMAIL:",
      email.uid
    );

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/imap-push`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${MAIL_WORKER_TOKEN}`
        },

        body: JSON.stringify({
          account_id: accountId,
          email
        })
      }
    );

    const text =
      await response.text();

    console.log(
      "PERSIST RESPONSE:",
      response.status,
      text
    );

    return {
      success: response.ok
    };
  } catch (e) {
    console.error(
      "PERSIST ERROR:",
      e
    );

    return {
      success: false
    };
  }
}

/*
|--------------------------------------------------------------------------
| FETCH EMAILS
|--------------------------------------------------------------------------
*/

export async function fetchEmails(
  data
) {
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

          /*
          |--------------------------------------------------------------------------
          | INCREMENTAL UID FETCH
          |--------------------------------------------------------------------------
          */

          const sinceUid =
            Number(
              data.since_uid || 0
            ) + 1;

          const searchCriteria =
            sinceUid > 1
              ? [["UID", `${sinceUid}:*`]]
              : ["ALL"];

          console.log(
            "SEARCH:",
            searchCriteria
          );

          imap.search(
            searchCriteria,
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

              const fetcher =
                imap.fetch(results, {
                  bodies: "",
                  struct: true,
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

                  /*
                  |--------------------------------------------------------------------------
                  | PARSE EMAIL
                  |--------------------------------------------------------------------------
                  */

                  msg.once(
                    "end",
                    async () => {
                      try {
                        const parsed =
                          await simpleParser(
                            raw
                          );

                        /*
                        |--------------------------------------------------------------------------
                        | ATTACHMENTS
                        |--------------------------------------------------------------------------
                        */

                        const attachments =
                          (
                            parsed.attachments ||
                            []
                          ).map(
                            (
                              attachment
                            ) => ({
                              filename:
                                attachment.filename,

                              contentType:
                                attachment.contentType,

                              size:
                                attachment.size,

                              contentId:
                                attachment.cid,

                              disposition:
                                attachment.contentDisposition,

                              /*
                              |--------------------------------------------------------------------------
                              | IMPORTANT FIX
                              |--------------------------------------------------------------------------
                              */

                              content:
                                attachment.content
                                  ? Buffer.from(
                                      attachment.content
                                    ).toString(
                                      "base64"
                                    )
                                  : null
                            })
                          );

                        const email = {
                          uid,

                          message_id:
                            parsed.messageId ||
                            uid,

                          subject:
                            parsed.subject ||
                            "(No Subject)",

                          from_address:
                            parsed.from?.text ||
                            "",

                          to_address:
                            parsed.to?.text ||
                            "",

                          cc_address:
                            parsed.cc?.text ||
                            "",

                          bcc_address:
                            parsed.bcc?.text ||
                            "",

                          text_content:
                            parsed.text ||
                            "",

                          html_content:
                            parsed.html ||
                            "",

                          snippet:
                            (
                              parsed.text ||
                              ""
                            )
                              .replace(
                                /\s+/g,
                                " "
                              )
                              .trim()
                              .slice(
                                0,
                                180
                              ),

                          received_at:
                            parsed.date
                              ? new Date(
                                  parsed.date
                                ).toISOString()
                              : new Date().toISOString(),

                          folder:
                            "INBOX",

                          is_read: false,

                          has_attachments:
                            attachments.length >
                            0,

                          attachments
                        };

                        /*
                        |--------------------------------------------------------------------------
                        | NON-BLOCKING PERSIST
                        |--------------------------------------------------------------------------
                        */

                        persistEmail(
                          data.account_id,
                          email
                        );

                        emails.push(
                          email
                        );

                        console.log(
                          "EMAIL PARSED:",
                          uid,
                          "ATTACHMENTS:",
                          attachments.length
                        );
                      } catch (e) {
                        console.error(
                          "PARSE ERROR:",
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

              /*
              |--------------------------------------------------------------------------
              | WAIT FOR PARSING
              |--------------------------------------------------------------------------
              */

              fetcher.once(
                "end",
                async () => {
                  console.log(
                    "FETCH COMPLETE"
                  );

                  await new Promise(
                    (resolveDone) => {
                      const check =
                        () => {
                          if (
                            emails.length >=
                            results.length
                          ) {
                            return resolveDone();
                          }

                          setTimeout(
                            check,
                            100
                          );
                        };

                      check();
                    }
                  );

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
      console.log(
        "IMAP CONNECTION CLOSED"
      );
    });

    imap.connect();
  });
}
