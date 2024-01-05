const Joi = require("joi");

// Define the Joi schema for user validation
const userSchema = Joi.object({
  authorName: Joi.string().min(3).max(255).required(),
  authorUsername: Joi.string().alphanum().min(3).max(255).required(),
  authorPassword: Joi.string().min(6).required(),
});

module.exports = userSchema;
