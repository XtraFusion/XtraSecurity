const nodemailer = require('nodemailer');
require('dotenv').config({ path: '.env' });

async function sendTest() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER,
            to: 'salunkeom474@gmail.com',
            subject: 'XtraSecurity SMTP Test',
            text: 'Hello! This is a test email sent using the configured Gmail App Password to verify the SMTP integration.',
            html: '<h1>Hello!</h1><p>This is a test email sent using the configured Gmail App Password to verify the SMTP integration.</p>',
        });
        console.log("Message sent exactly:", info.messageId);
    } catch (err) {
        console.error("Failed to send", err);
    }
}

sendTest();
