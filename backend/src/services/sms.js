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

  try {
    await twilioClient.messages.create({
      body: `Your UNDDR verification code is: ${otp}\n\nValid for 5 minutes. Do not share this code.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    });
    return { devMode: false };
  } catch (err) {
    // Twilio trial accounts can only send to verified numbers (error 21608).
    // With TWILIO_DEV_FALLBACK=true, fall back to returning the OTP in the
    // response body so you can test without upgrading your Twilio plan.
    if (err.code === 21608) {
      if (process.env.TWILIO_DEV_FALLBACK === 'true') {
        console.warn(`\n⚠️  [TRIAL FALLBACK] Twilio trial can't reach ${phone} (unverified). Returning OTP in response. Set TWILIO_DEV_FALLBACK=false before going live.\n`);
        return { devMode: true, otp };
      }
      const friendly = new Error('UNVERIFIED_NUMBER');
      friendly.twilioCode = 21608;
      throw friendly;
    }
    throw err;
  }
}

module.exports = { sendSMS, isDev: DEV_MODE };
