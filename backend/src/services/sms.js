const DEV_MODE = !(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_PHONE_NUMBER);

let twilioClient = null;
if (!DEV_MODE) {
  twilioClient = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

async function sendSMS(phone, otp) {
  if (DEV_MODE) {
    console.log(`\n📱 [DEV] OTP for ${phone}: ${otp}\n`);
    return { devMode: true, otp };
  }

  await twilioClient.messages.create({
    body: `Your UNDDR verification code is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
    from: process.env.TWILIO_PHONE_NUMBER,
    to: phone,
  });

  return { devMode: false };
}

module.exports = { sendSMS, isDev: DEV_MODE };
