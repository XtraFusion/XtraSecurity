import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Send the email to the platform admin/support inbox
    const adminEmail = process.env.SMTP_FROM_EMAIL || "support@xtrasecurity.com";

    const emailResult = await sendEmail({
      to: adminEmail,
      subject: `[Contact Form] ${subject}`,
      text: `New message from ${name} (${email}):\n\n${message}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <h2 style="color: #4f46e5;">New Contact Form Submission</h2>
          <table style="width: 100%; text-align: left; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; width: 100px;">Name:</th>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${name}</td>
            </tr>
            <tr>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Email:</th>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
                    <a href="mailto:${email}">${email}</a>
                </td>
            </tr>
            <tr>
                <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Subject:</th>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${subject}</td>
            </tr>
          </table>
          
          <h3 style="color: #374151; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Message Content</h3>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px; white-space: pre-wrap; font-size: 14px; color: #4b5563;">${message}</div>
          
          <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">Sent from the XtraSecurity Contact Page.</p>
        </div>
      `,
    });

    if (!emailResult.success) {
      throw new Error("Failed to dispatch email");
    }

    return NextResponse.json(
      { success: true, message: "Contact message sent successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("POST /contact error:", error);
    return NextResponse.json(
      { error: error.message || "Server error while sending message" },
      { status: 500 }
    );
  }
}
