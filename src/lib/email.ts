import nodemailer from "nodemailer";

// 创建邮件传输器
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.example.com",
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER || "user@example.com",
    pass: process.env.EMAIL_PASSWORD || "password",
  },
});

// 发送验证邮件
export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || "noreply@example.com",
    to: email,
    subject: "验证您的电子邮箱",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>验证您的电子邮箱</h2>
        <p>感谢您注册我们的服务。请点击下面的链接验证您的电子邮箱：</p>
        <p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            验证邮箱
          </a>
        </p>
        <p>或者复制以下链接到浏览器地址栏：</p>
        <p>${verificationUrl}</p>
        <p>此链接将在24小时后过期。</p>
        <p>如果您没有注册我们的服务，请忽略此邮件。</p>
      </div>
    `,
  };
  
  return transporter.sendMail(mailOptions);
}