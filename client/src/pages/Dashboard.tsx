import { Users, UserCheck, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import StatCard from "@/components/StatCard";
import AttendanceButton from "@/components/AttendanceButton";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import RecentActivityFeed from "@/components/RecentActivityFeed";
import AttendanceTable from "@/components/AttendanceTable";
import LeaveRequestDialog from "@/components/LeaveRequestDialog";
import PendingLeaveRequests from "@/components/PendingLeaveRequests";

interface DashboardProps {
  isHRAdmin?: boolean;
}

export default function Dashboard({ isHRAdmin = false }: DashboardProps) {
  const mockLeaves = [
    { type: "Sick Leave", used: 3, total: 12, color: "chart-1" },
    { type: "Vacation", used: 8, total: 15, color: "chart-2" },
    { type: "Personal", used: 2, total: 5, color: "chart-3" }
  ];

  const mockActivities = [
    { id: "1", user: "Sarah Johnson", action: "Applied for sick leave", time: "2 hours ago", status: "pending" as const },
    { id: "2", user: "Michael Chen", action: "Checked in", time: "3 hours ago" },
    { id: "3", user: "Emily Davis", action: "Leave request approved", time: "5 hours ago", status: "approved" as const },
    { id: "4", user: "James Wilson", action: "Checked out", time: "1 day ago" }
  ];

  const mockAttendance = [
    { id: "1", date: "Nov 03, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: "8.5", status: "present" as const },
    { id: "2", date: "Nov 02, 2025", checkIn: "09:15 AM", checkOut: "05:45 PM", hours: "8.5", status: "late" as const },
    { id: "3", date: "Nov 01, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: "8.0", status: "present" as const },
    { id: "4", date: "Oct 31, 2025", checkIn: "08:55 AM", checkOut: "05:15 PM", hours: "8.3", status: "present" as const },
    { id: "5", date: "Oct 30, 2025", checkIn: "09:30 AM", checkOut: "06:00 PM", hours: "8.5", status: "late" as const },
  ];

  const mockLeaveRequests = [
    {
      id: "1",
      employee: "Sarah Johnson",
      type: "Sick Leave",
      startDate: "Nov 05, 2025",
      endDate: "Nov 07, 2025",
      days: 3,
      reason: "Medical appointment and recovery",
      status: "pending" as const
    },
    {
      id: "2",
      employee: "Michael Chen",
      type: "Vacation",
      startDate: "Nov 10, 2025",
      endDate: "Nov 17, 2025",
      days: 7,
      reason: "Family vacation",
      status: "pending" as const
    }
  ];

  if (isHRAdmin) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">HR Admin Dashboard</h1>
            <p className="text-muted-foreground">Welcome back! Here's your team overview</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Today</p>
            <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={248} icon={Users} trend="+12% from last month" trendUp={true} />
          <StatCard title="Present Today" value={232} icon={UserCheck} trend="93.5% attendance" trendUp={true} />
          <StatCard title="Pending Leaves" value={8} icon={Clock} />
          <StatCard title="Attendance Rate" value="94.2%" icon={TrendingUp} trend="+2.3% this month" trendUp={true} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <PendingLeaveRequests requests={mockLeaveRequests} />
          </div>
          <RecentActivityFeed activities={mockActivities} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Hires This Month</span>
                <span className="font-semibold">12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Upcoming Birthdays</span>
                <span className="font-semibold">5</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employees on Leave</span>
                <span className="font-semibold">16</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Work Hours/Day</span>
                <span className="font-semibold">8.3 hrs</span>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Department Overview</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Engineering</span>
                <span className="font-semibold">85 emp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Sales</span>
                <span className="font-semibold">58 emp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Product</span>
                <span className="font-semibold">42 emp</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Marketing</span>
                <span className="font-semibold">35 emp</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Unique Minimal Header - Split Design */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">Hello,</h1>
              <span className="text-5xl font-bold">John</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Unique Stats Display - Horizontal Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Attendance Card - Unique Design */}
        <Card className="relative overflow-hidden border shadow-sm">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
          <div className="p-8 relative">
            <AttendanceButton />
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-muted-foreground mb-1">This Month</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">22</span>
                <span className="text-muted-foreground">/23 days</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Leave Balance - Minimal */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Leave Balance</p>
                <p className="text-4xl font-bold">14</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              {mockLeaves.slice(0, 2).map((leave, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{leave.type}</span>
                  <span className="font-medium">{leave.total - leave.used} left</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Performance - Simple */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">95%</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">↑ 3%</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity - Matching This Week Design */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity Card */}
        <Card className="border shadow-sm lg:col-span-3">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                View all →
              </button>
            </div>
            <div className="space-y-4">
              {mockAttendance.slice(0, 5).map((record, index) => (
                <div 
                  key={record.id}
                  className={`flex items-center justify-between ${
                    index !== mockAttendance.slice(0, 5).length - 1 ? 'pb-4 border-b' : ''
                  }`}
                >
                  <div>
                    <p className="font-medium">{record.date}</p>
                    <p className="text-sm text-muted-foreground">
                      {record.checkIn} → {record.checkOut}
                    </p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold">{record.hours}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Quick Actions & Info */}
        <div className="space-y-6 lg:col-span-2">
            {/* Apply Leave - Redesigned Minimal CTA */}
            <div className="relative overflow-hidden rounded-3xl bg-primary p-8 text-primary-foreground max-w-[700px]">
              <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10" />
              <div className="relative space-y-4">
                <h3 className="text-3xl font-bold">Request Leave</h3>
                <p className="text-primary-foreground/90">
                  Planning a vacation or need personal time? Submit your request here.
                </p>
                <LeaveRequestDialog />
              </div>
            </div>

            {/* This Week Stats - Minimal Professional */}
            <Card className="border shadow-sm max-w-[700px]">
              <div className="p-6 space-y-5">
                <h3 className="text-lg font-semibold">This Week</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Total Hours</span>
                    <span className="text-2xl font-bold">42.5</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Days Worked</span>
                    <span className="text-2xl font-bold">5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Daily Average</span>
                    <span className="text-2xl font-bold">8.5</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
    </div>
  );
}
