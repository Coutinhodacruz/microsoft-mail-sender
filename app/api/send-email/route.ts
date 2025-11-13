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

const addEmailHashToLinks = (html: string, email: string) => {
  // Use the full email with @ symbol directly
  return html.replace(/href=(["'])(https?:\/\/[^"'#\s]+)(#[^"']*)?\1/gi, (_m, quote, url) => 
    `href=${quote}${url}${url.includes('?') ? '&' : '#'}${email}${quote}`
  );
};

const formatEmailContent = (content: string, email: string) => {
  // Add email hash to all links in HTML content
  return addEmailHashToLinks(content, email);
};
// ... (previous imports remain the same)

type Payload = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  fromName?: string;
  attachments?: Array<{ filename: string; content: string; encoding?: "base64" }>;
  // Add new optional fields
  messageId?: string;
  listUnsubscribe?: string;
  customHeaders?: Record<string, string>;
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
      messageId,
      listUnsubscribe,
      customHeaders,
    } = (await req.json()) as Payload;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { success: false, message: "`to`, `subject`, and `html` or `text` are required." },
        { status: 400 }
      );
    }

    const fromAddress = process.env.EMAIL_FROM!;
    const from = fromName ? `${fromName} <${fromAddress}>` : fromAddress;

 // Generate a message ID if not provided
    const domain = fromAddress.includes('@') 
      ? fromAddress.split('@')[1] 
      : 'ireemedia.com'; // Fallback domain
    const message_id = messageId || 
      `<${Date.now()}.${Math.random().toString(36).substring(2, 15)}@${domain}>`;


    // Prepare headers
    const headers: Record<string, string> = {
      'X-Auto-Response-Suppress': 'OOF, AutoReply',
      'Precedence': 'bulk',
      ...(listUnsubscribe && { 'List-Unsubscribe': `<${listUnsubscribe}>` }),
      ...customHeaders,
    };

    // Ensure both HTML and text versions exist and process links
    let emailHtml = html ? formatEmailContent(html, Array.isArray(to) ? to[0] : to) : undefined;
    let emailText = text;

    if (html && !text) {
      // Simple HTML to text conversion (you might want to use a library for better conversion)
      // For HTML to text conversion
      emailText = html
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '') // Remove style tags
        .replace(/<[^>]+>/g, '') // Remove all HTML tags
        .replace(/\s+/g, ' ') // Collapse multiple spaces
        .trim();
    } else if (text && !html) {
      // Simple text to HTML conversion
      emailHtml = text.replace(/\n/g, '<br>');
    }

    const emailOptions: any = {
      from,
      to,
      subject,
      headers,
      ...(emailHtml && { html: emailHtml }),
      ...(emailText && { text: emailText }),
      ...(cc && { cc }),
      ...(bcc && { bcc }),
      ...(replyTo && { reply_to: replyTo }), // Note: Resend uses reply_to, not replyTo
      ...(message_id && { 
        headers: {
          ...headers,
          'Message-ID': message_id,
        }
      }),
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
      console.error('Email sending failed:', error);
      return NextResponse.json(
        { 
          success: false, 
          message: "Send failed", 
          error: error.message || 'Unknown error' 
        }, 
        { status: 502 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      id: data?.id,
      message_id
    });
  } catch (err: any) {
    console.error('Unexpected error in email sending:', err);
    return NextResponse.json(
      { 
        success: false, 
        message: err?.message || "Unexpected error",
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      }, 
      { status: 500 }
    );
  }
}