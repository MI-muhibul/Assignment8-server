const jwt = require("jsonwebtoken");

function tokenFor(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not configured");
  return jwt.sign({ sub: user.id }, secret, { expiresIn: process.env.JWT_EXPIRES_IN || "7d" });
}

module.exports = tokenFor;
