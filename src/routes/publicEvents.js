const express = require("express");
const Event = require("../models/Event");
const asyncRoute = require("../lib/asyncRoute");
const authenticate = require("../middleware/authenticate");
const { sendError } = require("../lib/responses");
const { idSchema, eventInput } = require("../validation");

const router = express.Router();

router.get("/", asyncRoute(async (req, res) => {
  const query = { date: { $gt: new Date() } };
  if (req.query.type && req.query.type !== "All") query.type = req.query.type;
  const limit = Math.min(Math.max(Number(req.query.limit) || 100, 1), 100);
  const events = await Event.find(query)
    .sort({ date: 1 })
    .limit(limit)
    .populate("createdBy", "name imageUrl")
    .lean();
  return res.json({ events });
}));

router.get("/:id", asyncRoute(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return sendError(res, 400, "Invalid event id.");
  const event = await Event.findOne({ _id: req.params.id, date: { $gt: new Date() } })
    .populate("createdBy", "name imageUrl")
    .lean();
  if (!event) return sendError(res, 404, "This upcoming event could not be found.");
  return res.json({ event });
}));

router.post("/", authenticate, asyncRoute(async (req, res) => {
  const parsed = eventInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0].message);
  const date = new Date(parsed.data.date);
  if (date <= new Date()) return sendError(res, 400, "Choose a future date for your event.");
  const event = await Event.create({ ...parsed.data, date, createdBy: req.user.id });
  return res.status(201).json({ event });
}));

module.exports = router;
