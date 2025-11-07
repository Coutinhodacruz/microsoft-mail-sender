// import { NextResponse } from "next/server";

// async function getGraphToken() {
//   const body = new URLSearchParams({
//     client_id: process.env.MS_CLIENT_ID!,
//     client_secret: process.env.MS_CLIENT_SECRET!,
//     grant_type: "client_credentials",
//     scope: "https://graph.microsoft.com/.default",
//   });

//   const res = await fetch(
//     `https://login.microsoftonline.com/${process.env.MS_TENANT_ID}/oauth2/v2.0/token`,
//     { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body }
//   );

//   if (!res.ok) throw new Error(`Token error: ${res.status} ${await res.text()}`);
//   return (await res.json()).access_token as string;
// }

// export async function POST(req: Request) {
//   try {
//     const { to, subject, text, html } = await req.json();

//     const token = await getGraphToken();
// const [, payload] = token.split(".");
// console.log(JSON.parse(Buffer.from(payload, "base64").toString()));
//     const from = process.env.SMTP_USER!; // must be an Exchange Online mailbox

//     const graphRes = await fetch(
//       `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(from)}/sendMail`,
//       {
//         method: "POST",
//         headers: {
//           Authorization: `Bearer ${token}`,
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           message: {
//             subject,
//             body: { contentType: html ? "HTML" : "Text", content: html ?? text ?? "" },
//             toRecipients: [{ emailAddress: { address: to } }],
//             from: { emailAddress: { address: from } }, // optional; helps clarity
//           },
//           saveToSentItems: true, // shows up in the sender's Sent Items
//         }),
//       }
//     );

//     if (!graphRes.ok) throw new Error(`Graph error: ${graphRes.status} ${await graphRes.text()}`);
//     return NextResponse.json({ success: true });
//   } catch (err: any) {
//     return NextResponse.json(
//       { success: false, message: err.message, stack: process.env.NODE_ENV === "development" ? err.stack : undefined },
//       { status: 500 }
//     );
//   }
// }



import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

type Payload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  fromName?: string; // optional display name
  attachments?: Array<{ filename: string; content: string; encoding?: "base64" }>;
};

export async function POST(req: Request) {
  try {
    const {
      to,
      subject,
      html,
      text,
      cc,
      bcc,
      replyTo,
      fromName,
      attachments,
    } = (await req.json()) as Payload;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: "`to`, `subject`, and `html` or `text` are required." },
        { status: 400 }
      );
    }

    const fromAddress = process.env.EMAIL_FROM!;
    const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

    const emailOptions: any = {
      from,
      to,
      subject,
      ...(html && { html }),
      ...(text && { text }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { replyTo }),
      ...(attachments && {
        attachments: attachments.map(a => ({
          filename: a.filename,
          content: a.content,
          ...(a.encoding && { encoding: a.encoding }),
        })),
      }),
    };

    const { data, error } = await resend.emails.send(emailOptions);

    if (error) {
      return NextResponse.json({ success: false, message: "Send failed", error }, { status: 502 });
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: err?.message ?? "Unexpected error" },
      { status: 500 }
    );
  }
}
