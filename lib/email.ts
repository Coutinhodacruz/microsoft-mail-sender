import nodemailer from 'nodemailer';

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail({ to, subject, text = '', html = '' }: SendEmailOptions) {
  // Create a test account if you don't have real credentials
  const testAccount = await nodemailer.createTestAccount();

  // Create reusable transporter object using the default SMTP transport
  const transporter = nodemailer.createTransport({
    host: 'smtp.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'dominicrotimi@gmail.com', // your email
      pass: 'pjdabuykuxleuvci', // your password
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false,
    },
  });

  // Send mail with defined transport object
  const info = await transporter.sendMail({
    from: '"Your Name" <dominicrotimi@gmail.com>', // sender address
    to: Array.isArray(to) ? to : [to], // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  });

  console.log('Message sent: %s', info.messageId);
  console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

  return {
    messageId: info.messageId,
    previewUrl: nodemailer.getTestMessageUrl(info),
  };
}
