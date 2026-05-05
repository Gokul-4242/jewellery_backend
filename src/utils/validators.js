const Joi = require('joi');

// Joi schemas
exports.loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

exports.rateSchema = Joi.object({
  gold24k: Joi.number().min(0).required(),
  gold22k: Joi.number().min(0).required(),
  silver: Joi.number().min(0).required()
});
