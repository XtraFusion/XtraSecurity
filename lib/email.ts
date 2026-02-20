import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Create a reusable transporter object using the default SMTP transport
const createTransporter = () => {
    // If credentials aren't set, use Ethereal (a fake SMTP service for testing) as fallback
    // In production, these should be set in Vercel/environment
    const host = process.env.SMTP_HOST || 'smtp.ethereal.email';
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!user || !pass) {
        console.warn("⚠️ SMTP_USER or SMTP_PASS not set in environment. Emails may fail if not using local mock.");
    }

    return nodemailer.createTransport({
        host,
        port,
        secure, 
        auth: {
            user,
            pass,
        },
    });
};

export const sendEmail = async ({ to, subject, text, html }: EmailOptions) => {
    try {
        const transporter = createTransporter();
        
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL || '"XtraSecurity" <noreply@xtrasecurity.com>', 
            to,
            subject,
            text,
            html: html || text, // Fallback to text if html is not provided
        });

        console.log("Message sent: %s", info.messageId);
        
        // Ethereal provides a preview URL
        if(process.env.SMTP_HOST === 'smtp.ethereal.email') {
            console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        }

        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error("Error sending email:", error);
        return { success: false, error };
    }
};
