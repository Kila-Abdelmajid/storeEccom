import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOTPEmail(email: string, code: string, type: 'signup' | 'forgot' | 'admin_login') {
  let subject = '';
  let html = '';
  switch (type) {
    case 'signup':
      subject = 'Verify your email address';
      html = `<p>Thank you for signing up! Your verification code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`;
      break;
    case 'forgot':
      subject = 'Password reset code';
      html = `<p>You requested a password reset. Your code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`;
      break;
    case 'admin_login':
      subject = 'Admin login verification code';
      html = `<p>An admin login attempt requires verification. Your code is:</p><h2>${code}</h2><p>This code expires in 10 minutes.</p>`;
      break;
  }
  try {
    const info = await transporter.sendMail({
      from: `"FLEUR MARWA" <${process.env.SMTP_FROM}>`,
      to: email,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
  } catch (err) {
    console.error('Failed to send email:', err);
    throw new Error('Email sending failed');
  }
}