
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT),
  secure: Number(process.env.EMAIL_PORT) === 465,

  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },

  // TEMPORARY FIX FOR LOCAL DEVELOPMENT
  // This bypasses SSL certificate verification.
  // Do not use this setting in production.
  tls: {
    rejectUnauthorized: false,
  },
});

// EMAIL VERIFICATION
export async function sendVerificationEmail(email, otp) {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "PharmTech - Email Verification",

    text: `Welcome to PharmTech, your online pharmacy of choice.

Your verification code is: ${otp}

This code expires in 10 minutes.

If you did not request this code, please ignore this email.`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; background: #f8fffb; border-radius: 12px;">
        <h2 style="color: #10b265;">Welcome to PharmTech</h2>

        <p>Your online pharmacy of choice.</p>

        <p>Use the verification code below to complete your registration.</p>

        <div style="background: #e8f8ef; padding: 20px; text-align: center; border-radius: 10px;">
          <h1 style="letter-spacing: 8px; color: #10b265; margin: 0;">
            ${otp}
          </h1>
        </div>

        <p><strong>How to use your code:</strong></p>
        <p>Select the six-digit code above and enter it on the PharmTech verification page.</p>

        <p><strong>This code expires after 10 minutes.</strong></p>

        <p>If you did not request this code, please ignore this email.</p>

        <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />

        <p style="color: #777; font-size: 13px;">
          PharmTech — Your online pharmacy network.
        </p>
      </div>
    `,
  });
}

// WELCOME EMAIL AFTER SUCCESSFUL VERIFICATION
export async function sendWelcomeEmail(email, accountType) {
  const isPharmacy = accountType === "pharmacy";

  const subject = isPharmacy
    ? "Welcome to PharmTech - Pharmacy Registration"
    : "Welcome to PharmTech!";

  const message = isPharmacy
    ? "Your email has been verified successfully. Your pharmacy registration is now awaiting administrator approval. You will be able to access your pharmacy account once it has been approved."
    : "Your account has been created successfully. PharmTech helps you explore medicines from participating pharmacies, check availability, and compare prices.";

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject,

    text: `${message}

Need help? Contact PharmTech through WhatsApp:
https://wa.me/254742725968

Thank you for joining PharmTech.`,

    html: `
      <div style="font-family: Arial, sans-serif; max-width: 550px; margin: auto; padding: 25px; background: #f8fffb; border-radius: 12px;">

        <h2 style="color: #10b265;">Welcome to PharmTech!</h2>

        <p>${message}</p>

        ${
          isPharmacy
            ? ""
            : `
              <p>We hope PharmTech makes finding the medicines you need easier.</p>
            `
        }

        <hr style="border: none; border-top: 1px solid #ddd; margin: 25px 0;" />

        <h3 style="color: #10b265;">Need help?</h3>

        <p>Contact us through WhatsApp if you need assistance.</p>

        <p>
          <a
            href="https://wa.me/254742725968"
            style="display: inline-block; background-color: #10b265; color: white; padding: 12px 20px; text-decoration: none; border-radius: 5px;"
          >
            Contact PharmTech
          </a>
        </p>

        <p style="color: #777; font-size: 13px;">
          Thank you for joining PharmTech.
        </p>
      </div>
    `,
  });
}
