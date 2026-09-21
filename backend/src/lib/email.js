import nodemailer from 'nodemailer'

const host = process.env.SMTP_HOST || 'smtp.gmail.com'
const port = Number(process.env.SMTP_PORT || 465)
const secure = process.env.SMTP_SECURE !== 'false' && port === 465
const user = process.env.SMTP_USER || 'fkdavid58@gmail.com'
const pass = process.env.SMTP_PASS || 'oemqrmpgyisvsylx'
const from = process.env.SMTP_FROM || '"Amen Events EMS" <fkdavid58@gmail.com>'

let transporter = null

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    })
  }
  return transporter
}

/**
 * Send a 6-digit OTP verification email to a client or attendee
 */
export async function sendOtpEmail(toEmail, otpCode, purpose = 'Client Registration') {
  const mailer = getTransporter()

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Amen Events Verification Code</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 0; }
    .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
    .header { background: linear-gradient(135deg, #041C0B 0%, #0B3B16 50%, #115B22 100%); padding: 32px 28px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { color: #39D353; margin: 6px 0 0; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; }
    .body { padding: 36px 32px; color: #1e293b; }
    .greeting { font-size: 18px; font-weight: 700; margin-bottom: 12px; color: #0f172a; }
    .desc { font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px; }
    .otp-box { background: #f0fdf4; border: 2px dashed #86efac; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #15803d; margin: 0; }
    .otp-validity { font-size: 12px; color: #166534; margin-top: 8px; font-weight: 600; }
    .warning { font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 20px; margin-top: 28px; }
    .footer { background: #f8fafc; padding: 20px 32px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Amen Event Organizer</h1>
      <p>Enterprise Event Management System</p>
    </div>
    <div class="body">
      <div class="greeting">Verify your email address</div>
      <p class="desc">
        Thank you for registering with <strong>Amen Events</strong>. Use the 6-digit verification code below to complete your ${purpose}:
      </p>
      <div class="otp-box">
        <div class="otp-code">${otpCode}</div>
        <div class="otp-validity">Valid for 10 minutes</div>
      </div>
      <p class="desc">
        If you did not request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
      </p>
      <div class="warning">
        🔒 <strong>Security tip:</strong> Never share this OTP code with anyone. Amen Events staff will never ask for your verification code.
      </div>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Amen Event Organizer · Addis Ababa, Ethiopia · Powered by Gravity Technologies
    </div>
  </div>
</body>
</html>
`

  const info = await mailer.sendMail({
    from,
    to: toEmail,
    subject: `Your Amen Events Verification Code: ${otpCode}`,
    text: `Your Amen Events verification code is: ${otpCode}. Valid for 10 minutes.`,
    html,
  })

  return { success: true, messageId: info.messageId }
}

