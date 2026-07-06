// ============================================================
// Email utility — STUBBED for this build.
//
// No real email provider is configured. Instead of sending an
// actual email, this logs the verification link to the server
// console so the flow can be tested end-to-end locally.
//
// TO GO LIVE: replace the body of sendVerificationEmail() with a
// real provider call, e.g. using @sendgrid/mail, nodemailer + SES,
// or Mailgun. Keep the same function signature so nothing else
// in the codebase needs to change.
//
// Example with nodemailer (uncomment and configure):
//
// const nodemailer = require('nodemailer');
// const transporter = nodemailer.createTransport({
//     host: process.env.SMTP_HOST,
//     port: process.env.SMTP_PORT,
//     auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
// });
// ============================================================

async function sendVerificationEmail(toEmail, name, verificationToken) {
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

    console.log('\n📧 [STUBBED EMAIL] Verification email "sent" ----------------');
    console.log(`   To:      ${toEmail}`);
    console.log(`   Subject: Verify your Save-It account`);
    console.log(`   Hi ${name}, click the link below to verify your account:`);
    console.log(`   ${verifyUrl}`);
    console.log('---------------------------------------------------------------\n');

    // In dev/test we also return the link so the frontend can show it
    // directly, since no inbox actually receives it.
    return { success: true, verifyUrl };
}

module.exports = { sendVerificationEmail };
