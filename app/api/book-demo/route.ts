import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !company) {
      return NextResponse.json(
        { error: 'Name, email, and company are required.' },
        { status: 400 }
      );
    }

    // The user requested to send email to xtrafusion.offical@gmail.com
    const targetEmail = 'xtrafusion.offical@gmail.com';

    const emailSubject = `New Demo Request from ${name} (${company})`;
    const emailHtml = `
      <h2>New Demo Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Message/Requirements:</strong></p>
      <p>${message || 'No additional message provided.'}</p>
    `;

    const result = await sendEmail({
      to: targetEmail,
      subject: emailSubject,
      text: `New Demo Request from ${name} (${email}) - ${company}. Message: ${message}`,
      html: emailHtml,
    });

    if (result.success) {
      return NextResponse.json(
        { message: 'Demo request sent successfully', id: result.messageId },
        { status: 200 }
      );
    } else {
      console.error('Email failed to send:', result.error);
      return NextResponse.json(
        { error: 'Failed to send demo request email.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing demo request:', error);
    return NextResponse.json(
      { error: 'Internal server error while processing demo request.' },
      { status: 500 }
    );
  }
}
