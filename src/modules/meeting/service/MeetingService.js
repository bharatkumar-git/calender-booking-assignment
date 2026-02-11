const Meeting = require("../model/Meeting");
const User = require("../../user/model/User");
const { Op } = require("sequelize");

class MeetingService {
  /**
   * Check if a time slot conflicts with existing meetings for the same user
   * A conflict exists if: existing.startTime < new.endTime AND existing.endTime > new.startTime
   */
  async checkTimeSlotConflict(
    userId,
    startTime,
    endTime,
    excludeMeetingId = null,
  ) {
    try {
      const query = {
        where: {
          userId: userId,
          [Op.and]: [
            { startTime: { [Op.lt]: new Date(endTime) } },
            { endTime: { [Op.gt]: new Date(startTime) } },
          ],
        },
      };

      // Exclude current meeting when updating
      if (excludeMeetingId) {
        query.where.id = { [Op.ne]: excludeMeetingId };
      }

      const conflictingMeeting = await Meeting.findOne(query);
      return conflictingMeeting;
    } catch (error) {
      throw error;
    }
  }

  async createMeeting(createMeetingDTO) {
    try {
      // Verify user exists
      const user = await User.findByPk(createMeetingDTO.userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Check for time slot conflicts
      const conflict = await this.checkTimeSlotConflict(
        createMeetingDTO.userId,
        createMeetingDTO.startTime,
        createMeetingDTO.endTime,
      );

      if (conflict) {
        throw new Error("Time slot already booked");
      }

      // Create meeting
      const meeting = await Meeting.create({
        userId: createMeetingDTO.userId,
        title: createMeetingDTO.title,
        startTime: createMeetingDTO.startTime,
        endTime: createMeetingDTO.endTime,
      });

      return meeting;
    } catch (error) {
      throw error;
    }
  }

  async getMeetingById(meetingId) {
    try {
      const meeting = await Meeting.findByPk(meetingId, {
        include: [{ model: User, attributes: ["id", "name", "email"] }],
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      return meeting;
    } catch (error) {
      throw error;
    }
  }

  async listMeetings(filters = {}) {
    try {
      const where = {};

      if (filters.userId) {
        where.userId = filters.userId;
      }

      if (filters.startDate || filters.endDate) {
        where.startTime = {};

        if (filters.startDate) {
          where.startTime[Op.gte] = new Date(filters.startDate);
        }

        if (filters.endDate) {
          if (!where.startTime[Op.lte]) {
            where.startTime[Op.lte] = new Date(filters.endDate);
          } else {
            where.endTime = { [Op.lte]: new Date(filters.endDate) };
          }
        }
      }

      const meetings = await Meeting.findAll({
        where,
        include: [{ model: User, attributes: ["id", "name", "email"] }],
        order: [["startTime", "ASC"]],
      });

      return meetings;
    } catch (error) {
      throw error;
    }
  }

  async updateMeeting(meetingId, updateMeetingDTO) {
    try {
      const meeting = await Meeting.findByPk(meetingId);

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // If startTime or endTime is being updated, check for conflicts
      if (updateMeetingDTO.startTime || updateMeetingDTO.endTime) {
        const startTime = updateMeetingDTO.startTime || meeting.startTime;
        const endTime = updateMeetingDTO.endTime || meeting.endTime;

        const conflict = await this.checkTimeSlotConflict(
          meeting.userId,
          startTime,
          endTime,
          meetingId, // Exclude current meeting
        );

        if (conflict) {
          throw new Error("Time slot already booked");
        }
      }

      await meeting.update(updateMeetingDTO);
      return meeting;
    } catch (error) {
      throw error;
    }
  }

  async deleteMeeting(meetingId) {
    try {
      const meeting = await Meeting.findByPk(meetingId);

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      await meeting.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new MeetingService();
