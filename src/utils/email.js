import nodemailer from "nodemailer";
import config from "../config/index.js";

export const sendVerificationEmail = async (email, token) => {
  const transporter = nodemailer.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: false,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPass,
    },
  });

  const verifyUrl = `${config.frontendUrl}/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"FVG Assist" <${config.smtpUser}>`,
    to: email,
    subject: "Verify your email",
    html: `
      <h2>Welcome to FVG Assist!</h2>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verifyUrl}">${verifyUrl}</a>
    `,
  });
};
