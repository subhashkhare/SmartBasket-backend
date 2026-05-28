const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// SMS configuration (lazy — avoids crash when credentials aren't set)
let twilioClient = null;
const getTwilioClient = () => {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

/**
 * Send welcome SMS to newly registered user
 */
async function sendWelcomeSMS(phoneNumber) {
  try {
    const client = getTwilioClient();
    if (!client) {
      console.warn('Twilio not configured, skipping SMS');
      return;
    }
    const message = `Hi, you are successfully registered for SmartBasket.
Enjoy shopping!

Thank you
Team SmartBasket`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`Welcome SMS sent to ${phoneNumber}`);
  } catch (error) {
    console.error('Error sending welcome SMS:', error);
    // Don't throw error to avoid breaking registration
  }
}

/**
 * Send welcome email to newly registered user
 */
async function sendWelcomeEmail(email) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to SmartBasket!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Hi,</h2>

          <p>You are successfully registered for SmartBasket.</p>
          <p>Enjoy shopping!</p>

          <p><a href="${process.env.APP_URL}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Link to SmartBasket web application</a></p>

          <p>Thank you<br>
          Team SmartBasket</p>
        </div>
      `,
      text: `Hi,

You are successfully registered for SmartBasket.
Enjoy shopping!

Link to SmartBasket web application: ${process.env.APP_URL}

Thank you
Team SmartBasket`,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`Welcome email sent to ${email}`);
  } catch (error) {
    console.error('Error sending welcome email:', error);
    // Don't throw error to avoid breaking registration
  }
}

/**
 * Send welcome notifications for successful registration
 */
async function sendWelcomeNotifications(phoneNumber, email) {
  try {
    await Promise.all([
      sendWelcomeSMS(phoneNumber),
      sendWelcomeEmail(email),
    ]);
  } catch (error) {
    console.error('Error sending welcome notifications:', error);
  }
}

/**
 * Send OTP via WhatsApp for login verification.
 * phoneNumber must be a 10-digit US number (as stored in DB).
 */
async function sendWhatsAppOTP(phoneNumber, otp) {
  const client = getTwilioClient();
  if (!client) {
    console.warn('Twilio not configured, skipping WhatsApp OTP');
    return;
  }

  const whatsappTo = `whatsapp:+1${phoneNumber}`;
  const from = process.env.TWILIO_PHONE_NUMBER;
  const whatsappFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  await client.messages.create({
    body: `Your SmartBasket login code is: *${otp}*\n\nThis code expires in 5 minutes. Do not share it with anyone.`,
    from: whatsappFrom,
    to: whatsappTo,
  });

  console.log(`WhatsApp OTP sent to ${whatsappTo}`);
}

module.exports = {
  sendWelcomeSMS,
  sendWelcomeEmail,
  sendWelcomeNotifications,
  sendWhatsAppOTP,
};