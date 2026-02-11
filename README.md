# Calendar Booking Service

A REST API backend for scheduling meetings with automatic conflict prevention.

## Features

- **User Management**: Create and manage users with email uniqueness
- **Meeting Management**: Create, read, update, and delete meetings
- **Conflict Prevention**: Automatically prevents overlapping meeting times
- **Advanced Filtering**: Filter meetings by user, date range
- **Clean Architecture**: Organized by modules (User, Meeting) with clear separation of concerns

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Validation**: Joi

## Project Structure

```
src/
├── app.js                           # Main application entry point
├── config/
│   └── database.js                  # Database connection setup
├── middlewares/
│   └── errorHandler.js              # Global error handling & validation middleware
├── modules/
│   ├── user/
│   │   ├── model/
│   │   │   └── User.js              # User Sequelize model
│   │   ├── routes/
│   │   │   ├── UserController.js    # User request handlers
│   │   │   └── userRoutes.js        # User routes
│   │   ├── service/
│   │   │   └── UserService.js       # Business logic for users
│   │   ├── interface/
│   │   │   └── UserInterface.js     # Validation schemas
│   │   └── dto/
│   │       └── UserDTO.js           # Data transfer objects
│   ├── meeting/
│   │   ├── model/
│   │   │   └── Meeting.js           # Meeting Sequelize model
│   │   ├── routes/
│   │   │   ├── MeetingController.js # Meeting request handlers
│   │   │   └── meetingRoutes.js     # Meeting routes
│   │   ├── service/
│   │   │   └── MeetingService.js    # Business logic for meetings (conflict detection)
│   │   ├── interface/
│   │   │   └── MeetingInterface.js  # Validation schemas
│   │   └── dto/
│   │       └── MeetingDTO.js        # Data transfer objects
│   └── utils/
│       └── validators.js             # Validation middleware utility
├── .env                             # Environment variables
└── package.json                     # Dependencies
```

## Setup Instructions

### Prerequisites

- Node.js (v14+)
- MySQL (v5.7+)
- npm or yarn

### Installation

1. **Clone/extract the project**

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Edit `.env` file:

   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=calendar_booking
   DB_USER=root
   DB_PASSWORD=root
   NODE_ENV=development
   PORT=3000
   ```

4. **Create MySQL database**

   ```sql
   CREATE DATABASE calendar_booking;
   ```

5. **Start the server**

   ```bash
   npm start
   ```

   For development with auto-reload:

   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## API Endpoints

### Users

#### Create User

```bash
POST /users
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Success Response (201)**:

```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2026-02-11T10:00:00.000Z",
    "updatedAt": "2026-02-11T10:00:00.000Z"
  }
}
```

#### Get User by ID

```bash
GET /users/:id
```

**Success Response (200)**: Returns user object

#### Get All Users

```bash
GET /users
```

#### Update User

```bash
PUT /users/:id
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com"
}
```

#### Delete User

```bash
DELETE /users/:id
```

**Success Response (204)**: Empty response

---

### Meetings

#### Create Meeting

```bash
POST /meetings
Content-Type: application/json

{
  "userId": 1,
  "title": "Team Standup",
  "startTime": "2026-02-11T09:00:00.000Z",
  "endTime": "2026-02-11T09:30:00.000Z"
}
```

**Success Response (201)**: Returns created meeting

**Error Response (400)** - Time slot already booked:

```json
{
  "success": false,
  "message": "Time slot already booked"
}
```

#### List Meetings

```bash
GET /meetings
GET /meetings?userId=1
GET /meetings?startDate=2026-02-11T00:00:00.000Z&endDate=2026-02-12T00:00:00.000Z
GET /meetings?userId=1&startDate=2026-02-11T00:00:00.000Z
```

**Query Parameters**:

- `userId` (optional): Filter by user ID
- `startDate` (optional): Filter meetings starting from this date (ISO format)
- `endDate` (optional): Filter meetings until this date (ISO format)

**Success Response (200)**: Returns array of meetings

#### Get Meeting by ID

```bash
GET /meetings/:id
```

**Success Response (200)**: Returns meeting object

#### Update Meeting

```bash
PUT /meetings/:id
Content-Type: application/json

{
  "title": "Updated Meeting",
  "startTime": "2026-02-11T10:00:00.000Z",
  "endTime": "2026-02-11T10:30:00.000Z"
}
```

**Note**: All fields are optional. Conflict check is performed if startTime or endTime is being updated.

#### Delete Meeting

```bash
DELETE /meetings/:id
```

**Success Response (204)**: Empty response

---

## Conflict Prevention Logic

When creating or updating a meeting, the system checks for overlaps:

```
Conflict exists if:
  existing.startTime < new.endTime
  AND
  existing.endTime > new.startTime
```

**Example**:

```
Existing: 09:00 - 10:00
New:      09:30 - 10:30  ❌ Conflict (overlaps from 09:30-10:00)

Existing: 09:00 - 10:00
New:      10:00 - 11:00  ✅ No conflict (starts exactly when existing ends)

Existing: 09:00 - 10:00
New:      08:00 - 09:00  ✅ No conflict (ends exactly when existing starts)
```

## Validation Rules

- **Email**: Must be unique and valid email format
- **User Name**: Required string
- **Meeting Title**: Required string
- **Start Time**: Must be a valid ISO datetime
- **End Time**: Must be a valid ISO datetime
- **Time Range**: startTime must be strictly before endTime

## Error Responses

| Error                    | Status | Response                                                               |
| ------------------------ | ------ | ---------------------------------------------------------------------- |
| Invalid request body     | 400    | `{ "success": false, "message": "Validation error", "errors": [...] }` |
| Time slot already booked | 400    | `{ "success": false, "message": "Time slot already booked" }`          |
| User not found           | 404    | `{ "success": false, "message": "User not found" }`                    |
| Meeting not found        | 404    | `{ "success": false, "message": "Meeting not found" }`                 |
| Email already exists     | 400    | `{ "success": false, "message": "Email already exists" }`              |

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);
```

### Meetings Table

```sql
CREATE TABLE meetings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  startTime DATETIME NOT NULL,
  endTime DATETIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_starttime (userId, startTime),
  INDEX idx_starttime_endtime (startTime, endTime)
);
```

## Architecture

### Clean Layered Architecture

1. **Routes Layer** (`routes/`): Express route definitions
2. **Controller Layer** (`routes/Controller.js`): Request/response handling
3. **Service Layer** (`service/`): Business logic & conflict detection
4. **Model Layer** (`model/`): Sequelize models & database interactions
5. **DTO Layer** (`dto/`): Data serialization/deserialization
6. **Validation Layer** (`interface/`): Input validation schemas

### Key Design Decisions

- **DTOs**: Ensure API responses only include necessary fields
- **Services**: Centralized business logic, including conflict detection
- **Validators**: Joi schemas for comprehensive input validation
- **Error Handling**: Global middleware catches all errors and returns consistent responses
- **Indexes**: Database indexes on userId+startTime and startTime+endTime for efficient queries

## Testing the API

### Using cURL

```bash
# Create a user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'

# Create a meeting
curl -X POST http://localhost:3000/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Meeting 1",
    "startTime": "2026-02-11T09:00:00.000Z",
    "endTime": "2026-02-11T10:00:00.000Z"
  }'

# Try to create overlapping meeting (should fail)
curl -X POST http://localhost:3000/meetings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "title": "Meeting 2",
    "startTime": "2026-02-11T09:30:00.000Z",
    "endTime": "2026-02-11T10:30:00.000Z"
  }'

# List meetings
curl http://localhost:3000/meetings

# List meetings for specific user
curl "http://localhost:3000/meetings?userId=1"
```

### Using Postman

1. Import the endpoints from this README
2. Create a collection with folder structure for Users and Meetings
3. Save requests with example payloads
4. Test the full flow: Create User → Create Meeting → List → Update → Delete

## Common Issues

### Database Connection Failed

- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database name exists

### Port Already in Use

- Change PORT in `.env`
- Or kill the process: `lsof -ti:3000 | xargs kill -9` (Linux/Mac)

### Conflicting Meetings Not Prevented

- Ensure times are in UTC ISO format
- Check that both startTime and endTime are provided when creating
- Verify the meeting is for the same user

## License

MIT
