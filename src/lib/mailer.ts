import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS, // App password if using Gmail
  },
})

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn(`[MAILER] Missing SMTP credentials. Skipping email to ${to}: ${subject}`)
    return
  }
  
  try {
    const info = await transporter.sendMail({
      from: `"IT Support" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
    console.log(`[MAILER] Message sent successfully: ${info.messageId}`)
    return info
  } catch (error) {
    console.error(`[MAILER] Error sending email to ${to}:`, error)
  }
}
