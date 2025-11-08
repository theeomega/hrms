# API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All authenticated endpoints require a session cookie. Login first to obtain a session.

## Response Format
All responses follow standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate a user and create a session.

**Request Body:**
```json
{
  "username": "admin@company.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin@company.com",
    "role": "hr_admin",
    "employeeId": "EMP-2023-001",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

### Logout
**POST** `/auth/logout`

End the current user session.

**Response:**
```json
{
  "message": "Logged out successfully"
}
```

### Get Current User
**GET** `/auth/me`

Get the currently authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "username": "admin@company.com",
    "role": "hr_admin",
    "employeeId": "EMP-2023-001",
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

## Employee Endpoints

### List All Employees
**GET** `/employees`

Get all employees (HR Admin only).

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Anderson",
    "email": "john@company.com",
    "phone": "+1 (555) 123-4567",
    "role": "Senior Software Engineer",
    "department": "Engineering",
    "location": "San Francisco, CA",
    "employeeId": "EMP-2023-002",
    "status": "active",
    "joinDate": "2023-01-15",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-01-01T00:00:00.000Z"
  }
]
```

### Get Employee by ID
**GET** `/employees/:id`

Get a specific employee's details.

**Parameters:**
- `id` - Employee UUID

**Response:**
```json
{
  "id": "uuid",
  "name": "John Anderson",
  "email": "john@company.com",
  "phone": "+1 (555) 123-4567",
  "role": "Senior Software Engineer",
  "department": "Engineering",
  "location": "San Francisco, CA",
  "employeeId": "EMP-2023-002",
  "status": "active",
  "joinDate": "2023-01-15",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Create Employee
**POST** `/employees`

Create a new employee (HR Admin only).

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "phone": "+1 (555) 234-5678",
  "role": "Product Manager",
  "department": "Product",
  "location": "New York, NY",
  "employeeId": "EMP-2025-010",
  "status": "active",
  "joinDate": "2025-01-15"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  ...
}
```

### Update Employee
**PATCH** `/employees/:id`

Update employee information (HR Admin only).

**Parameters:**
- `id` - Employee UUID

**Request Body:**
```json
{
  "status": "on-leave",
  "phone": "+1 (555) 999-8888"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "on-leave",
  ...
}
```

### Delete Employee
**DELETE** `/employees/:id`

Delete an employee (HR Admin only).

**Parameters:**
- `id` - Employee UUID

**Response:**
```json
{
  "message": "Employee deleted successfully"
}
```

---

## Attendance Endpoints

### Get Attendance by Employee
**GET** `/attendance/employee/:employeeId`

Get attendance records for a specific employee.

**Parameters:**
- `employeeId` - Employee UUID
- `limit` (query) - Number of records to return (default: 10)

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "date": "2025-11-03",
    "checkIn": "2025-11-03T09:00:00.000Z",
    "checkOut": "2025-11-03T17:30:00.000Z",
    "hoursWorked": "8.5",
    "status": "present",
    "notes": null,
    "createdAt": "2025-11-03T00:00:00.000Z",
    "updatedAt": "2025-11-03T17:30:00.000Z"
  }
]
```

### Get Today's Attendance
**GET** `/attendance/today/:employeeId`

Get today's attendance record for an employee.

**Parameters:**
- `employeeId` - Employee UUID

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "date": "2025-11-03",
  "checkIn": "2025-11-03T09:00:00.000Z",
  "checkOut": null,
  "hoursWorked": null,
  "status": "present",
  "notes": null,
  "createdAt": "2025-11-03T09:00:00.000Z",
  "updatedAt": "2025-11-03T09:00:00.000Z"
}
```

### Check In
**POST** `/attendance/checkin`

Record employee check-in.

**Request Body:**
```json
{
  "employeeId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "date": "2025-11-03",
  "checkIn": "2025-11-03T09:00:00.000Z",
  "checkOut": null,
  "hoursWorked": null,
  "status": "present",
  "notes": null,
  "createdAt": "2025-11-03T09:00:00.000Z",
  "updatedAt": "2025-11-03T09:00:00.000Z"
}
```

### Check Out
**POST** `/attendance/checkout`

Record employee check-out.

**Request Body:**
```json
{
  "employeeId": "uuid"
}
```

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "date": "2025-11-03",
  "checkIn": "2025-11-03T09:00:00.000Z",
  "checkOut": "2025-11-03T17:30:00.000Z",
  "hoursWorked": "8.5",
  "status": "present",
  "notes": null,
  "createdAt": "2025-11-03T09:00:00.000Z",
  "updatedAt": "2025-11-03T17:30:00.000Z"
}
```

### Get Attendance by Date
**GET** `/attendance/date/:date`

Get all attendance records for a specific date (HR Admin only).

**Parameters:**
- `date` - Date in YYYY-MM-DD format

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "date": "2025-11-03",
    ...
  }
]
```

---

## Leave Request Endpoints

### Get All Leave Requests
**GET** `/leaves`

Get all leave requests (HR Admin only).

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveType": "Sick Leave",
    "startDate": "2025-11-05",
    "endDate": "2025-11-07",
    "days": 3,
    "reason": "Medical appointment and recovery",
    "status": "pending",
    "reviewedBy": null,
    "reviewedAt": null,
    "reviewNotes": null,
    "createdAt": "2025-11-03T00:00:00.000Z",
    "updatedAt": "2025-11-03T00:00:00.000Z"
  }
]
```

### Get Pending Leave Requests
**GET** `/leaves/pending`

Get all pending leave requests (HR Admin only).

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveType": "Sick Leave",
    "status": "pending",
    ...
  }
]
```

### Get Employee Leave Requests
**GET** `/leaves/employee/:employeeId`

Get leave requests for a specific employee.

**Parameters:**
- `employeeId` - Employee UUID

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveType": "Vacation",
    ...
  }
]
```

### Create Leave Request
**POST** `/leaves`

Create a new leave request.

**Request Body:**
```json
{
  "employeeId": "uuid",
  "leaveType": "Sick Leave",
  "startDate": "2025-11-05",
  "endDate": "2025-11-07",
  "days": 3,
  "reason": "Medical appointment and recovery"
}
```

**Response:**
```json
{
  "id": "uuid",
  "employeeId": "uuid",
  "leaveType": "Sick Leave",
  "startDate": "2025-11-05",
  "endDate": "2025-11-07",
  "days": 3,
  "reason": "Medical appointment and recovery",
  "status": "pending",
  "reviewedBy": null,
  "reviewedAt": null,
  "reviewNotes": null,
  "createdAt": "2025-11-03T00:00:00.000Z",
  "updatedAt": "2025-11-03T00:00:00.000Z"
}
```

### Update Leave Request
**PATCH** `/leaves/:id`

Approve or reject a leave request (HR Admin only).

**Parameters:**
- `id` - Leave request UUID

**Request Body:**
```json
{
  "status": "approved",
  "reviewNotes": "Approved for medical reasons"
}
```

**Response:**
```json
{
  "id": "uuid",
  "status": "approved",
  "reviewedBy": "uuid",
  "reviewedAt": "2025-11-03T10:00:00.000Z",
  "reviewNotes": "Approved for medical reasons",
  ...
}
```

---

## Notification Endpoints

### Get All Notifications
**GET** `/notifications`

Get all notifications for the current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "type": "leave",
    "title": "Leave Request Approved",
    "message": "Your vacation leave request has been approved",
    "read": false,
    "relatedId": "leave-uuid",
    "createdAt": "2025-11-03T00:00:00.000Z"
  }
]
```

### Get Unread Notifications
**GET** `/notifications/unread`

Get unread notifications for the current user.

**Response:**
```json
[
  {
    "id": "uuid",
    "read": false,
    ...
  }
]
```

### Mark Notification as Read
**PATCH** `/notifications/:id/read`

Mark a notification as read.

**Parameters:**
- `id` - Notification UUID

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

### Delete Notification
**DELETE** `/notifications/:id`

Delete a notification.

**Parameters:**
- `id` - Notification UUID

**Response:**
```json
{
  "message": "Notification deleted"
}
```

---

## Leave Balance Endpoints

### Get Leave Balances
**GET** `/leave-balances/:employeeId`

Get leave balances for an employee.

**Parameters:**
- `employeeId` - Employee UUID

**Response:**
```json
[
  {
    "id": "uuid",
    "employeeId": "uuid",
    "leaveType": "Sick Leave",
    "total": 12,
    "used": 3,
    "remaining": 9,
    "year": 2025,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-11-03T00:00:00.000Z"
  }
]
```

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid employee data"
}
```

### 401 Unauthorized
```json
{
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "message": "Forbidden: HR Admin access required"
}
```

### 404 Not Found
```json
{
  "message": "Employee not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Failed to fetch employees"
}
```

---

## Rate Limiting

Currently, there are no rate limits implemented. For production use, consider implementing rate limiting using packages like `express-rate-limit`.

## CORS

CORS is not configured by default. For production deployment with separate frontend and backend domains, configure CORS appropriately in `server/index.ts`.

## WebSockets

The application currently uses HTTP polling. For real-time updates, consider implementing WebSocket support for notifications and attendance updates.
