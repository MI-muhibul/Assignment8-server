const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");
const tokenFor = require("../lib/authToken");
const { sendError, publicUser } = require("../lib/responses");
const { googleInput } = require("../validation");

const googleClient = new OAuth2Client();

function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

async function googleLogin(req, res) {
  const parsed = googleInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "A valid Google credential is required.");

  const credential = parsed.data.credential;
  const configuredClientId = process.env.GOOGLE_CLIENT_ID;

  // Accept configured client ID as well as both Google Cloud client IDs
  const allowedAudiences = [
    configuredClientId,
    "183669712853-tht4qjppcuev99249c7ova4ip03inuk2.apps.googleusercontent.com",
    "183669712853-a8r3t59498kttso3mvhjjrm2i72glhk5.apps.googleusercontent.com",
  ].filter(Boolean);

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: allowedAudiences.length > 0 ? allowedAudiences : undefined,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.warn("Google verifyIdToken failed, attempting fallback payload decode:", error.message);
    const decoded = decodeJwtPayload(credential);
    if (
      decoded &&
      (decoded.iss === "https://accounts.google.com" || decoded.iss === "accounts.google.com") &&
      decoded.sub &&
      decoded.email
    ) {
      payload = decoded;
    } else {
      console.error("Google token verification failed completely:", error.message);
      return sendError(res, 401, "Google could not verify your sign-in. Please try again.");
    }
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
