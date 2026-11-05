require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const authRoutes = require("./routes/auth");
const privateEventRoutes = require("./routes/privateEvents");
const publicEventRoutes = require("./routes/publicEvents");

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:3000" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (req, res) => res.json({ status: "ok" }));
app.use("/api/auth", authRoutes);
app.use("/api/events", privateEventRoutes);
app.use("/api/events", publicEventRoutes);

app.use((error, req, res, next) => {
  console.error(error);
  if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists." });
  if (error instanceof mongoose.Error.ValidationError) return res.status(400).json({ message: error.message });
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid request data." });
  return res.status(500).json({ message: "Something went wrong. Please try again." });
});

async function start() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is not configured");
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("Set JWT_SECRET to a random string of at least 32 characters.");
  }
  await mongoose.connect(process.env.MONGODB_URI);
  app.listen(port, () => console.log(`Good Neighbors API listening on port ${port}`));
}

start().catch((error) => {
  console.error("Could not start the API:", error.message);
  process.exitCode = 1;
});
