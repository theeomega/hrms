# HR MasterMind - Complete HR Management System

A comprehensive, professional HR Management System with employee management, attendance tracking, leave management, and analytics.

## 🚀 Features

### For Employees
- **Dashboard**: Personal overview with attendance stats, leave balances, and quick actions
- **Attendance Management**: Check-in/check-out functionality with time tracking
- **Leave Requests**: Apply for different types of leaves with approval workflow
- **Profile Management**: Update personal information and change password
- **Notifications**: Real-time updates on leave approvals and attendance
- **Attendance History**: View historical attendance records

### For HR Admins
- **Employee Management**: Add, edit, and manage employee records
- **Attendance Monitoring**: Track attendance across all employees and departments
- **Leave Approval**: Review and approve/reject leave requests
- **Analytics & Reports**: Comprehensive reports on attendance, leaves, and performance
- **Department Overview**: Statistics by department
- **Notifications**: System-wide alerts and employee updates

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI library
- **TypeScript** - Type safety
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Icon library
- **Framer Motion** - Animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **Express Session** - Session management
- **Drizzle ORM** - Database ORM
- **Zod** - Schema validation

## 📦 Project Structure

```
HRMasterMind/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/       # shadcn/ui components
│   │   │   └── ...       # Custom components
│   │   ├── pages/        # Route pages
│   │   ├── lib/          # Utilities and API client
│   │   └── hooks/        # Custom React hooks
│   └── public/           # Static assets
├── server/               # Backend application
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Data storage layer
│   └── db.ts            # Database configuration
├── shared/              # Shared types and schemas
│   └── schema.ts        # Database schema and types
└── package.json         # Dependencies
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5000`

### Demo Credentials

**HR Admin:**
- Email: `admin@company.com`
- Password: `admin123`

**Employee:**
- Email: `john@company.com`
- Password: `john123`

## 🔑 Key API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Employees (HR Admin)
- `GET /api/employees` - List all employees
- `GET /api/employees/:id` - Get employee details
- `POST /api/employees` - Create new employee
- `PATCH /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance/employee/:employeeId` - Get attendance records
- `GET /api/attendance/today/:employeeId` - Get today's attendance
- `POST /api/attendance/checkin` - Check in
- `POST /api/attendance/checkout` - Check out
- `GET /api/attendance/date/:date` - Get attendance by date (HR Admin)

### Leave Requests
- `GET /api/leaves` - Get all leave requests (HR Admin)
- `GET /api/leaves/pending` - Get pending requests (HR Admin)
- `GET /api/leaves/employee/:employeeId` - Get employee's requests
- `POST /api/leaves` - Create leave request
- `PATCH /api/leaves/:id` - Approve/reject request (HR Admin)

### Notifications
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/unread` - Get unread notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Leave Balances
- `GET /api/leave-balances/:employeeId` - Get leave balances

## 📊 Database Schema

### Users
- Authentication credentials
- User roles (employee/hr_admin)
- Employee linking

### Employees
- Personal information
- Department and role
- Employment status
- Contact details

### Attendance
- Daily check-in/check-out
- Hours worked
- Status (present/late/absent)

### Leave Requests
- Leave type and dates
- Approval workflow
- Review notes

### Notifications
- Type-based notifications
- Read status
- Related entity links

### Leave Balances
- Leave types and allocations
- Usage tracking
- Yearly balances

## 🎨 Design System

The application follows professional HR platform design principles inspired by BambooHR and Workday:

- **Clean Corporate Aesthetic**: Professional, trustworthy interface
- **Data Hierarchy**: Clear visual separation of information
- **Dashboard-First**: Widget-based layouts for quick insights
- **Responsive Design**: Mobile, tablet, and desktop support
- **Accessible**: WCAG compliant with keyboard navigation

### Color Scheme
- Primary: Blue (#2563EB)
- Success: Green
- Warning: Amber
- Error: Red
- Muted backgrounds for reduced eye strain

## 🔐 Security Features

- Session-based authentication
- HTTP-only cookies
- Role-based access control (RBAC)
- Protected API endpoints
- Input validation with Zod
- XSS protection

## 📱 Pages Overview

1. **Login** - Secure authentication
2. **Dashboard** - Personalized overview (different for HR/Employee)
3. **Employees** - Employee directory and management
4. **Attendance** - Attendance tracking and history
5. **Leave Requests** - Leave management and approvals
6. **Profile** - Personal information management
7. **Notifications** - Activity feed and alerts
8. **Reports** - Analytics and insights (HR Admin)

## 🧪 Testing

The application includes data-testid attributes for easy testing:
- `button-login` - Login button
- `button-sidebar-toggle` - Sidebar toggle
- `button-theme-toggle` - Theme switcher
- `input-email` - Email input
- And many more...

## 🚢 Deployment

### Production Build

```bash
npm run build
npm start
```

### Environment Variables

```env
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key-here
```

## 📈 Future Enhancements

- [ ] PostgreSQL database integration
- [ ] File upload for employee documents
- [ ] Advanced analytics dashboard
- [ ] Email notifications
- [ ] Mobile app
- [ ] Performance reviews module
- [ ] Payroll integration
- [ ] Time tracking integration
- [ ] Calendar integrations
- [ ] Export to PDF/Excel

## 🤝 Contributing

This is a complete, production-ready HR management system. The codebase is well-structured, typed, and documented for easy maintenance and extension.

## 📄 License

MIT

## 👥 Support

For issues or questions, please refer to the code documentation or create an issue in the repository.

---

**Built with ❤️ for modern HR management**
