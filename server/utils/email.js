import nodemailer from "nodemailer";

export const sendOTP = async (toEmail, otp, serviceType) => {
  // Graceful fallback if email config is missing in .env
  if (!process.env.USER_EMAIL || !process.env.USER_PASSWORD) {
    console.warn(`⚠️ [MOCK EMAIL] OTP for ${serviceType} sent to ${toEmail}: ${otp}`);
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.USER_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.USER_EMAIL,
      to: toEmail,
      subject: `Your OTP for ${serviceType} Service - Sahayak`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Service Request Accepted!</h2>
          <p>Your <strong>${serviceType}</strong> professional is on the way.</p>
          <p>Please share this OTP with the professional when they arrive to start the service:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #333; margin: 20px 0; padding: 10px; background: #f3f4f6; text-align: center; border-radius: 8px;">
            ${otp}
          </div>
          <p>Do not share this OTP over the phone. Only share it when the vendor arrives.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ OTP Email sent to ${toEmail}`);
  } catch (err) {
    console.error("❌ Error sending OTP email:", err);
  }
};
