# HR Management System Design Guidelines

## Design Approach
**Reference-Based Design**: Inspired by BambooHR and Workday - professional enterprise HR platforms known for clean, data-dense dashboards with excellent information hierarchy and intuitive workflow management.

## Core Design Principles
- **Professional Corporate Aesthetic**: Clean, trustworthy interface suitable for HR workflows
- **Data Hierarchy**: Clear visual separation between critical metrics, actionable items, and secondary information
- **Dashboard-First**: Widget-based layout optimized for quick insights and task management
- **Workflow Clarity**: Guided user flows for attendance tracking and leave applications

## Typography
**Font Family**: Inter for UI elements, Roboto for data displays (via Google Fonts CDN)

**Type Scale**:
- Page Titles: 32px/2rem, font-weight 700
- Section Headers: 24px/1.5rem, font-weight 600
- Card Titles: 18px/1.125rem, font-weight 600
- Body Text: 16px/1rem, font-weight 400
- Small Text/Labels: 14px/0.875rem, font-weight 400
- Metrics/Numbers: 28px/1.75rem, font-weight 700

## Layout System
**Spacing Units**: Use Tailwind's spacing scale with primary units of 4, 5, 6, and 8 (p-4, p-5, p-6, p-8, gap-4, gap-6)

**Grid Structure**:
- Dashboard widgets: 3-column grid on desktop (grid-cols-1 md:grid-cols-2 lg:grid-cols-3)
- Stat cards: 4-column layout (grid-cols-2 lg:grid-cols-4)
- Content max-width: max-w-7xl for main containers
- Card padding: p-6 standard, p-8 for hero cards

**Responsive Breakpoints**:
- Mobile: Single column, full-width cards
- Tablet (md): 2-column layouts
- Desktop (lg): 3-4 column grids

## Component Library

### Navigation
- **Top Bar**: Fixed header with logo left, user profile/notifications right, height h-16
- **Sidebar** (HR Admin): Collapsible navigation with icons + labels, w-64 expanded, w-16 collapsed
- **Mobile Menu**: Hamburger icon triggering slide-out drawer

### Dashboard Widgets
- **Stat Cards**: Metric display with icon, large number, label, and trend indicator
- **Activity Feed**: Scrollable list with timestamps, avatars, and status badges
- **Calendar Widget**: Month view with attendance/leave markers
- **Chart Cards**: Bar/line charts showing attendance trends and leave statistics
- **Quick Actions**: Button grid for common tasks (Check In, Apply Leave, View Team)

### Data Displays
- **Tables**: Striped rows, sortable headers, action buttons per row, pagination footer
- **Status Badges**: Rounded pills with colored backgrounds (Approved: green, Pending: amber, Rejected: red)
- **Profile Cards**: Avatar + name + role + contact info in consistent layout
- **Timeline**: Vertical line with nodes showing attendance history

### Forms
- **Input Fields**: Outlined style with floating labels, rounded corners (rounded-lg)
- **Date Pickers**: Calendar dropdown interface for leave dates
- **Dropdowns**: Custom styled selects matching theme
- **Submit Buttons**: Full-width on mobile, auto-width on desktop

### Interactive Elements
- **Primary Buttons**: #2563EB background, white text, rounded-lg, px-6 py-3
- **Secondary Buttons**: White background, #2563EB border/text, same padding
- **Icon Buttons**: Circular or square with hover states, 40px × 40px
- **Cards**: White background, subtle shadow (shadow-sm), rounded-xl borders

### Modals & Overlays
- **Confirmation Dialogs**: Centered modal, max-w-md, with action buttons
- **Leave Application Form**: Full modal with multi-step fields
- **Attendance Detail View**: Slide-over panel from right side

## Visual Hierarchy

**Dashboard Layout Priority**:
1. **Top Metrics**: 4 stat cards showing key numbers (Total Employees, Present Today, Pending Leaves, Attendance Rate)
2. **Action Zone**: Quick action buttons for daily tasks
3. **Recent Activity**: Latest check-ins, leave applications, approvals
4. **Visual Analytics**: Charts and graphs in lower priority zones

**Information Density**:
- High density for admin dashboards (more widgets, compact spacing)
- Medium density for employee views (focused on personal data)
- Low density for action flows (generous spacing in forms)

## Page-Specific Layouts

### Login Page
- Centered card on gradient background, logo top-center, form max-w-md

### HR Dashboard
- 3-column widget grid with stat cards, pending approvals list, attendance chart, recent activity feed

### Employee Dashboard
- Personal attendance summary card, leave balance widget, check-in/out button, recent history table

### Attendance Management
- Calendar view with color-coded dates, filter controls, daily roster table below

### Leave Management
- Split view: left sidebar with leave types/balances, right panel with application form or approval queue

### Employee Profiles
- Header with avatar and basic info, tabbed content (Personal Info, Employment Details, Attendance History)

## Interaction Patterns
- **Check-In/Out**: Single prominent button, confirmation toast notification
- **Leave Application**: Multi-step form (dates → type → reason), progress indicator
- **Approval Workflow**: Swipe cards or list with approve/reject inline buttons
- **Filtering**: Dropdown menus and date range pickers above data tables

## Accessibility
- Keyboard navigation throughout
- Focus indicators on interactive elements (ring-2 ring-blue-500)
- ARIA labels for icon-only buttons
- High contrast text (#1E293B on white backgrounds)

## Animations
**Minimal, Purposeful Motion**:
- Page transitions: Subtle fade-in (opacity + translate)
- Modal entry: Scale from 95% to 100%
- Notification toasts: Slide in from top-right
- No decorative animations on data displays

This design creates a professional, efficient HR management experience that balances data density with usability, optimized for daily workflow tasks.