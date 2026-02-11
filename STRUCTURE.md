# Project Directory Structure

```
calendar-booking-assignment/
│
├── src/                                    # Main application code
│   ├── app.js                             # Express app initialization & server startup
│   │
│   ├── config/
│   │   └── database.js                    # Sequelize connection configuration
│   │
│   ├── middlewares/
│   │   └── errorHandler.js                # Global error handling & 404 handler
│   │
│   └── modules/                           # Feature modules
│       ├── user/
│       │   ├── model/
│       │   │   └── User.js                # User Sequelize model with email uniqueness
│       │   ├── dto/
│       │   │   └── UserDTO.js             # CreateUserDTO, UserResponseDTO
│       │   ├── interface/
│       │   │   └── UserInterface.js       # Joi validation schemas
│       │   ├── service/
│       │   │   └── UserService.js         # User business logic
│       │   └── routes/
│       │       ├── UserController.js      # Request handlers (CRUD)
│       │       └── userRoutes.js          # Express route definitions
│       │
│       ├── meeting/
│       │   ├── model/
│       │   │   └── Meeting.js             # Meeting model with userId FK
│       │   │                              # Association: User.hasMany(Meeting)
│       │   ├── dto/
│       │   │   └── MeetingDTO.js          # Create/Update/ResponseDTO
│       │   ├── interface/
│       │   │   └── MeetingInterface.js    # Joi schemas with time validation
│       │   ├── service/
│       │   │   └── MeetingService.js      # Meeting logic + conflict detection
│       │   │                              # Key: checkTimeSlotConflict()
│       │   └── routes/
│       │       ├── MeetingController.js   # Request handlers (CRUD)
│       │       └── meetingRoutes.js       # Express route definitions
│       │
│       └── utils/
│           └── validators.js              # Validation middleware helper
│
├── tests/
│   └── api.test.js                        # Comprehensive API test suite
│                                          # Tests: Users, Meetings, Conflicts, Edge cases
│
├── .env                                   # Environment variables (gitignored)
│   │                                      # DB_HOST, DB_PORT, DB_NAME, DB_USER, etc.
│
├── .gitignore                             # Git ignore rules
├── package.json                           # Dependencies & scripts
├── README.md                              # Complete API documentation
├── QUICK-START.md                         # Quick reference guide
│
└── .github/
    └── copilot-instructions.md            # AI Agent guidelines
```

## Module Breakdown

### User Module

**Purpose**: Manage user accounts

**Files**:

- `User.js` - Schema with email uniqueness constraint
- `UserDTO.js` - Serialization for responses
- `UserInterface.js` - Email validation, required fields
- `UserService.js` - CRUD operations
- `UserController.js` - HTTP request handling
- `userRoutes.js` - Route definitions

**Endpoints**:

- `POST /users` - Create
- `GET /users/:id` - Fetch one
- `GET /users` - Fetch all
- `PUT /users/:id` - Update
- `DELETE /users/:id` - Delete

### Meeting Module

**Purpose**: Manage meetings with conflict prevention

**Files**:

- `Meeting.js` - Schema with userId FK, indexes for conflict detection
- `MeetingDTO.js` - Serialization for responses
- `MeetingInterface.js` - Time range validation
- `MeetingService.js` - Core logic including `checkTimeSlotConflict()`
- `MeetingController.js` - HTTP request handling
- `meetingRoutes.js` - Route definitions

**Key Algorithm** (in `MeetingService.js`):

```javascript
// Conflicts exist if ranges overlap
existing.startTime < new.endTime AND existing.endTime > new.startTime

// Checked on:
// - POST /meetings (create)
// - PUT /meetings/:id (update)

// Only for:
// - Same userId (per-user conflicts)
// - Current meeting excluded on update (Op.ne)
```

**Endpoints**:

- `POST /meetings` - Create (with conflict check)
- `GET /meetings/:id` - Fetch one
- `GET /meetings` - List with filters (userId, startDate, endDate)
- `PUT /meetings/:id` - Update (with conflict re-check)
- `DELETE /meetings/:id` - Delete

## Data Flow Examples

### Create Meeting Flow

```
1. POST /meetings → meetingRoutes.js
2. Validation middleware validates against MeetingInterface schema
3. → MeetingController.createMeeting()
4. → MeetingService.createMeeting()
5. → checkTimeSlotConflict(userId, startTime, endTime)
   └─ Queries Meeting.findOne() with Op.lt & Op.gt
6. If conflict: throw Error('Time slot already booked')
7. Else: Meeting.create() → save to DB
8. MeetingDTO serializes response
9. Controller returns 201 with data
10. (If error: errorHandler catches, maps to HTTP status)
```

### Update Meeting Flow

```
1. PUT /meetings/:id → meetingRoutes.js
2. Validation middleware validates UpdateMeetingDTO
3. → MeetingController.updateMeeting()
4. → MeetingService.updateMeeting(meetingId, updateData)
5. If startTime/endTime changed:
   → checkTimeSlotConflict(userId, newStart, newEnd, meetingId)
   └─ Note: excludeMeetingId = meetingId (don't check against self)
6. If conflict: throw Error
7. Else: meeting.update() → save changes
8. Return 200 with updated meeting
```

## Important Relationships

### User ↔ Meeting

- `User.hasMany(Meeting, { onDelete: 'CASCADE' })`
- `Meeting.belongsTo(User)`
- **Implication**: Deleting a user deletes all their meetings

### Models ↔ DTOs

- Models: Database schema (Sequelize)
- DTOs: API contract (what clients see)
- **Pattern**: Never return raw Sequelize model in response

### Services ↔ Controllers

- Services: Business logic (reusable, testable)
- Controllers: HTTP concerns (status codes, headers)
- **Pattern**: Controllers call services, services throw errors

### Interfaces ↔ Routes

- Interfaces: Joi validation schemas
- Routes: Validation middleware applies schemas
- **Pattern**: validateRequest(schema, 'body') on route

## Configuration Files

### .env

```
DB_HOST=localhost
DB_PORT=3306
DB_NAME=calendar_booking
DB_USER=root
DB_PASSWORD=root
NODE_ENV=development
PORT=3000
```

### .gitignore

- `node_modules/`
- `.env`
- `*.log`

### package.json

- Dependencies: express, sequelize, mysql2, joi, cors, dotenv
- Dev dependencies: nodemon
- Scripts: start, dev, db:migrate

## Database Indexes

Essential for performance:

```sql
-- Meeting table indexes
CREATE INDEX idx_user_starttime ON meetings(userId, startTime);
CREATE INDEX idx_starttime_endtime ON meetings(startTime, endTime);

-- User table indexes
CREATE UNIQUE INDEX idx_email ON users(email);
```

These are automatically created by Sequelize model definitions.

## Common File Modifications

### To add a new validation rule

Edit: `src/modules/{module}/interface/{Module}Interface.js`

- Add new Joi field
- Add custom validators if needed
- Validation runs automatically in middleware

### To add a new filter to list endpoint

Edit: `src/modules/{module}/service/{Module}Service.js`

- Add filter logic in `list{Module}s()` method
- Add Sequelize `where` clause conditions
- Edit `{Module}Interface.js` if validation needed

### To add a new business rule

Edit: `src/modules/{module}/service/{Module}Service.js`

- Add logic before/after DB operation
- Throw descriptive error if rule violated
- Error will be caught by errorHandler middleware

### To change API response format

Edit: `src/modules/{module}/dto/{Module}DTO.js`

- Add/remove fields
- Controller automatically uses DTO for serialization

## Testing

### Run All Tests

```bash
node tests/api.test.js
```

### Test Coverage

- ✓ User CRUD
- ✓ Meeting CRUD
- ✓ Conflict prevention
- ✓ Edge cases (adjacent times)
- ✓ Error scenarios
- ✓ Validation errors
- ✓ 404 responses

Each test is independent and tests one specific behavior.

---

**Total Files**: ~25 files
**Lines of Code**: ~1500 lines
**Core Logic**: MeetingService.checkTimeSlotConflict() (≈20 lines)
