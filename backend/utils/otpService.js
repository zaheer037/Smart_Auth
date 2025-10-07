const nodemailer = require('nodemailer');
const twilio = require('twilio');

// Email transporter setup
const createEmailTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Twilio client setup - only initialize if credentials are properly configured
const twilioClient = (process.env.TWILIO_SID && 
                     process.env.TWILIO_TOKEN && 
                     process.env.TWILIO_SID.startsWith('AC') &&
                     process.env.TWILIO_SID.length > 10) 
  ? twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN)
  : null;

/**
 * Send OTP via email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 * @param {object} location - User location info
 * @returns {Promise<boolean>} Success status
 */
const sendEmailOTP = async (email, otp, location = {}) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your-email@gmail.com') {
      console.log('📧 Email credentials not configured');
      console.log(`📧 OTP for ${email}: ${otp}`);
      return true; // Return true for development
    }

    const transporter = createEmailTransporter();
    
    const mailOptions = {
      from: {
        name: 'Smart Auth Hub',
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: '🔐 Your Login Code - Smart Auth Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Login Code</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
            .container { max-width: 600px; margin: 0 auto; background-color: white; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { padding: 40px 20px; }
            .otp-box { background-color: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 30px; text-align: center; margin: 30px 0; }
            .otp-code { font-size: 36px; font-weight: bold; color: #1e293b; letter-spacing: 8px; margin: 10px 0; }
            .info-box { background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 20px 0; border-radius: 4px; }
            .footer { background-color: #f8fafc; padding: 20px; text-align: center; color: #64748b; font-size: 14px; }
            .warning { color: #dc2626; font-weight: 500; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Smart Auth Hub</h1>
              <p style="color: #e2e8f0; margin: 10px 0 0 0;">Secure Authentication Code</p>
            </div>
            
            <div class="content">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Your Login Code</h2>
              
              <p>Hello! Here's your secure login code:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #64748b;">Enter this code to complete your login</p>
              </div>
              
              <div class="info-box">
                <p style="margin: 0;"><strong>Important:</strong></p>
                <ul style="margin: 10px 0 0 0; padding-left: 20px;">
                  <li>This code expires in <strong>2 minutes</strong></li>
                  <li>Use it only on the Smart Auth Hub website</li>
                  <li>Never share this code with anyone</li>
                </ul>
              </div>
              
              ${location.city ? `
                <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                  <p style="margin: 0; color: #166534;"><strong>📍 Login Location:</strong> ${location.city}, ${location.country}</p>
                </div>
              ` : ''}
              
              <p class="warning">If you didn't request this code, please ignore this email and ensure your account is secure.</p>
            </div>
            
            <div class="footer">
              <p>This is an automated message from Smart Auth Hub</p>
              <p>© ${new Date().getFullYear()} Smart Auth Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 OTP email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending email OTP:', error);
    return false;
  }
};

/**
 * Send OTP via SMS
 * @param {string} phone - Recipient phone number
 * @param {string} otp - OTP code
 * @param {object} location - User location info
 * @returns {Promise<boolean>} Success status
 */
const sendSMSOTP = async (phone, otp, location = {}) => {
  try {
    if (!twilioClient) {
      console.log('📱 Twilio credentials not configured');
      console.log(`📱 SMS OTP for ${phone}: ${otp}`);
      return true; // Return true for development
    }

    const message = `🔐 Smart Auth Hub Login Code: ${otp}\n\nExpires in 2 minutes. Don't share this code.\n\n${location.city ? `Location: ${location.city}, ${location.country}` : ''}`;

    await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: phone
    });

    console.log(`📱 OTP SMS sent successfully to ${phone}`);
    return true;
  } catch (error) {
    console.error('❌ Error sending SMS OTP:', error);
    return false;
  }
};

/**
 * Send OTP based on method (email or phone)
 * @param {string} identifier - Email or phone number
 * @param {string} method - 'email' or 'phone'
 * @param {string} otp - OTP code
 * @param {object} location - User location info
 * @returns {Promise<boolean>} Success status
 */
const sendOTP = async (identifier, method, otp, location = {}) => {
  if (method === 'email') {
    return await sendEmailOTP(identifier, otp, location);
  } else if (method === 'phone') {
    return await sendSMSOTP(identifier, otp, location);
  } else {
    throw new Error('Invalid OTP method. Use "email" or "phone".');
  }
};

module.exports = {
  sendOTP,
  sendEmailOTP,
  sendSMSOTP
};
