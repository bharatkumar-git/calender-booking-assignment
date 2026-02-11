/**
 * API Test Cases
 * Run these after starting the server: npm start
 * Then execute: node tests/api.test.js
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

// Helper function to make HTTP requests
function makeRequest(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        "Content-Type": "application/json",
      },
    };

    const req = http.request(options, (res) => {
      let body = "";

      res.on("data", (chunk) => {
        body += chunk;
      });

      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({
            status: res.statusCode,
            body: parsed,
            headers: res.headers,
          });
        } catch (e) {
          resolve({ status: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test cases
const tests = [];

function test(name, fn) {
  tests.push({ name, fn });
}

// ==================== USER TESTS ====================

test("Create User 1", async () => {
  const res = await makeRequest("POST", "/users", {
    name: "John Doe",
    email: "john@example.com",
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  console.assert(res.body.success === true, "Success should be true");
  console.assert(res.body.data.id, "User should have ID");
  global.userId1 = res.body.data.id;
  console.log("✓ User 1 created:", res.body.data.id);
});

test("Create User 2", async () => {
  const res = await makeRequest("POST", "/users", {
    name: "Jane Smith",
    email: "jane@example.com",
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  global.userId2 = res.body.data.id;
  console.log("✓ User 2 created:", res.body.data.id);
});

test("Get User by ID", async () => {
  const res = await makeRequest("GET", `/users/${global.userId1}`);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.email === "john@example.com", "Email mismatch");
  console.log("✓ User fetched:", res.body.data.name);
});

test("Get All Users", async () => {
  const res = await makeRequest("GET", "/users");
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.length >= 2, "Should have at least 2 users");
  console.log("✓ All users fetched:", res.body.data.length);
});

test("Duplicate Email Should Fail", async () => {
  const res = await makeRequest("POST", "/users", {
    name: "Duplicate User",
    email: "john@example.com",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.assert(
    res.body.message.includes("exists"),
    "Should mention email exists",
  );
  console.log("✓ Duplicate email prevented");
});

// ==================== MEETING TESTS ====================

test("Create Meeting 1 (User 1, 09:00-10:00)", async () => {
  const res = await makeRequest("POST", "/meetings", {
    userId: global.userId1,
    title: "Team Standup",
    startTime: "2026-02-11T09:00:00.000Z",
    endTime: "2026-02-11T10:00:00.000Z",
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  console.assert(res.body.data.id, "Meeting should have ID");
  global.meeting1Id = res.body.data.id;
  console.log("✓ Meeting 1 created:", res.body.data.id);
});

test("Create Meeting 2 (User 1, 10:00-11:00 - No conflict)", async () => {
  const res = await makeRequest("POST", "/meetings", {
    userId: global.userId1,
    title: "Client Call",
    startTime: "2026-02-11T10:00:00.000Z",
    endTime: "2026-02-11T11:00:00.000Z",
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  global.meeting2Id = res.body.data.id;
  console.log("✓ Meeting 2 created (no conflict):", res.body.data.id);
});

test("Create Meeting 3 (User 2, 09:00-10:00 - Different user, no conflict)", async () => {
  const res = await makeRequest("POST", "/meetings", {
    userId: global.userId2,
    title: "One-on-one",
    startTime: "2026-02-11T09:00:00.000Z",
    endTime: "2026-02-11T10:00:00.000Z",
  });
  console.assert(res.status === 201, `Expected 201, got ${res.status}`);
  global.meeting3Id = res.body.data.id;
  console.log("✓ Meeting 3 created (different user):", res.body.data.id);
});

test("Overlapping Meeting Should Fail (09:30-10:30)", async () => {
  const res = await makeRequest("POST", "/meetings", {
    userId: global.userId1,
    title: "Overlapping Meeting",
    startTime: "2026-02-11T09:30:00.000Z",
    endTime: "2026-02-11T10:30:00.000Z",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.assert(
    res.body.message.includes("already booked"),
    "Should mention time slot",
  );
  console.log("✓ Overlapping meeting prevented");
});

test("Get Meeting by ID", async () => {
  const res = await makeRequest("GET", `/meetings/${global.meeting1Id}`);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.title === "Team Standup", "Title mismatch");
  console.log("✓ Meeting fetched:", res.body.data.title);
});

test("List All Meetings", async () => {
  const res = await makeRequest("GET", "/meetings");
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.length >= 3, "Should have at least 3 meetings");
  console.log("✓ All meetings listed:", res.body.data.length);
});

test("List Meetings by User ID", async () => {
  const res = await makeRequest("GET", `/meetings?userId=${global.userId1}`);
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.length === 2, "User 1 should have 2 meetings");
  console.log("✓ Meetings filtered by user:", res.body.data.length);
});

test("List Meetings by Date Range", async () => {
  const res = await makeRequest(
    "GET",
    "/meetings?startDate=2026-02-11T00:00:00.000Z&endDate=2026-02-11T23:59:59.000Z",
  );
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(
    res.body.data.length > 0,
    "Should find meetings in date range",
  );
  console.log("✓ Meetings filtered by date range:", res.body.data.length);
});

test("Update Meeting (Move to 11:00-12:00 - No conflict)", async () => {
  const res = await makeRequest("PUT", `/meetings/${global.meeting1Id}`, {
    startTime: "2026-02-11T11:00:00.000Z",
    endTime: "2026-02-11T12:00:00.000Z",
  });
  console.assert(res.status === 200, `Expected 200, got ${res.status}`);
  console.assert(res.body.data.title === "Team Standup", "Title should remain");
  console.log("✓ Meeting updated (time changed)");
});

test("Update Meeting to Conflict Should Fail", async () => {
  const res = await makeRequest("PUT", `/meetings/${global.meeting2Id}`, {
    startTime: "2026-02-11T11:30:00.000Z",
    endTime: "2026-02-11T12:30:00.000Z",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.assert(
    res.body.message.includes("already booked"),
    "Should prevent conflict",
  );
  console.log("✓ Conflicting update prevented");
});

test("Delete Meeting", async () => {
  const res = await makeRequest("DELETE", `/meetings/${global.meeting3Id}`);
  console.assert(res.status === 204, `Expected 204, got ${res.status}`);
  console.log("✓ Meeting deleted");
});

test("Deleted Meeting Should Not Exist", async () => {
  const res = await makeRequest("GET", `/meetings/${global.meeting3Id}`);
  console.assert(res.status === 404, `Expected 404, got ${res.status}`);
  console.log("✓ Deleted meeting not found");
});

// ==================== ERROR CASES ====================

test("Invalid Email Format Should Fail", async () => {
  const res = await makeRequest("POST", "/users", {
    name: "Test User",
    email: "invalid-email",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("✓ Invalid email rejected");
});

test("Missing Required Fields Should Fail", async () => {
  const res = await makeRequest("POST", "/users", {
    name: "Test User",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("✓ Missing email rejected");
});

test("Start Time After End Time Should Fail", async () => {
  const res = await makeRequest("POST", "/meetings", {
    userId: global.userId1,
    title: "Invalid Meeting",
    startTime: "2026-02-11T12:00:00.000Z",
    endTime: "2026-02-11T11:00:00.000Z",
  });
  console.assert(res.status === 400, `Expected 400, got ${res.status}`);
  console.log("✓ Invalid time range rejected");
});

test("Non-existent User Should Return 404", async () => {
  const res = await makeRequest("GET", "/users/99999");
  console.assert(res.status === 404, `Expected 404, got ${res.status}`);
  console.log("✓ Non-existent user returns 404");
});

test("Non-existent Meeting Should Return 404", async () => {
  const res = await makeRequest("GET", "/meetings/99999");
  console.assert(res.status === 404, `Expected 404, got ${res.status}`);
  console.log("✓ Non-existent meeting returns 404");
});

// ==================== RUN TESTS ====================

async function runAllTests() {
  console.log("\n=== Calendar Booking API Tests ===\n");
  console.log("Starting tests...\n");

  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      passed++;
    } catch (error) {
      console.error(`✗ ${name}:`, error.message);
      failed++;
    }
  }

  console.log("\n=== Test Results ===");
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Total: ${tests.length}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(console.error);
