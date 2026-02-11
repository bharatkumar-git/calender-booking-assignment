const Joi = require("joi");

const createMeetingSchema = Joi.object({
  userId: Joi.number().integer().required().messages({
    "number.base": "User ID must be a number",
    "any.required": "User ID is required",
  }),
  title: Joi.string().required().messages({
    "string.empty": "Title is required",
    "any.required": "Title is required",
  }),
  startTime: Joi.date().required().messages({
    "date.base": "Start time must be a valid date",
    "any.required": "Start time is required",
  }),
  endTime: Joi.date().required().messages({
    "date.base": "End time must be a valid date",
    "any.required": "End time is required",
  }),
})
  .custom((value, helpers) => {
    if (value.startTime >= value.endTime) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "time validation")
  .messages({
    "any.invalid": "Start time must be before end time",
  });

const updateMeetingSchema = Joi.object({
  title: Joi.string().messages({
    "string.empty": "Title cannot be empty",
  }),
  startTime: Joi.date().messages({
    "date.base": "Start time must be a valid date",
  }),
  endTime: Joi.date().messages({
    "date.base": "End time must be a valid date",
  }),
})
  .custom((value, helpers) => {
    if (value.startTime && value.endTime && value.startTime >= value.endTime) {
      return helpers.error("any.invalid");
    }
    return value;
  }, "time validation")
  .messages({
    "any.invalid": "Start time must be before end time",
  });

const getMeetingSchema = Joi.object({
  id: Joi.number().integer().required().messages({
    "number.base": "Meeting ID must be a number",
    "any.required": "Meeting ID is required",
  }),
});

const listMeetingSchema = Joi.object({
  userId: Joi.number().integer(),
  startDate: Joi.date(),
  endDate: Joi.date(),
});

module.exports = {
  createMeetingSchema,
  updateMeetingSchema,
  getMeetingSchema,
  listMeetingSchema,
};
