import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import sql from '@/lib/db'; // L-client dyalk

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    // 1. Validation dyal les champs (Backend Safety)
    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Koulchi les champs darouriyin men ghir l-phone' }, 
        { status: 400 }
      );
    }

    /**
     * BEST PRACTICE: DB First
     * Kandiro l-insertion f l-base de données hwa l-lowel.
     * Ila dazt, 3ad kancifto l-email. 
     */
    const result = await sql`
      INSERT INTO messages (
        senderName, 
        senderEmail, 
        senderPhone, 
        senderSubject, 
        senderMessage
      ) VALUES (
        ${name}, 
        ${email}, 
        ${phone || null}, 
        ${subject}, 
        ${message}
      )
      RETURNING messageId
    `;

    const newMessageId = result[0].messageid;

    // 2. Configuration dyal Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER, // Dima khdem b email dyal service
      replyTo: email,               // Bach fach t-cliqui "Reply" f Gmail, tjawb l-user direct
      to: process.env.EMAIL_USER,
      subject: `[Fleur Marwa Contact] ${subject}: ${name}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4f46e5;">Nouveau Message de Contact (#${newMessageId})</h2>
          <p><strong>Nom:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Téléphone:</strong> ${phone || 'Non précisé'}</p>
          <p><strong>Sujet:</strong> ${subject}</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p><strong>Message:</strong></p>
          <p style="white-space: pre-wrap; background: #f9f9f9; padding: 10px;">${message}</p>
        </div>
      `,
    };

    // 3. Envoi dyal l-email
    await transporter.sendMail(mailOptions);

    return NextResponse.json(
      { success: true, message: 'Message reçu et sauvegardé' }, 
      { status: 201 }
    );

  } catch (error) {
    console.error('Contact API Error:', error);
    
    // N-traitiw l-errors (DB down, email error, etc.)
    return NextResponse.json(
      { error: 'Erreur lors de l\'envoi du message.' }, 
      { status: 500 }
    );
  }
}