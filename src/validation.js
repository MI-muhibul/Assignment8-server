const { z } = require("zod");

const emailSchema = z.string().email().max(254);
const idSchema = z.string().regex(/^[a-f\d]{24}$/i, "Invalid event id");
const eventInput = z.object({
  title: z.string().trim().min(4).max(100),
  description: z.string().trim().min(20).max(2000),
  type: z.enum(["Cleanup", "Plantation", "Donation", "Community", "Education", "Other"]),
  imageUrl: z.string().url().max(2048),
  location: z.string().trim().min(3).max(160),
  date: z.string().datetime(),
});
const registerInput = z.object({
  name: z.string().trim().min(2).max(80),
  email: emailSchema,
  password: z.string().min(8).max(72),
  imageUrl: z.string().url().max(2048).optional().or(z.literal("")),
});
const loginInput = z.object({ email: emailSchema, password: z.string().min(1).max(72) });
const profileInput = z.object({
  name: z.string().trim().min(2).max(80),
  imageUrl: z.string().url().max(2048).or(z.literal("")),
});

module.exports = { idSchema, eventInput, registerInput, loginInput, profileInput };
