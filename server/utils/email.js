
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "PharmTech - Email Verification",
    text: `Welcome to PharmTech, your online pharmacy of choice. Your verification code is ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px;">
        <h2 style="color: #10b265;">Welcome to PharmTech</h2>
        <p>Your online pharmacy of choice.</p>
        <p>Use the verification code below to complete your registration.</p>
        <h1 style="letter-spacing: 8px; color: #10b265;">${otp}</h1>
        <p>This code expires in 10 minutes.</p>
        <p>If you did not request this code, please ignore this email.</p>
      </div>
    `,
  });
}
