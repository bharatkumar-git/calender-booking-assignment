// Meeting DTOs

class CreateMeetingDTO {
  constructor(data) {
    this.userId = data.userId;
    this.title = data.title;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
  }
}

class UpdateMeetingDTO {
  constructor(data) {
    this.title = data.title;
    this.startTime = data.startTime;
    this.endTime = data.endTime;
  }
}

class MeetingResponseDTO {
  constructor(meeting) {
    this.id = meeting.id;
    this.userId = meeting.userId;
    this.title = meeting.title;
    this.startTime = meeting.startTime;
    this.endTime = meeting.endTime;
    this.createdAt = meeting.createdAt;
    this.updatedAt = meeting.updatedAt;
  }
}

module.exports = {
  CreateMeetingDTO,
  UpdateMeetingDTO,
  MeetingResponseDTO,
};
