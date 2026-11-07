const express = require("express");
const Event = require("../models/Event");
const asyncRoute = require("../lib/asyncRoute");
const authenticate = require("../middleware/authenticate");
const { sendError } = require("../lib/responses");
const { idSchema, eventInput } = require("../validation");

const router = express.Router();

router.get("/mine/created", authenticate, asyncRoute(async (req, res) => {
  const events = await Event.find({ createdBy: req.user.id }).sort({ date: 1 }).lean();
  return res.json({ events });
}));

router.get("/mine/joined", authenticate, asyncRoute(async (req, res) => {
  const events = await Event.find({ joinedBy: req.user.id })
    .sort({ date: 1 })
    .populate("createdBy", "name imageUrl")
    .lean();
  return res.json({ events });
}));

router.post("/:id/join", authenticate, asyncRoute(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return sendError(res, 400, "Invalid event id.");
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, date: { $gt: new Date() }, joinedBy: { $ne: req.user._id } },
    { $addToSet: { joinedBy: req.user._id } },
    { new: true },
  );
  if (!event) {
    const exists = await Event.exists({ _id: req.params.id, date: { $gt: new Date() } });
    if (!exists) return sendError(res, 404, "This upcoming event could not be found.");
    return sendError(res, 409, "You have already joined this event.");
  }
  return res.json({ event, message: "You’re in! Thanks for showing up for your community." });
}));

router.patch("/:id", authenticate, asyncRoute(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return sendError(res, 400, "Invalid event id.");
  const parsed = eventInput.safeParse(req.body);
  if (!parsed.success) return sendError(res, 400, parsed.error.issues[0].message);
  const date = new Date(parsed.data.date);
  if (date <= new Date()) return sendError(res, 400, "Choose a future date for your event.");
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, createdBy: req.user.id },
    { ...parsed.data, date, createdByEmail: req.user.email },
    { new: true, runValidators: true },
  );
  if (!event) return sendError(res, 404, "Event not found or you do not have permission to edit it.");
  return res.json({ event });
}));

router.delete("/:id", authenticate, asyncRoute(async (req, res) => {
  if (!idSchema.safeParse(req.params.id).success) return sendError(res, 400, "Invalid event id.");
  const event = await Event.findOneAndDelete({ _id: req.params.id, createdBy: req.user.id });
  if (!event) return sendError(res, 404, "Event not found or you do not have permission to delete it.");
  return res.json({ message: "Event deleted." });
}));

module.exports = router;
