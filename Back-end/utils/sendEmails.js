// utils/sendEmail.js
import nodemailer from "nodemailer";

export const sendEmail = async ({ to, subject, html }) => {
  // For development - Mailtrap (recommended)
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || "sandbox.smtp.mailtrap.io",
    port: process.env.EMAIL_PORT || 2525,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // For production - Gmail/SES/etc
  // const transporter = nodemailer.createTransport({
  //   service: "gmail",
  //   auth: {
  //     user: process.env.GMAIL_USER,
  //     pass: process.env.GMAIL_APP_PASSWORD,
  //   },
  // });

  const mailOptions = {
    from: `"Zyft" <${process.env.EMAIL_FROM || "noreply@zyft.app"}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
};