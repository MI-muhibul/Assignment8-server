const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncRoute = require("../lib/asyncRoute");
const tokenFor = require("../lib/authToken");
const authenticate = require("../middleware/authenticate");
const { sendError, publicUser } = require("../lib/responses");
const { registerInput, loginInput, profileInput } = require("../validation");
const { googleLogin } = require("../controllers/authController");

const router = express.Router();

router.post("/register", asyncRoute(async (req, res) => {
  const parsed = registerInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0].message);
  const { name, email, password, imageUrl } = parsed.data;
  const normalizedEmail = email.toLowerCase();
  if (await User.exists({ email: normalizedEmail })) return sendError(res, 409, "An account with this email already exists.");
  const user = await User.create({
    name,
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    imageUrl: imageUrl || "",
  });
  return res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
}));

router.post("/login", asyncRoute(async (req, res) => {
  const parsed = loginInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, "Enter a valid email and password.");
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (!user || !user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
    return sendError(res, 401, "Email or password is incorrect.");
  }
  return res.json({ token: tokenFor(user), user: publicUser(user) });
}));

router.post("/google", asyncRoute(googleLogin));

router.get("/me", authenticate, (req, res) => res.json({ user: publicUser(req.user) }));

router.patch("/profile", authenticate, asyncRoute(async (req, res) => {
  const parsed = profileInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0].message);
  req.user.name = parsed.data.name;
  req.user.imageUrl = parsed.data.imageUrl;
  await req.user.save();
  return res.json({ user: publicUser(req.user) });
}));

module.exports = router;
