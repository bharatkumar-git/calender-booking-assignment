# Quick Start Guide

## One-Time Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure database in .env
# Ensure MySQL is running and create database:
# CREATE DATABASE calendar_booking;

# 3. Start server
npm start
```

Server runs on `http://localhost:3000`

## Running Tests

```bash
# In separate terminal after server starts
node tests/api.test.js
```

## File Location Reference

### Core Business Logic

- **Conflict Detection**: `src/modules/meeting/service/MeetingService.js` (function: `checkTimeSlotConflict`)
- **Database Models**: `src/modules/{user,meeting}/model/`
- **Validation Rules**: `src/modules/{user,meeting}/interface/`

### API Layer

- **Routes**: `src/modules/{user,meeting}/routes/userRoutes.js` or `meetingRoutes.js`
- **Controllers**: `src/modules/{user,meeting}/routes/{User,Meeting}Controller.js`

### Support

- **Error Handling**: `src/middlewares/errorHandler.js`
- **Database Config**: `src/config/database.js`

## API Command Examples

### Users

```bash
# Create user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com"}'

# Get user
curl http://localhost:3000/users/1

# List all users
curl http://localhost:3000/users
```

### Meetings

```bash
# Create meeting
curl -X POST http://localhost:3000/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Meeting",
    "startTime": "2026-02-11T09:00:00Z",
    "endTime": "2026-02-11T10:00:00Z"
  }'

# List meetings with filters
curl "http://localhost:3000/meetings?userId=1&startDate=2026-02-11T00:00:00Z"

# Update meeting
curl -X PUT http://localhost:3000/meetings/1 \
  -H "Content-Type: application/json" \
  -d '{"title":"Updated"}'

# Delete meeting
curl -X DELETE http://localhost:3000/meetings/1
```

## Important Concepts

### Conflict Logic

Two meetings conflict if:

```
existing.startTime < new.endTime AND existing.endTime > new.startTime
```

**Example**: 09:00-10:00 conflicts with 09:30-10:30 ✗  
**But**: 09:00-10:00 doesn't conflict with 10:00-11:00 ✓

### Per-User Conflicts

Conflicts are checked PER USER. User A and User B can have overlapping meetings.

### Updates Require Re-checking

When updating a meeting's time, the system re-checks for conflicts (excluding the current meeting).

## Troubleshooting

| Problem                                | Solution                                                           |
| -------------------------------------- | ------------------------------------------------------------------ |
| "Cannot connect to database"           | Ensure MySQL is running, check DB_HOST/DB_USER/DB_PASSWORD in .env |
| "Port 3000 already in use"             | Change PORT in .env or kill existing process                       |
| Meeting time conflicts not prevented   | Ensure times are ISO format (e.g., `2026-02-11T09:00:00.000Z`)     |
| Can't create user with duplicate email | Email must be unique; use different email or delete previous user  |

## Response Format

### Success Response

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    /* resource */
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Time slot already booked"
}
```

### Validation Error

```json
{
  "success": false,
  "message": "Validation error",
  "errors": ["Email must be a valid email"]
}
```

## HTTP Status Codes

- **201**: Created successfully
- **200**: Success (fetch, update)
- **204**: Success (delete) - empty response
- **400**: Validation or business rule error (e.g., conflicting times)
- **404**: Resource not found
- **500**: Server error

## Database Schema

### Users

- `id` (PK, auto-increment)
- `name` (string, required)
- `email` (string, unique, required)
- `createdAt`, `updatedAt` (auto)

### Meetings

- `id` (PK, auto-increment)
- `userId` (FK → users, CASCADE delete)
- `title` (string, required)
- `startTime` (datetime, required)
- `endTime` (datetime, required)
- `createdAt`, `updatedAt` (auto)

Indexes:

- `(userId, startTime)` - Fast conflict detection
- `(startTime, endTime)` - Range queries

## Making Code Changes

### Add new validation rule for meetings

1. Edit `src/modules/meeting/interface/MeetingInterface.js`
2. Add to Joi schema
3. Restart server

### Fix a bug in conflict detection

1. Edit `src/modules/meeting/service/MeetingService.js` - `checkTimeSlotConflict()`
2. Add test case to `tests/api.test.js`
3. Run tests to verify: `node tests/api.test.js`

### Add new API endpoint

1. Add route to `src/modules/{module}/routes/{module}Routes.js`
2. Add controller method to `src/modules/{module}/routes/{Module}Controller.js`
3. Add service method to `src/modules/{module}/service/{Module}Service.js`
4. Add validation schema to `src/modules/{module}/interface/`
5. Update `README.md` with endpoint docs

## Architecture Overview

```
Request → Express Routes
         → Validation Middleware (Joi)
         → Controller
         → DTO (input validation)
         → Service (business logic)
         → Sequelize Model (DB queries)
         → Response DTO
         → Error Middleware (if error)
         → JSON Response
```

Key principle: **Routes → Controllers → Services → Models**

Controllers handle HTTP. Services handle logic. Models handle data.
