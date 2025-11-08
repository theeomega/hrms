# Backend Setup Guide

## Overview

The backend is now fully implemented using:
- **Express.js** - REST API server
- **Drizzle ORM** - Type-safe database ORM
- **Neon Postgres** - Serverless PostgreSQL database
- **Express Session** - Authentication & session management

## 🚀 Quick Start

### 1. Database Setup

You have **two options** for the database:

#### Option A: Use Neon Postgres (Recommended for Production)

1. **Create a Neon account**
   - Go to [https://console.neon.tech](https://console.neon.tech)
   - Sign up for a free account
   - Create a new project

2. **Get your database URL**
   - Copy the connection string from your Neon dashboard
   - It looks like: `postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`

3. **Configure environment**
   ```bash
   # Create .env file from example
   cp .env.example .env
   ```

4. **Edit `.env` file**
   ```env
   DATABASE_URL=your_neon_connection_string_here
   SESSION_SECRET=your-super-secret-key-change-in-production
   NODE_ENV=development
   PORT=5000
   ```

5. **Push database schema**
   ```bash
   npm run db:push
   ```

6. **Seed the database**
   ```bash
   npm run db:seed
   ```

#### Option B: Keep In-Memory Storage (For Development/Testing)

If you want to keep using the in-memory storage:

1. **Revert storage import in `server/routes.ts`**
   ```typescript
   // Change this:
   import { dbStorage as storage } from "./db-storage";
   
   // Back to this:
   import { storage } from "./storage";
   ```

2. **Skip database setup** - the in-memory storage will work immediately

### 2. Start the Server

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The server will start on http://localhost:5000

## 📝 Default Login Credentials

After seeding the database, you can login with:

**HR Admin:**
- Username: `admin@company.com`
- Password: `admin123`

**Employee:**
- Username: `john@company.com`
- Password: `john123`

⚠️ **IMPORTANT:** Change these passwords in production!

## 🗂️ Database Schema

The database includes 6 tables:

1. **users** - Authentication (username, password, role)
2. **employees** - Employee information
3. **attendance** - Daily attendance records
4. **leave_requests** - Leave applications
5. **notifications** - User notifications
6. **leave_balances** - Leave balance tracking

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username/password
- `POST /api/auth/logout` - Logout current user
- `GET /api/auth/me` - Get current user info

### Employees
- `GET /api/employees` - Get all employees (HR only)
- `GET /api/employees/:id` - Get single employee
- `POST /api/employees` - Create employee (HR only)
- `PUT /api/employees/:id` - Update employee (HR only)
- `DELETE /api/employees/:id` - Delete employee (HR only)

### Attendance
- `POST /api/attendance/checkin` - Check in for the day
- `POST /api/attendance/checkout` - Check out for the day
- `GET /api/attendance/employee/:employeeId` - Get employee attendance history
- `GET /api/attendance/date/:date` - Get attendance for specific date

### Leave Requests
- `POST /api/leave-requests` - Create new leave request
- `GET /api/leave-requests` - Get all leave requests (HR only)
- `GET /api/leave-requests/employee/:employeeId` - Get employee's leave requests
- `GET /api/leave-requests/pending` - Get pending requests (HR only)
- `PUT /api/leave-requests/:id/approve` - Approve leave (HR only)
- `PUT /api/leave-requests/:id/reject` - Reject leave (HR only)

### Notifications
- `GET /api/notifications` - Get user's notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PUT /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Leave Balances
- `GET /api/leave-balances/employee/:employeeId` - Get leave balances

## 🔧 Database Storage Implementation

The `server/db-storage.ts` file implements the complete database layer using Drizzle ORM:

```typescript
import { dbStorage as storage } from "./db-storage";

// All methods return Promises and use async/await
await storage.getUser(id);
await storage.getAllEmployees();
await storage.createAttendance(data);
// ... etc
```

All methods are type-safe with TypeScript and validated with Zod schemas.

## 📊 Database Management

### View Database Schema
```bash
# Push schema changes to database
npm run db:push
```

### Reset Database (Caution!)
```bash
# Drop all tables and recreate
# Run this in Neon console or your SQL client:
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

# Then push schema again
npm run db:push

# And seed
npm run db:seed
```

### Backup Data
```bash
# Use pg_dump or Neon's backup features
# Or query data through Drizzle Studio (coming soon)
```

## 🔒 Security Notes

1. **Passwords**: Currently stored in plaintext. Consider adding bcrypt:
   ```bash
   npm install bcrypt @types/bcrypt
   ```

2. **Session Secret**: Change `SESSION_SECRET` in .env before deploying

3. **CORS**: Configure CORS if frontend is on different domain

4. **HTTPS**: Use HTTPS in production (set `secure: true` in session config)

## 🐛 Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL in .env
- Verify Neon database is running
- Check network connection

### "Table doesn't exist"
- Run `npm run db:push` to create tables
- Check Neon console for errors

### "Unauthorized" on all requests
- Clear browser cookies
- Check session configuration
- Verify DATABASE_URL is correct

### TypeScript errors
```bash
# Check for type errors
npm run check

# Rebuild if needed
npm run build
```

## 📦 File Structure

```
server/
├── db.ts              # Drizzle ORM database connection
├── db-storage.ts      # Database storage implementation (NEW)
├── storage.ts         # In-memory storage (fallback)
├── routes.ts          # All API endpoints
├── seed.ts            # Database seeding script (NEW)
├── index.ts           # Express server setup
└── vite.ts            # Vite dev server integration

shared/
└── schema.ts          # Database schema & TypeScript types
```

## 🎯 Next Steps

1. ✅ **Backend is complete** - All routes and database layer ready
2. 🔄 **Frontend integration** - API client already configured in `client/src/lib/api.ts`
3. 🧪 **Test endpoints** - Use Postman or browser DevTools
4. 🔐 **Add proper authentication** - Consider adding bcrypt for passwords
5. 📧 **Email notifications** - Add email service for leave approvals
6. 📊 **Analytics** - Implement dashboard analytics queries
7. 🚀 **Deploy** - Deploy to Replit, Vercel, or your hosting platform

## 🎉 Congratulations!

Your backend is now fully functional with a real database! The frontend is already set up to communicate with these endpoints through the `api.ts` client.

Login with the default credentials and start testing! 🚀
