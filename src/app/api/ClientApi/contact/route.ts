import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sql from '@/lib/db';
import { getSession } from '@/lib/auth';

// POST /api/contact – now allows guests (no login required)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // If there is a session, store the userid; otherwise store NULL
    const session = await getSession();
    const userId = session?.userId || null;

    // Save to database (userid can be NULL for guests)
    const result = await sql`
      INSERT INTO messages (userid, sendername, senderemail, senderphone, sendersubject, sendermessage)
      VALUES (${userId}, ${name}, ${email}, ${phone || null}, ${subject}, ${message})
      RETURNING messageid
    `;
    const newId = result[0].messageid;

    // Send professional email with logo
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const logoUrl = `${baseUrl}/photos/image.png`;

    const htmlContent = `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>New message from Fleur Marwa</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            background: #fef9f0;
            padding: 40px 20px;
          }
          .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 20px 35px -12px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 2px solid #fde68a;
          }
          .logo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            overflow: hidden;
            margin: 0 auto 16px;
            box-shadow: 0 8px 20px rgba(245,158,11,0.2);
            border: 2px solid white;
          }
          .logo img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .brand {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 28px;
            font-weight: 700;
            font-style: italic;
            background: linear-gradient(135deg, #b45309, #d97706);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
          }
          .content {
            padding: 32px 28px;
          }
          .greeting {
            font-size: 18px;
            color: #1e293b;
            margin-bottom: 24px;
            font-weight: 500;
          }
          .message-card {
            background: #fffbeb;
            border-radius: 20px;
            padding: 20px;
            margin: 20px 0;
            border-left: 4px solid #f59e0b;
          }
          .field {
            margin-bottom: 20px;
          }
          .label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 600;
            color: #b45309;
            margin-bottom: 6px;
          }
          .value {
            font-size: 15px;
            color: #1e293b;
            line-height: 1.5;
          }
          .message-text {
            background: white;
            padding: 16px;
            border-radius: 16px;
            white-space: pre-wrap;
            font-size: 14px;
            color: #334155;
            margin-top: 8px;
          }
          .footer {
            background: #f8fafc;
            padding: 24px 20px;
            text-align: center;
            font-size: 12px;
            color: #94a3b8;
            border-top: 1px solid #e2e8f0;
          }
          .footer a {
            color: #d97706;
            text-decoration: none;
          }
          @media (max-width: 600px) {
            .content { padding: 24px 20px; }
          }
        </style>
        <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400;14..32,500;14..32,600;14..32,700&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet">
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <div class="logo">
              <img src="${logoUrl}" alt="Fleur Marwa">
            </div>
            <div class="brand">Fleur Marwa</div>
            <p style="color: #92400e; margin-top: 8px; font-size: 14px;">Floral Artistry · Nature's Elegance</p>
          </div>
          <div class="content">
            <div class="greeting">✨ New message from <strong>${name}</strong></div>
            <div class="message-card">
              <div class="field">
                <div class="label">Customer</div>
                <div class="value">${name} · ${email}</div>
              </div>
              ${phone ? `<div class="field"><div class="label">Phone</div><div class="value">${phone}</div></div>` : ''}
              <div class="field">
                <div class="label">Subject</div>
                <div class="value">${subject}</div>
              </div>
              <div class="field">
                <div class="label">Message</div>
                <div class="message-text">${message.replace(/\n/g, '<br>')}</div>
              </div>
            </div>
            <p style="font-size: 13px; color: #475569; margin-top: 16px;">
              This message was sent from your website by ${userId ? `a logged-in user (ID: ${userId})` : 'a guest (not logged in)'}.
              You can reply directly to ${email}.
            </p>
          </div>
          <div class="footer">
            <p>Fleur Marwa – 123 Rue des Roses, Marrakech 40000, Morocco</p>
            <p><a href="mailto:contact@fleurmarwa.com">contact@fleurmarwa.com</a> · +212 6 57 97 25 60</p>
            <p style="margin-top: 12px;">&copy; ${new Date().getFullYear()} Fleur Marwa – All rights reserved</p>
          </div>
        </div>
      </body>
      </html>`;

    await transporter.sendMail({
      from: `"Fleur Marwa Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: email,
      subject: `[Fleur Marwa] ${subject} – from ${name}`,
      html: htmlContent,
    });

    return NextResponse.json({ success: true, messageId: newId }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

