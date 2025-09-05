import nodemailer from 'nodemailer';
import { envData, FRONTEND_URL } from '../constants';

// Read environment variables dynamically to support testing
const getEmailConfig = () => ({
  FROM_NAME: process.env.FROM_NAME || 'SkillUp Team'
});

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  if (!options || !options.to || !options.subject || !options.html) {
    throw new Error('Missing required email fields: to, subject, html');
  }
  try {
    const sesCredentials = envData.ses;
    const transporter = nodemailer.createTransport({
      host: sesCredentials.SES_SMTP_HOST,
      port: Number(sesCredentials.SES_SMTP_PORT),
      secure: true, // true for port 465, false for other ports
      auth: {
        user: sesCredentials.SES_SMTP_USER,
        pass: sesCredentials.SES_SMTP_PASS,
      },
    });
    console.info('Nodemailer transporter created.');
    const config = getEmailConfig();

    const mailOptions = {
      from: `${config.FROM_NAME} <${sesCredentials.DEFAULT_FROM_EMAIL}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }
};

export const sendWelcomeMail = async (email: string, name: string, verificationToken?: string): Promise<void> => {
  const verificationLink = verificationToken 
    ? `${FRONTEND_URL}/auth/verify-email?token=${verificationToken}`
    : null;
  const currentYear = new Date().getFullYear();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Welcome to SkillUp!</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to SkillUp! 🎉</h1>
            </div>
            <div class="content">
                <h2>Hi ${name}!</h2>
                <p>Welcome to SkillUp - your journey to mastering new skills starts here!</p>
                <p>We're excited to have you join our community of learners. Here's what you can do:</p>
                <ul>
                    <li>📚 Access 200+ premium courses</li>
                    <li>🎯 Track your learning progress</li>
                    <li>👨‍🏫 Connect with expert mentors</li>
                    <li>💼 Get placement assistance</li>
                    <li>🏆 Participate in coding challenges</li>
                </ul>
                ${verificationLink ? `
                <p>To get started, please verify your email address:</p>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
                <p><small>This link will expire in 24 hours.</small></p>
                ` : ''}
                <p>If you have any questions, feel free to reach out to our support team.</p>
                <p>Happy learning!</p>
                <p><strong>The SkillUp Team</strong></p>
            </div>
            <div class="footer">
                <p>© ${currentYear} SkillUp. All rights reserved.</p>
                <p>You received this email because you signed up for SkillUp.</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to SkillUp! 🎉',
    html,
    text: `Welcome to SkillUp, ${name}! Your learning journey starts here.`
  });
};

export const sendPasswordResetEmail = async (email: string, name: string, resetToken: string): Promise<void> => {
  const resetLink = `${FRONTEND_URL}/auth/reset-password?token=${resetToken}`;

  const currentYear = new Date().getFullYear();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Reset Your Password</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f44336; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #f44336; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
                <h2>Hi ${name},</h2>
                <p>We received a request to reset your password for your SkillUp account.</p>
                <p>Click the button below to reset your password:</p>
                <a href="${resetLink}" class="button">Reset Password</a>
                <div class="warning">
                    <strong>⚠️ Important:</strong>
                    <ul>
                        <li>This link will expire in 1 hour</li>
                        <li>If you didn't request this reset, please ignore this email</li>
                        <li>Your password won't change until you create a new one</li>
                    </ul>
                </div>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p><small>${resetLink}</small></p>
                <p>If you need help, contact our support team.</p>
                <p><strong>The SkillUp Team</strong></p>
            </div>
            <div class="footer">
                <p>© ${currentYear} SkillUp. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Reset Your SkillUp Password',
    html,
    text: `Hi ${name}, click this link to reset your password: ${resetLink} (expires in 1 hour)`
  });
};

export const sendEmailVerificationEmail = async (email: string, name: string, verificationToken: string): Promise<void> => {
  const verificationLink = `${FRONTEND_URL}/auth/verify-email?token=${verificationToken}`;
  const currentYear = new Date().getFullYear();

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>Verify Your Email</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4CAF50; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✉️ Verify Your Email</h1>
            </div>
            <div class="content">
                <h2>Hi ${name},</h2>
                <p>Please verify your email address to complete your SkillUp account setup.</p>
                <p>Click the button below to verify your email:</p>
                <a href="${verificationLink}" class="button">Verify Email Address</a>
                <p><strong>This link will expire in 24 hours.</strong></p>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p><small>${verificationLink}</small></p>
                <p>If you didn't create a SkillUp account, please ignore this email.</p>
                <p><strong>The SkillUp Team</strong></p>
            </div>
            <div class="footer">
                <p>© ${currentYear} SkillUp. All rights reserved.</p>
                <p>This email was sent to ${email}</p>
            </div>
        </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '✉️ Verify Your SkillUp Email Address',
    html,
    text: `Hi ${name}, please verify your email address: ${verificationLink} (expires in 24 hours)`
  });
};
