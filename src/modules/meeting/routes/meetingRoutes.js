const express = require("express");
const MeetingController = require("./MeetingController");
const { validateRequest } = require("../../utils/validators");
const {
  createMeetingSchema,
  updateMeetingSchema,
} = require("../interface/MeetingInterface");

const router = express.Router();

/**
 * POST /meetings
 * Create a new meeting (check for conflicts)
 */
router.post(
  "/",
  validateRequest(createMeetingSchema, "body"),
  MeetingController.createMeeting,
);

/**
 * GET /meetings
 * List meetings with optional filters (userId, startDate, endDate)
 */
router.get("/", MeetingController.listMeetings);

/**
 * GET /meetings/:id
 * Get meeting by ID
 */
router.get("/:id", MeetingController.getMeetingById);

/**
 * PUT /meetings/:id
 * Update meeting by ID (check for conflicts)
 */
router.put(
  "/:id",
  validateRequest(updateMeetingSchema, "body"),
  MeetingController.updateMeeting,
);

/**
 * DELETE /meetings/:id
 * Delete meeting by ID
 */
router.delete("/:id", MeetingController.deleteMeeting);

module.exports = router;
