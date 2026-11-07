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
  const requestedLimit = Number(req.query.limit);
  const limit = Math.min(Math.max(Number.isInteger(requestedLimit) ? requestedLimit : 100, 1), 100);
  const requestedSkip = Number(req.query.skip);
  const skip = Number.isSafeInteger(requestedSkip) && requestedSkip > 0 ? requestedSkip : 0;
  const events = await Event.find(query)
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit + 1)
    .select("-createdByEmail")
    .populate("createdBy", "name imageUrl")
    .lean();
  const hasMore = events.length > limit;
  if (hasMore) events.pop();
  return res.json({ events, hasMore });
}));

router.get("/:id", asyncRoute(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return sendError(res, 400, "Invalid event id.");
  const event = await Event.findById(req.params.id)
    .select("-createdByEmail")
    .populate("createdBy", "name imageUrl")
    .lean();
  if (!event) return sendError(res, 404, "This event could not be found.");
  return res.json({ event });
}));

router.post("/", authenticate, asyncRoute(async (req, res) => {
  const parsed = eventInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0].message);
  const date = new Date(parsed.data.date);
  if (date <= new Date()) return sendError(res, 400, "Choose a future date for your event.");
  const event = await Event.create({
    ...parsed.data,
    date,
    createdBy: req.user.id,
    createdByEmail: req.user.email,
  });
  return res.status(201).json({ event });
}));

module.exports = router;
