require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
const userRoutes = require("./modules/user/routes/userRoutes");
const meetingRoutes = require("./modules/meeting/routes/meetingRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

// Import models to register associations
const User = require("./modules/user/model/User");
const Meeting = require("./modules/meeting/model/Meeting");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/users", userRoutes);
app.use("/meetings", meetingRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running" });
});

// 404 handler
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// Database initialization and server start
const startServer = async () => {
  try {
    // Sync database
    await sequelize.sync({ alter: false });
    console.log("Database synced successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`API URL: http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
