# HRMasterMind - MongoDB Backend Documentation

## Overview

This is the complete MongoDB backend for the HRMasterMind HR Management System. It provides RESTful APIs for all features including authentication, attendance tracking, leave management, notifications, and profile management.

## Tech Stack

- **Runtime**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs
- **Language**: TypeScript

## Installation

### 1. Install Dependencies

```bash
npm install mongoose bcryptjs jsonwebtoken dotenv
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### 2. MongoDB Setup

You have two options:

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Windows: Download from https://www.mongodb.com/try/download/community
# Mac: brew install mongodb-community
# Linux: Follow official MongoDB installation guide

# Start MongoDB service
# Windows: MongoDB runs as a service after installation
# Mac/Linux: brew services start mongodb-community
# Or: mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get connection string
4. Add to .env file

### 3. Environment Variables

Create a `.env` file in the root directory:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/hrmastermind
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/hrmastermind

# JWT Configuration
JWT_SECRET=your-secret-key-change-in-production

# Session Configuration
SESSION_SECRET=hr-management-secret-key-change-in-production

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 4. Start the Server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "employee"
}

Response:
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "john_doe",
  "password": "password123"
}

Response:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee"
  }
}
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer <token>

Response:
{
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee",
    "profile": {
      "fullName": "John Doe",
      "employeeId": "EMP001",
      ...
    }
  }
}
```

### Attendance Endpoints

#### Get Attendance Records
```http
GET /api/attendance?startDate=2024-01-01&endDate=2024-01-31&status=present&limit=50
Authorization: Bearer <token>

Response:
{
  "attendance": [
    {
      "_id": "...",
      "userId": "...",
      "date": "2024-01-15T00:00:00.000Z",
      "checkIn": "2024-01-15T09:00:00.000Z",
      "checkOut": "2024-01-15T17:30:00.000Z",
      "hours": 8.5,
      "status": "present"
    }
  ]
}
```

#### Check In
```http
POST /api/attendance/check-in
Authorization: Bearer <token>

Response:
{
  "message": "Checked in successfully",
  "attendance": {
    "_id": "...",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "status": "present"
  }
}
```

#### Check Out
```http
POST /api/attendance/check-out
Authorization: Bearer <token>

Response:
{
  "message": "Checked out successfully",
  "attendance": {
    "_id": "...",
    "checkIn": "2024-01-15T09:00:00.000Z",
    "checkOut": "2024-01-15T17:30:00.000Z",
    "hours": 8.5
  }
}
```

#### Get Attendance Stats
```http
GET /api/attendance/stats?month=1&year=2024
Authorization: Bearer <token>

Response:
{
  "stats": {
    "totalDays": 20,
    "present": 18,
    "late": 2,
    "absent": 0,
    "leave": 0,
    "totalHours": 168,
    "avgHours": 8.4
  }
}
```

### Leave Management Endpoints

#### Get Leave Requests
```http
GET /api/leave?status=pending&type=Sick Leave
Authorization: Bearer <token>

Response:
{
  "leaves": [
    {
      "_id": "...",
      "userId": "...",
      "type": "Sick Leave",
      "startDate": "2024-01-20T00:00:00.000Z",
      "endDate": "2024-01-22T00:00:00.000Z",
      "days": 2,
      "reason": "Medical appointment",
      "status": "pending"
    }
  ]
}
```

#### Submit Leave Request
```http
POST /api/leave
Authorization: Bearer <token>
Content-Type: application/json

{
  "type": "Sick Leave",
  "startDate": "2024-01-20",
  "endDate": "2024-01-22",
  "reason": "Medical appointment",
  "days": 2
}

Response:
{
  "message": "Leave request submitted successfully",
  "leave": {
    "_id": "...",
    "type": "Sick Leave",
    "status": "pending"
  }
}
```

#### Approve Leave (HR Admin Only)
```http
PATCH /api/leave/:id/approve
Authorization: Bearer <token>

Response:
{
  "message": "Leave request approved",
  "leave": {
    "_id": "...",
    "status": "approved",
    "approvedBy": "..."
  }
}
```

#### Reject Leave (HR Admin Only)
```http
PATCH /api/leave/:id/reject
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Insufficient coverage during requested dates"
}

Response:
{
  "message": "Leave request rejected",
  "leave": {
    "_id": "...",
    "status": "rejected",
    "rejectionReason": "..."
  }
}
```

#### Get Leave Balance
```http
GET /api/leave/balance
Authorization: Bearer <token>

Response:
{
  "balance": {
    "year": 2024,
    "sickLeave": {
      "total": 12,
      "used": 2,
      "remaining": 10
    },
    "vacation": {
      "total": 15,
      "used": 5,
      "remaining": 10
    },
    "personalLeave": {
      "total": 5,
      "used": 1,
      "remaining": 4
    }
  }
}
```

### Notification Endpoints

#### Get Notifications
```http
GET /api/notifications?read=false&type=leave_approved&limit=50
Authorization: Bearer <token>

Response:
{
  "notifications": [
    {
      "_id": "...",
      "type": "leave_approved",
      "message": "Your Sick Leave request has been approved",
      "read": false,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ]
}
```

#### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>

Response:
{
  "count": 5
}
```

#### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>

Response:
{
  "message": "Notification marked as read"
}
```

#### Mark All as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer <token>

Response:
{
  "message": "All notifications marked as read"
}
```

### Dashboard Endpoints

#### Get User Dashboard Stats
```http
GET /api/dashboard/stats
Authorization: Bearer <token>

Response:
{
  "todayAttendance": {
    "checkIn": "2024-01-15T09:00:00.000Z",
    "status": "present"
  },
  "attendanceStats": {
    "present": 18,
    "late": 2,
    "absent": 0,
    "leave": 0,
    "totalHours": 168
  },
  "leaveBalance": {
    "sickLeave": { "remaining": 10 },
    "vacation": { "remaining": 10 },
    "personalLeave": { "remaining": 4 }
  },
  "pendingLeaves": 1
}
```

#### Get HR Dashboard Stats (HR Admin Only)
```http
GET /api/dashboard/hr-stats
Authorization: Bearer <token>

Response:
{
  "totalEmployees": 50,
  "todayStats": {
    "present": 45,
    "late": 3,
    "absent": 2
  },
  "pendingLeaves": 5,
  "monthStats": {
    "avgHours": 8.2,
    "present": 890,
    "late": 25
  }
}
```

#### Get Recent Activity
```http
GET /api/dashboard/recent-activity?limit=10
Authorization: Bearer <token>

Response:
{
  "activity": [
    {
      "type": "attendance",
      "date": "2024-01-15T00:00:00.000Z",
      "status": "present",
      "hours": 8.5
    },
    {
      "type": "leave",
      "date": "2024-01-10T00:00:00.000Z",
      "leaveType": "Sick Leave",
      "status": "approved",
      "days": 2
    }
  ]
}
```

### Profile Endpoints

#### Get Current Profile
```http
GET /api/profile
Authorization: Bearer <token>

Response:
{
  "user": {
    "_id": "...",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "employee",
    "profile": {
      "fullName": "John Doe",
      "employeeId": "EMP001",
      "phone": "+1234567890",
      "location": "New York",
      "department": "Engineering",
      "position": "Software Developer",
      "joinDate": "2023-01-15T00:00:00.000Z"
    }
  }
}
```

#### Update Profile
```http
PATCH /api/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "profile": {
    "fullName": "John Michael Doe",
    "phone": "+1234567890",
    "location": "San Francisco"
  }
}

Response:
{
  "message": "Profile updated successfully",
  "user": {
    "_id": "...",
    "email": "john.doe@example.com",
    "profile": {
      "fullName": "John Michael Doe",
      ...
    }
  }
}
```

#### Change Password
```http
PATCH /api/profile/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword456"
}

Response:
{
  "message": "Password changed successfully"
}
```

#### Get All Users (HR Admin Only)
```http
GET /api/profile/all?role=employee&department=Engineering&search=john&limit=50
Authorization: Bearer <token>

Response:
{
  "users": [...],
  "total": 25
}
```

## Database Models

### User Model
- username (unique, required)
- email (unique, required)
- password (hashed, required)
- role (employee/hr_admin)
- profile (fullName, employeeId, phone, location, department, position, joinDate)

### Attendance Model
- userId (reference to User)
- date (indexed)
- checkIn (timestamp)
- checkOut (timestamp)
- hours (auto-calculated)
- status (present/late/absent/leave)

### Leave Model
- userId (reference to User)
- type (Sick Leave/Vacation/Personal Leave/Maternity Leave/Paternity Leave)
- startDate, endDate
- days
- reason
- status (pending/approved/rejected)
- approvedBy (reference to User)
- rejectionReason

### LeaveBalance Model
- userId (reference to User)
- year
- sickLeave (total, used, remaining)
- vacation (total, used, remaining)
- personalLeave (total, used, remaining)

### Notification Model
- userId (reference to User)
- type (8 types: attendance_reminder, leave_request, leave_approved, etc.)
- message
- read (boolean)
- relatedUser, relatedLeave, relatedAttendance (optional references)

## Authentication Flow

1. **Register/Login**: User receives JWT token (7-day expiry)
2. **Include Token**: Frontend sends token in `Authorization: Bearer <token>` header
3. **Token Verification**: Backend middleware validates token and attaches user to request
4. **Role-Based Access**: Some routes require HR Admin role

## Security Features

- Password hashing with bcryptjs (10 rounds)
- JWT authentication with configurable secret
- Role-based access control (RBAC)
- Session management for backward compatibility
- Environment variable configuration

## Error Handling

All endpoints return consistent error responses:

```json
{
  "message": "Error description"
}
```

HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Server Error

## Development Tips

### Seeding Database

You can create a seed script to populate initial data:

```javascript
// server/seed-mongo.ts
import { User } from './models/User';
import { LeaveBalance } from './models/LeaveBalance';

async function seed() {
  // Create HR Admin
  const admin = new User({
    username: 'admin',
    email: 'admin@hrmastermind.com',
    password: 'admin123',
    role: 'hr_admin',
    profile: {
      fullName: 'System Administrator',
      employeeId: 'ADMIN001',
    }
  });
  await admin.save();

  // Create sample employee
  const employee = new User({
    username: 'john_doe',
    email: 'john@example.com',
    password: 'password123',
    role: 'employee',
    profile: {
      fullName: 'John Doe',
      employeeId: 'EMP001',
      department: 'Engineering',
      position: 'Software Developer',
    }
  });
  await employee.save();

  // Create leave balance
  const balance = new LeaveBalance({
    userId: employee._id,
    year: new Date().getFullYear(),
  });
  await balance.save();
}
```

### Testing with Postman/Thunder Client

1. Import the API endpoints
2. Create an environment with `BASE_URL=http://localhost:5000/api`
3. Add authentication token to headers after login

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB is running: `mongod` or check service status
- Verify connection string in .env
- Check firewall settings for cloud MongoDB

### Authentication Errors
- Verify JWT_SECRET is set in .env
- Check token format: `Authorization: Bearer <token>`
- Ensure token hasn't expired (7 days)

### Type Errors
- Run: `npm install -D @types/bcryptjs @types/jsonwebtoken`
- Restart TypeScript server in VS Code

## Next Steps

1. ✅ Install dependencies
2. ✅ Setup MongoDB
3. ✅ Configure environment variables
4. ✅ Start the server
5. 🔄 Update frontend API client to use JWT authentication
6. 🔄 Test all endpoints
7. 🔄 Deploy to production

## Support

For issues or questions, refer to:
- MongoDB Docs: https://docs.mongodb.com/
- Mongoose Docs: https://mongoosejs.com/
- JWT Docs: https://jwt.io/
