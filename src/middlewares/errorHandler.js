/**
 * Global error handling middleware
 * Catches all errors from routes and controllers
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  // Handle specific error messages
  let responseMessage = message;
  let code = statusCode;

  if (message.includes("Email already exists")) {
    code = 400;
    responseMessage = "Email already exists";
  } else if (message.includes("User not found")) {
    code = 404;
    responseMessage = "User not found";
  } else if (message.includes("Meeting not found")) {
    code = 404;
    responseMessage = "Meeting not found";
  } else if (message.includes("Time slot already booked")) {
    code = 400;
    responseMessage = "Time slot already booked";
  } else if (message.includes("Start time must be before end time")) {
    code = 400;
    responseMessage = "Start time must be before end time";
  }

  console.error(`[ERROR] ${code}: ${responseMessage}`, err);

  return res.status(code).json({
    success: false,
    message: responseMessage,
  });
};

/**
 * 404 Not Found middleware
 */
const notFoundHandler = (req, res) => {
  return res.status(404).json({
    success: false,
    message: "Route not found",
  });
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
