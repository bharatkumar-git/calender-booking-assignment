/**
 * Validation middleware using Joi
 * Validates request body, params, or query against a schema
 */
const validateRequest = (schema, location = "body") => {
  return (req, res, next) => {
    const dataToValidate = req[location];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
    });

    if (error) {
      const messages = error.details.map((detail) => detail.message);
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: messages,
      });
    }

    // Replace the request data with validated data
    req[location] = value;
    next();
  };
};

module.exports = {
  validateRequest,
};
