# MongoDB Backend Setup Guide

## Overview
This guide explains the complete MongoDB backend implementation for the HR Management System. The backend replaces the previous Drizzle/PostgreSQL setup with MongoDB using Mongoose.

## Architecture

### Database Structure
- **Database**: MongoDB (default: `mongodb://localhost:27017/hrmaster`)
- **Collections**: 
  - `users` - Employee and HR admin accounts
  - `attendances` - Daily check-in/check-out records
  - `leaves` - Leave requests and approvals
  - `leavebalances` - Annual leave balance per user
  - `notifications` - User notifications

### Technology Stack
- **MongoDB**: NoSQL database
- **Mongoose**: ODM (Object Document Mapper) for MongoDB
- **bcryptjs**: Password hashing
- **express-session**: Session management
- **connect-mongo** (optional): Session store for MongoDB

## Installation

### 1. Install Required Packages
```bash
npm install mongoose bcryptjs @types/bcryptjs connect-mongo @types/mongoose
```

### 2. Install and Run MongoDB
- **Option A**: Install MongoDB locally
  - Download from https://www.mongodb.com/try/download/community
  - Run: `mongod` (starts server on port 27017)

- **Option B**: Use MongoDB Atlas (cloud)
  - Sign up at https://www.mongodb.com/cloud/atlas
  - Create cluster and get connection URI
  - Set in environment variable: `MONGODB_URI=mongodb+srv://...`

## Models

### User Model (`server/models/UserModel.ts`)
```typescript
{
  username: string (unique, required)
  email: string (unique, required, lowercase)
  password: string (required, hashed with bcrypt)
  fullName: string (required)
  role: 'employee' | 'hr_admin' (default: 'employee')
  employeeId: string (unique, auto-generated: EMP-YYYY-NNN)
  department: string (default: 'General')
  position: string (default: 'Employee')
  phone: string
  location: string (default: 'Office')
  joinDate: Date (default: current date)
}
```

### Attendance Model (`server/models/AttendanceModel.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  date: Date (indexed)
  checkIn: Date
  checkOut: Date
  hours: number
  status: 'present' | 'late' | 'absent' | 'leave'
  notes: string
}
```

### Leave Model (`server/models/LeaveModel.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  type: 'Sick Leave' | 'Vacation' | 'Personal Leave'
  startDate: Date
  endDate: Date
  days: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  appliedOn: Date (indexed)
  approvedBy: ObjectId (ref: User)
  approvalDate: Date
  rejectionReason: string
}
```

### Leave Balance Model (`server/models/LeaveBalanceModel.ts`)
```typescript
{
  userId: ObjectId (unique, ref: User)
  year: number (default: current year)
  sickLeave: { used: number, total: 12 }
  vacation: { used: number, total: 15 }
  personalLeave: { used: number, total: 5 }
}
```

### Notification Model (`server/models/NotificationModel.ts`)
```typescript
{
  userId: ObjectId (ref: User, indexed)
  type: 'leave' | 'attendance' | 'system' | 'approval' | 'alert' | 'meeting' | 'reminder' | 'team'
  title: string
  message: string
  read: boolean (default: false)
  relatedUser: ObjectId (ref: User)
  createdAt: Date (indexed)
}
```

## API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/signup` - Create new user account
  - Body: `{ username, email, password, fullName, department?, position?, phone?, location? }`
  - Auto-generates unique employeeId (EMP-YYYY-001, EMP-YYYY-002, etc.)
  - Creates initial leave balance

- `POST /api/auth/login` - User login
  - Body: `{ username, password }`
  - Returns user object (without password)
  - Sets session cookie

- `POST /api/auth/logout` - User logout
  - Destroys session

- `GET /api/auth/me` - Get current logged-in user
  - Returns user object (without password)

### Dashboard (`/api/dashboard`)
- `GET /api/dashboard/stats` - Employee dashboard statistics
  - Returns: presentDays, totalHours, avgHours, attendanceRate, pendingLeaves (current month)

- `GET /api/dashboard/activity` - Recent activity feed
  - Returns: Last 5 attendance records formatted as activity items

- `GET /api/dashboard/admin/stats` - HR admin dashboard statistics
  - Returns: totalEmployees, presentToday, pendingLeaves, attendanceRate

### Attendance (`/api/attendance`)
- `GET /api/attendance` - Get attendance records
  - Query params: `startDate`, `endDate`, `limit` (default: 50)
  - Returns formatted records with dates and times

- `GET /api/attendance/today` - Get today's attendance status
  - Returns: checkedIn, checkedOut, checkIn time, checkOut time, hours, status

- `POST /api/attendance/checkin` - Check in for the day
  - Automatically marks as 'late' if after 9:00 AM
  - Creates notification if late

- `POST /api/attendance/checkout` - Check out for the day
  - Calculates hours worked
  - Must check in before checking out

### Leave Requests (`/api/leave`)
- `GET /api/leave/requests` - Get leave requests
  - Employees: See only their requests
  - HR Admin: See all requests

- `GET /api/leave/balance` - Get leave balance for current year
  - Auto-creates balance if not exists

- `POST /api/leave/request` - Create new leave request
  - Body: `{ type, startDate, endDate, reason }`
  - Validates leave balance before creating
  - Notifies HR admins

- `POST /api/leave/approve/:id` - Approve leave request (HR Admin only)
  - Updates leave balance
  - Notifies employee

- `POST /api/leave/reject/:id` - Reject leave request (HR Admin only)
  - Body: `{ reason }`
  - Notifies employee with rejection reason

### Notifications (`/api/notifications`)
- `GET /api/notifications` - Get all notifications
  - Query param: `limit` (default: 50)
  - Returns formatted notifications with "time ago" format

- `GET /api/notifications/unread-count` - Get unread notification count

- `PATCH /api/notifications/:id/read` - Mark notification as read

- `POST /api/notifications/mark-all-read` - Mark all notifications as read

- `POST /api/notifications` - Create notification (admin or system)
  - Body: `{ userId?, type, title, message, relatedUser? }`

- `DELETE /api/notifications/:id` - Delete notification

### Profile (`/api/profile`)
- `GET /api/profile` - Get current user profile
  - Returns formatted profile with joinDate

- `PUT /api/profile` - Update profile
  - Body: `{ fullName?, email?, phone?, location?, department?, position? }`
  - Validates email uniqueness

- `POST /api/profile/change-password` - Change password
  - Body: `{ currentPassword, newPassword }`
  - Validates current password before updating

## Configuration

### Environment Variables
Create a `.env` file in the root directory:
```bash
# MongoDB
MONGODB_URI=mongodb://localhost:27017/hrmaster

# Session
SESSION_SECRET=your-secret-key-change-in-production

# Node Environment
NODE_ENV=development

# Port
PORT=5000
```

### MongoDB Connection (`server/config/mongodb.ts`)
```typescript
import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrmaster';
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};
```

### Server Setup (`server/index.ts`)
```typescript
import { connectDB } from "./config/mongodb";
import { registerMongoRoutes } from "./routes-mongo";

// Connect to MongoDB
connectDB();

// Use MongoDB routes
const server = await registerMongoRoutes(app);
```

## Security Features

### Password Hashing
- All passwords hashed with bcrypt (salt rounds: 10)
- Passwords never returned in API responses
- Current password validation before password change

### Session Management
- Express sessions with 24-hour expiration
- HTTP-only cookies (prevents XSS attacks)
- Secure cookies in production (HTTPS only)

### Authentication Middleware
- `isAuthenticated`: Checks if user is logged in
- Applied to all protected routes

### Authorization
- HR Admin routes check user role
- Employees can only access their own data
- HR Admins can access all employee data

## Data Flow Examples

### User Signup
1. User submits signup form
2. Backend validates required fields
3. Checks username/email uniqueness
4. Hashes password with bcrypt
5. Generates unique employeeId (EMP-2024-001)
6. Creates user document
7. Creates initial leave balance document
8. Returns success message

### Attendance Check-in
1. User clicks check-in button
2. Frontend calls `POST /api/attendance/checkin`
3. Backend checks if already checked in today
4. Creates attendance record with current time
5. Determines status (late if after 9 AM)
6. Creates notification if late
7. Returns check-in confirmation

### Leave Request Flow
1. Employee submits leave request form
2. Backend validates dates and calculates days
3. Checks available leave balance
4. Creates pending leave request
5. Creates notifications for all HR admins
6. HR admin approves/rejects request
7. Updates leave balance (if approved)
8. Notifies employee of decision

## Testing

### Create First User (via Signup)
```bash
POST http://localhost:5000/api/auth/signup
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@company.com",
  "password": "admin123",
  "fullName": "Admin User",
  "department": "HR",
  "position": "HR Manager"
}
```

### Set User as HR Admin (via MongoDB Shell)
```javascript
mongosh
use hrmaster
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "hr_admin" } }
)
```

### Login
```bash
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

## Differences from Previous Backend

### Old (Drizzle + PostgreSQL)
- SQL database with relational tables
- Drizzle ORM with type-safe queries
- Passport.js for authentication
- Plain text passwords (demo only)

### New (Mongoose + MongoDB)
- NoSQL document database
- Mongoose ODM with schemas and validation
- Custom bcrypt-based authentication
- Properly hashed passwords
- Auto-generated employee IDs
- Indexed queries for performance
- Timestamps on all models

## Migration Notes

### Data Migration
If migrating from old backend:
1. Export data from PostgreSQL
2. Transform to MongoDB document format
3. Hash existing passwords with bcrypt
4. Generate employeeId for each user
5. Import to MongoDB collections

### Frontend Updates Needed
- Update API calls to match new endpoints
- Change authentication flow (username instead of email for login)
- Update data structures to match new models
- Handle new response formats

## Troubleshooting

### MongoDB Connection Failed
- Ensure MongoDB is running: `mongod` or check Atlas connection
- Verify `MONGODB_URI` in environment variables
- Check firewall/network settings

### Authentication Not Working
- Clear browser cookies and session storage
- Verify bcrypt comparison in login route
- Check session secret is set

### Leave Balance Not Created
- Ensure user exists before creating leave request
- Check LeaveBalance model initialization
- Manually create: `db.leavebalances.insertOne({ userId: ObjectId("..."), year: 2024 })`

### Performance Issues
- Verify indexes are created: `db.attendances.getIndexes()`
- Use `limit` parameter in list endpoints
- Enable MongoDB connection pooling

## Next Steps

1. **Install packages**: Run `npm install mongoose bcryptjs @types/bcryptjs connect-mongo @types/mongoose`
2. **Start MongoDB**: Run `mongod` or configure Atlas connection
3. **Update environment**: Create `.env` file with MongoDB URI
4. **Start server**: Run `npm run dev`
5. **Test signup**: Create first user via `/signup` page
6. **Set admin role**: Use MongoDB shell to set `role: "hr_admin"`
7. **Test features**: Login, check-in, create leave requests, send notifications

## Advanced Configuration

### Session Store with MongoDB
Update `server/routes-mongo.ts`:
```typescript
import MongoStore from 'connect-mongo';

app.use(
  session({
    secret: process.env.SESSION_SECRET || "...",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/hrmaster',
      touchAfter: 24 * 3600 // Lazy session update
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000
    }
  })
);
```

### Database Seeding
Create `server/seed-mongo.ts` to populate initial data:
```typescript
import { connectDB } from './config/mongodb';
import User from './models/UserModel';
import bcrypt from 'bcryptjs';

async function seed() {
  await connectDB();
  
  const password = await bcrypt.hash('admin123', 10);
  
  await User.create({
    username: 'admin',
    email: 'admin@company.com',
    password,
    fullName: 'Admin User',
    role: 'hr_admin',
    department: 'HR',
    position: 'HR Manager'
  });
  
  console.log('✅ Seeding complete');
  process.exit(0);
}

seed();
```

## Resources

- MongoDB Documentation: https://docs.mongodb.com/
- Mongoose Documentation: https://mongoosejs.com/
- bcrypt.js: https://github.com/dcodeIO/bcrypt.js
- Express Sessions: https://www.npmjs.com/package/express-session
- connect-mongo: https://www.npmjs.com/package/connect-mongo
