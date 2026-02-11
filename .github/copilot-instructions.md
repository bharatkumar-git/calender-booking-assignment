# Copilot Instructions for Calendar Booking Service

## Project Overview

This is a **Calendar Booking Service** - a REST API built with **Node.js + Express + MySQL + Sequelize** that manages users and meetings while preventing time slot conflicts.

**Key Challenge**: The core feature is preventing overlapping meeting times for the same user using the conflict formula: `existing.start < new.end AND existing.end > new.start`

## Architecture & Key Patterns

### Layered Module Structure

```
modules/
├── user/ & meeting/
    ├── model/          # Sequelize models (define DB schema)
    ├── dto/            # Data transfer objects (serialize responses)
    ├── interface/      # Joi validation schemas
    ├── service/        # Business logic (conflict detection here)
    └── routes/         # Controllers + express routes
```

**Important**: Services contain all business logic. Controllers only handle HTTP concerns. This separation keeps conflict detection logic reusable and testable.

### Conflict Detection Algorithm

Located in `src/modules/meeting/service/MeetingService.js` - `checkTimeSlotConflict()`:

- Checks ONLY for the same user (important distinction from global booking)
- Uses Sequelize `Op.lt` and `Op.gt` operators for date comparisons
- **Critical on UPDATE**: Must exclude the current meeting ID using `Op.ne`

```javascript
// Conflict pattern (must match exactly)
existing.startTime < new.endTime AND existing.endTime > new.startTime
```

### Database Indexes

Essential for performance:

- `(userId, startTime)` - Primary query path for conflict detection
- `(startTime, endTime)` - Fallback range queries
  Without these, conflict checks on large datasets become O(n).

## Critical Developer Workflows

### Start Development

```bash
npm install
# Configure .env with MySQL credentials
npm run dev  # Uses nodemon for auto-reload
```

### Database Setup

- Sequelize auto-syncs schema on startup (`sequelize.sync()` in app.js)
- No manual migrations needed for this project
- Cascading deletes configured: deleting user deletes all their meetings

### Testing Conflict Prevention

```bash
# Terminal 1: Start server
npm start

# Terminal 2: Run test suite
node tests/api.test.js
```

Tests cover:

1. Valid non-overlapping meetings ✓
2. Overlapping prevention ✓
3. Same user conflicts vs different user non-conflicts ✓
4. Update with conflict re-checking ✓
5. Edge cases (adjacent times: 09:00-10:00 then 10:00-11:00 = no conflict) ✓

## Project-Specific Conventions

### Error Handling Pattern

Global middleware in `src/middlewares/errorHandler.js` translates service errors:

- Service throws `Error('User not found')` → Middleware maps to 404
- Service throws `Error('Time slot already booked')` → Middleware maps to 400

**Pattern**: Services throw descriptive errors; middleware translates to HTTP codes. This keeps services framework-agnostic.

### Validation Pattern

Uses Joi schemas in `interface/` files:

- Input validation happens in route middleware via `validateRequest(schema, 'body')`
- Custom Joi validator checks `startTime < endTime`
- Fails fast: validation errors return 400 before touching business logic

### DTO Usage Pattern

All responses use DTOs (e.g., `UserResponseDTO`):

```javascript
// Controllers return DTOs, not raw models
const userResponse = new UserResponseDTO(user);
res.status(201).json({ success: true, data: userResponse });
```

This ensures API never leaks internal fields and controls response shape.

## Integration Points & Data Flow

### Creating a Meeting (Full Flow)

1. **Route** (`POST /meetings`) validates input via Joi schema
2. **Controller** receives validated data, creates DTO
3. **Service** receives DTO, calls `checkTimeSlotConflict(userId, startTime, endTime)`
4. **Conflict Check** queries DB for overlapping meetings for same user
5. If conflict exists, throws `Error('Time slot already booked')`
6. If no conflict, creates meeting via Sequelize model
7. **Controller** serializes response using DTO
8. **Middleware** catches any service errors and maps to HTTP responses

### Key Query Pattern (Conflict Detection)

```javascript
Meeting.findOne({
  where: {
    userId: userId,
    [Op.and]: [
      { startTime: { [Op.lt]: endTime } },
      { endTime: { [Op.gt]: startTime } },
    ],
  },
});
```

## External Dependencies

- **Sequelize**: ORM for MySQL - handles schema sync, associations, queries
- **Express**: Web framework - routing, middleware, request handling
- **Joi**: Validation - schema definition and error reporting
- **MySQL2**: Driver - connection pooling, prepared statements
- **Dotenv**: Config management - reads .env file

## Common Implementation Patterns

### Adding a New Field to User

1. Update `User.js` model with new DataType
2. Update `UserInterface.js` Joi schema for validation
3. Update `UserDTO.js` to include in response
4. Restart server (Sequelize auto-syncs)

### Filtering Meetings by New Criteria

1. Add filter parameter handling in `MeetingController.listMeetings()`
2. Add to Sequelize `where` clause in `MeetingService.listMeetings()`
3. Add Joi validation in `MeetingInterface.js` if needed

### Adding Constraints (e.g., max meeting duration)

1. Add validation in `MeetingInterface.js` schema
2. Add business logic check in `MeetingService` before create/update
3. Throw descriptive error that middleware will map to 400

## Avoiding Common Pitfalls

### ⚠️ Conflict Detection Mistakes

- **Wrong**: Checking all meetings globally (should be per-user)
- **Wrong**: Forgetting to exclude current meeting ID on UPDATE
- **Wrong**: Comparing ISO strings instead of Date objects (Sequelize handles this)
- **Wrong**: Using `<=` or `>=` in overlap logic (endpoints should be exclusive)

### ⚠️ Database Performance Issues

- Missing indexes on (userId, startTime) will make conflict checks O(n)
- Sequelize eager loading of User on each meeting query without index
- Not using prepared statements (MySQL2 does this by default)

### ⚠️ API Contract Issues

- Returning raw Sequelize model instead of DTO leaks `updatedAt` fields
- Not validating `startTime < endTime` before DB query
- Returning 500 instead of 400 for validation errors (middleware prevents this)

## Testing Strategy

The test file (`tests/api.test.js`) uses a simple HTTP client and tests:

1. **CRUD operations** for users and meetings
2. **Conflict prevention** - the core feature
3. **Edge cases** - adjacent times, same user vs different users
4. **Error scenarios** - invalid email, missing fields, non-existent resources
5. **Update validation** - moving meetings with conflict re-check

Each test is independent and can be run in any order. The test file sets global IDs to link tests together.

## Key Files for Different Tasks

| Task                            | Primary File                            | Supporting Files                                                           |
| ------------------------------- | --------------------------------------- | -------------------------------------------------------------------------- |
| Add new meeting validation rule | `meeting/interface/MeetingInterface.js` | `meeting/service/MeetingService.js`                                        |
| Fix conflict detection bug      | `meeting/service/MeetingService.js`     | `meeting/model/Meeting.js`, `tests/api.test.js`                            |
| Change API response format      | `meeting/dto/MeetingDTO.js`             | `meeting/routes/MeetingController.js`                                      |
| Add new endpoint                | `meeting/routes/meetingRoutes.js`       | `meeting/routes/MeetingController.js`, `meeting/service/MeetingService.js` |
| Optimize DB queries             | `meeting/model/Meeting.js`              | `config/database.js`                                                       |
| Handle new error type           | `middlewares/errorHandler.js`           | `*/service/*.js`                                                           |

## Environment & Setup

- **Node Version**: v14+
- **Database**: MySQL 5.7+
- **Port**: 3000 (configurable via PORT in .env)
- **UTC Time**: All timestamps are UTC ISO format (no timezone conversion needed)

Run with:

```bash
npm start       # Production
npm run dev     # Development with auto-reload
```

Debug with:

```bash
DEBUG=* npm start  # Sequelize debug logging
```

---

**Last Updated**: February 2026  
**AI Agent Focus**: Understand the conflict detection algorithm and layered architecture before making changes
