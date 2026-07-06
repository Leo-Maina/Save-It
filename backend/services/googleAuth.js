// backend/services/googleAuth.js
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

async function verifyGoogleToken(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  return {
    email: payload.email,
    name: payload.name,
    googleId: payload.sub,
    emailVerified: payload.email_verified,
  };
}

module.exports = { verifyGoogleToken };