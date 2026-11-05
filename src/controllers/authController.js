const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const tokenFor = require("../lib/authToken");
const { sendError, publicUser } = require("../lib/responses");
const { googleInput } = require("../validation");

const googleClient = new OAuth2Client();

async function googleLogin(req, res) {
  const parsed = googleInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "A valid Google credential is required.");

  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) return sendError(res, 503, "Google sign-in is not configured.");

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: parsed.data.credential,
      audience: clientId,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Google ID token verification failed:", error.message);
    return sendError(res, 401, "Google could not verify your sign-in. Please try again.");
  }

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    return sendError(res, 401, "Use a Google account with a verified email address.");
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email });
  if (user?.googleId && user.googleId !== payload.sub) {
    return sendError(res, 409, "This email is already linked to a different Google account.");
  }

  if (!user) {
    user = new User({
      name: payload.name || email.split("@")[0],
      email,
      googleId: payload.sub,
      imageUrl: payload.picture || "",
    });
  } else {
    user.googleId = payload.sub;
    if (!user.imageUrl && payload.picture) user.imageUrl = payload.picture;
  }

  await user.save();
  return res.json({ token: tokenFor(user), user: publicUser(user) });
}

module.exports = { googleLogin };
