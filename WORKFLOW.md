# API Workflow Guide

## Meeting Creation Flow (with Conflict Prevention)

```
┌─────────────────────────────────────────────────────────────────┐
│  Client sends: POST /meetings                                   │
│  {                                                              │
│    "userId": 1,                                                │
│    "title": "Team Meeting",                                    │
│    "startTime": "2026-02-11T09:00:00Z",                       │
│    "endTime": "2026-02-11T10:00:00Z"                          │
│  }                                                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  Express Routing                                                 │
│  meetingRoutes.POST → validateRequest middleware                │
│  (applies MeetingInterface schema)                              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  Validation Check        │
            │ - Required fields?       │
            │ - Valid dates?           │
            │ - startTime < endTime?   │
            └──────────────────────────┘
                    │         │
         ✓ Valid    │         │  ✗ Invalid
                    ▼         ▼
               Continue    Return 400
                           "Validation error"
                           │
                           ▼
                       [END]
                       │
┌──────────────────────────────────────────────────────────────────┐
│  MeetingController.createMeeting()                               │
│ - Extract data from request                                      │
│ - Create CreateMeetingDTO                                        │
│ - Call MeetingService.createMeeting(dto)                        │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  MeetingService.createMeeting()                                  │
│ 1. Verify user exists (User.findByPk)                           │
│    └─ If not found: throw Error('User not found')               │
│                                                                  │
│ 2. Call checkTimeSlotConflict(userId, start, end)              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
    ┌──────────────────────────────────────────────────┐
    │  checkTimeSlotConflict()                         │
    │                                                  │
    │  Query Database:                                │
    │  Meeting.findOne({                             │
    │    where: {                                     │
    │      userId: 1,                                │
    │      startTime < NEW.endTime AND               │
    │      endTime > NEW.startTime                   │
    │    }                                            │
    │  })                                             │
    │                                                 │
    │  Indexes used:                                 │
    │  - (userId, startTime)                         │
    │  - Fast lookup                                 │
    └──────────────────────────┬──────────────────────┘
                    │           │
        Found       │           │  Not found
      overlapping   │           │
        meeting     ▼           ▼
                 Conflict    No conflict
                    │           │
                    ▼           ▼
        throw Error         Continue
        'Time slot already   (create meeting)
         booked'
                    │
                    └──────────┬──────────┘
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│  MeetingService.createMeeting() [continued]                      │
│                                                                  │
│  3. If no conflict, create meeting:                             │
│     Meeting.create({                                            │
│       userId: 1,                                                │
│       title: "Team Meeting",                                    │
│       startTime: "2026-02-11T09:00:00Z",                       │
│       endTime: "2026-02-11T10:00:00Z"                          │
│     })                                                          │
│                                                                  │
│  4. Return created meeting object                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│  MeetingController.createMeeting() [continued]                   │
│ - Serialize meeting using MeetingResponseDTO                    │
│ - Return response with status 201                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
            ┌──────────────────────────┐
            │  [SUCCESS RESPONSE]      │
            │  Status: 201             │
            │  {                       │
            │    success: true,        │
            │    message: "Meeting     │
            │      created...",        │
            │    data: {               │
            │      id: 1,              │
            │      userId: 1,          │
            │      title: "...",       │
            │      startTime: "...",   │
            │      endTime: "..."      │
            │    }                     │
            │  }                       │
            └──────────────────────────┘


[IF ERROR OCCURS AT ANY STEP]
                 │
                 ▼
    ┌──────────────────────────────────┐
    │  Error is caught and passed to   │
    │  errorHandler middleware         │
    └────────────┬─────────────────────┘
                 │
         ┌───────┴───────┐
         ▼               ▼
    Special case?    Generic error?
    (Check message)
         │               │
         ▼               ▼
    Map to specific  500 Internal
    HTTP status      Server Error
         │
    ┌────┴─────────────────────────────────┐
    │                                      │
    ▼                                      ▼
"User not found"                      "Time slot already
404                                    booked"
                                       400

    ┌──────────────────────────────┐
    │  [ERROR RESPONSE]            │
    │  {                           │
    │    success: false,           │
    │    message: "..."            │
    │  }                           │
    └──────────────────────────────┘
```

## Meeting Update Flow (Similar, but re-checks conflicts)

```
PUT /meetings/:id
{
  "startTime": "2026-02-11T11:00:00Z",
  "endTime": "2026-02-11T12:00:00Z"
}
    │
    ▼
[Validation]
    │
    ▼
MeetingService.updateMeeting(meetingId, updateDTO)
    │
    ├─ Fetch existing meeting
    │
    └─ If time fields changed:
       │
       └─ checkTimeSlotConflict(
            userId,
            newStart,
            newEnd,
            meetingId  ← IMPORTANT: excludes self!
          )
          │
          ├─ Query with Op.ne: id ≠ meetingId
          │
          └─ Prevents false conflicts
             (meeting conflicting with itself)
    │
    ├─ If conflict found: throw Error
    │
    └─ If no conflict: meeting.update()
       │
       ▼
    Return 200 with updated meeting
```

## Key Query Patterns

### Conflict Detection Query

```javascript
// In MeetingService.checkTimeSlotConflict()
Meeting.findOne({
  where: {
    userId: userId,
    [Op.and]: [
      { startTime: { [Op.lt]: endTime } }, // existing.start < new.end
      { endTime: { [Op.gt]: startTime } }, // existing.end > new.start
    ],
  },
});

// On UPDATE, add:
// where.id = { [Op.ne]: excludeMeetingId }
```

### List with Filters

```javascript
// In MeetingService.listMeetings()
where = {};

if (filters.userId) {
  where.userId = filters.userId;
}

if (filters.startDate) {
  where.startTime = { [Op.gte]: new Date(filters.startDate) };
}

if (filters.endDate) {
  where.endTime = { [Op.lte]: new Date(filters.endDate) };
}

Meeting.findAll({ where, order: [["startTime", "ASC"]] });
```

## Status Code Mapping

```
201 Created              ✓ POST successful
200 OK                   ✓ GET, PUT successful
204 No Content           ✓ DELETE successful
400 Bad Request          ✗ Validation error
                         ✗ Conflict error
                         ✗ Business rule violated
404 Not Found            ✗ Resource not found
500 Internal Error       ✗ Server error
```

## Error Message Examples

| Scenario               | Status | Message                       |
| ---------------------- | ------ | ----------------------------- |
| Valid creation         | 201    | "User created successfully"   |
| Overlapping times      | 400    | "Time slot already booked"    |
| Invalid email format   | 400    | "Email must be a valid email" |
| Missing required field | 400    | "[Field name] is required"    |
| User doesn't exist     | 404    | "User not found"              |
| Meeting doesn't exist  | 404    | "Meeting not found"           |
| Server error           | 500    | "Internal server error"       |

## Conflict Logic Visualization

### Scenario 1: Clear Conflict ✗

```
Existing:  |----[09:00-10:00]----|
New:                |----[09:30-10:30]----|
Result:    CONFLICT (overlap from 09:30-10:00)
```

### Scenario 2: Adjacent Times ✓

```
Existing:  |----[09:00-10:00]----|
New:                              |----[10:00-11:00]----|
Result:    NO CONFLICT (end of existing = start of new)
           (Logic: 09:00 < 11:00 AND 10:00 > 10:00)
           (Last part is FALSE, so no conflict)
```

### Scenario 3: Same User vs Different User ✓

```
User 1:    |----[09:00-10:00]----|
User 2:    |----[09:00-10:00]----|
Result:    NO CONFLICT (conflicts checked per user, not globally)
```

### Scenario 4: Update Excluding Self ✓

```
Existing:  |----[Meeting1: 09:00-10:00]----|
Update:    |----[Meeting1: 10:00-11:00]----|
Result:    NO CONFLICT (Meeting1 excluded from conflict check)
           (Query uses: id ≠ Meeting1.id)
```

## Database Performance

### Without Indexes ✗

- Finding conflicts: O(n) - scans entire meetings table
- List by user: O(n) - scans entire table
- Slow with large datasets

### With Indexes ✓

```
CREATE INDEX idx_user_starttime ON meetings(userId, startTime);
```

- Finding conflicts: O(log n) - binary search
- List by user: O(log n) - B-tree lookup
- Fast even with millions of records

---

**Visual Reference Complete** ✅
Use these flows when debugging or extending the API.
