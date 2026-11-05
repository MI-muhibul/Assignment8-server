const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncRoute = require("../lib/asyncRoute");
const { sendError } = require("../lib/responses");

module.exports = asyncRoute(async (req, res, next) => {
  const authorization = req.get("authorization");
  if (!authorization || !authorization.startsWith("Bearer ")) {
    return sendError(res, 401, "Please sign in to continue.");
  }
  try {
    const payload = jwt.verify(authorization.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return sendError(res, 401, "Your session is no longer valid. Please sign in again.");
    req.user = user;
    return next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return sendError(res, 401, "Your session is invalid or has expired. Please sign in again.");
    }
    throw error;
  }
});
