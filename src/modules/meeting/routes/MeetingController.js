const MeetingService = require("../service/MeetingService");
const {
  CreateMeetingDTO,
  UpdateMeetingDTO,
  MeetingResponseDTO,
} = require("../dto/MeetingDTO");

class MeetingController {
  async createMeeting(req, res, next) {
    try {
      const createMeetingDTO = new CreateMeetingDTO(req.body);
      const meeting = await MeetingService.createMeeting(createMeetingDTO);
      const meetingResponse = new MeetingResponseDTO(meeting);

      return res.status(201).json({
        success: true,
        message: "Meeting created successfully",
        data: meetingResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMeetingById(req, res, next) {
    try {
      const meetingId = parseInt(req.params.id, 10);
      const meeting = await MeetingService.getMeetingById(meetingId);
      const meetingResponse = new MeetingResponseDTO(meeting);

      return res.status(200).json({
        success: true,
        data: meetingResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async listMeetings(req, res, next) {
    try {
      const filters = {};

      if (req.query.userId) {
        filters.userId = parseInt(req.query.userId, 10);
      }

      if (req.query.startDate) {
        filters.startDate = req.query.startDate;
      }

      if (req.query.endDate) {
        filters.endDate = req.query.endDate;
      }

      const meetings = await MeetingService.listMeetings(filters);
      const meetingsResponse = meetings.map(
        (meeting) => new MeetingResponseDTO(meeting),
      );

      return res.status(200).json({
        success: true,
        data: meetingsResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateMeeting(req, res, next) {
    try {
      const meetingId = parseInt(req.params.id, 10);
      const updateMeetingDTO = new UpdateMeetingDTO(req.body);
      const meeting = await MeetingService.updateMeeting(
        meetingId,
        updateMeetingDTO,
      );
      const meetingResponse = new MeetingResponseDTO(meeting);

      return res.status(200).json({
        success: true,
        message: "Meeting updated successfully",
        data: meetingResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteMeeting(req, res, next) {
    try {
      const meetingId = parseInt(req.params.id, 10);
      await MeetingService.deleteMeeting(meetingId);

      return res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MeetingController();
