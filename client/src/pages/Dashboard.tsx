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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Employee Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Manage your attendance and leaves</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Today</p>
          <p className="text-lg font-semibold">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Days Present" value={22} icon={UserCheck} trend="This month" />
        <StatCard title="Leave Balance" value={14} icon={Clock} trend="Days remaining" />
        <StatCard title="Avg Hours" value="8.2" icon={TrendingUp} trend="Per day" />
        <StatCard title="Attendance Rate" value="95%" icon={TrendingUp} trend="+3% improvement" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <AttendanceTable records={mockAttendance} />
          <Card className="p-6">
            <h3 className="font-semibold mb-4">This Month Summary</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Total Working Days</p>
                <p className="text-2xl font-bold">23</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Days Worked</p>
                <p className="text-2xl font-bold">22</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                <p className="text-2xl font-bold">180</p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">Late Check-ins</p>
                <p className="text-2xl font-bold">2</p>
              </div>
            </div>
          </Card>
        </div>
        <div className="space-y-6">
          <AttendanceButton />
          <LeaveBalanceCard leaves={mockLeaves} />
          <LeaveRequestDialog />
        </div>
      </div>
    </div>
  );
}
