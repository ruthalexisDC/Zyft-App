// // utils/sendEmail.js

// import nodemailer from "nodemailer";

// export const sendEmail = async ({ to, subject, html }) => {
//   const transporter = nodemailer.createTransport({
//     host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
//     port: Number(process.env.EMAIL_PORT) || 2525,
//     auth: {
//       user: process.env.EMAIL_USER,
//       pass: process.env.EMAIL_PASS,
//     },
//   });

//   const mailOptions = {
//     from: `"Zyft" <${process.env.EMAIL_FROM || "noreply@zyft.app"}>`,
//     to,
//     subject,
//     html,
//   };

//   const info = await transporter.sendMail(mailOptions);

//   console.log("Email send result:", {
//     messageId: info.messageId,
//     accepted: info.accepted,
//     rejected: info.rejected,
//     response: info.response,
//   });

//   return info;
// };

import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Test Gmail SMTP connection
  await transporter.verify();

  console.log("SMTP server is ready to send emails");

  const info = await transporter.sendMail({
    from: `"Zyft" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });

  console.log("Email sent:", {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
  });
  console.log({
  EMAIL_HOST: process.env.EMAIL_HOST,
  EMAIL_PORT: process.env.EMAIL_PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS_EXISTS: !!process.env.EMAIL_PASS,
});

  return info;
};