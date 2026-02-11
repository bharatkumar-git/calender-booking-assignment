const express = require("express");
const UserController = require("./UserController");
const { validateRequest } = require("../../utils/validators");
const { createUserSchema } = require("../interface/UserInterface");

const router = express.Router();

/**
 * POST /users
 * Create a new user
 */
router.post(
  "/",
  validateRequest(createUserSchema, "body"),
  UserController.createUser,
);

/**
 * GET /users
 * Get all users
 */
router.get("/", UserController.getAllUsers);

/**
 * GET /users/:id
 * Get user by ID
 */
router.get("/:id", UserController.getUserById);

/**
 * PUT /users/:id
 * Update user by ID
 */
router.put("/:id", UserController.updateUser);

/**
 * DELETE /users/:id
 * Delete user by ID
 */
router.delete("/:id", UserController.deleteUser);

module.exports = router;
