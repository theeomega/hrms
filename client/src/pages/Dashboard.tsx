import { useQuery } from "@tanstack/react-query";
import { Users, UserCheck, Clock, TrendingUp, CheckCircle, XCircle, Calendar, LogIn, LogOut, FileText, FileEdit, Bell, ArrowDownCircle, ArrowUpCircle, UserX, Trophy, Clock4, Target, ThumbsDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import StatCard from "@/components/StatCard";
import AttendanceButton from "@/components/AttendanceButton";
import LeaveBalanceCard from "@/components/LeaveBalanceCard";
import RecentActivityFeed from "@/components/RecentActivityFeed";
import AttendanceTable from "@/components/AttendanceTable";
import LeaveRequestDialog from "@/components/LeaveRequestDialog";
import PendingLeaveRequests from "@/components/PendingLeaveRequests";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

interface DashboardProps {
  isHRAdmin?: boolean;
}

export default function Dashboard({ isHRAdmin = false }: DashboardProps) {
  // Fetch current user's profile for greeting name
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    refetchOnWindowFocus: true,
  });
  // Fetch dashboard stats with real-time updates
  const { data: statsData, isLoading: isStatsLoading, isFetching: isStatsFetching } = useQuery({
    queryKey: isHRAdmin ? ['dashboard-admin-stats'] : ['dashboard-stats'],
    queryFn: async () => {
      const endpoint = isHRAdmin ? '/api/dashboard/admin/stats' : '/api/dashboard/stats';
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch recent activity with real-time updates
  const { data: activityData, isLoading: isActivityLoading, isFetching: isActivityFetching } = useQuery({
    queryKey: ['dashboard-activity'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/activity', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch leave balance with real-time updates
  const { data: leaveData, isLoading: isLeaveLoading, isFetching: isLeaveFetching } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      const response = await fetch('/api/leave/balance', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      return response.json();
    },
    enabled: !isHRAdmin,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch recent leave requests for activity feed with real-time updates
  const { data: recentLeavesData, isLoading: isRecentLeavesLoading, isFetching: isRecentLeavesFetching } = useQuery({
    queryKey: ['recent-leaves-activity'],
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
    enabled: !isHRAdmin,
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch pending leave requests (for HR Admin) with real-time updates
  const { data: pendingLeavesData, isLoading: isPendingLeavesLoading, isFetching: isPendingLeavesFetching } = useQuery({
    queryKey: ['pending-leaves'],
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
    enabled: isHRAdmin,
    refetchInterval: 5000, // Refresh every 5 seconds for admin
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });

  // Only show skeleton on initial load, not on refetch
  const showStatsLoading = isStatsLoading && !statsData;
  const showActivityLoading = isActivityLoading && !activityData;
  const showLeaveLoading = isLeaveLoading && !leaveData;
  const showRecentLeavesLoading = isRecentLeavesLoading && !recentLeavesData;
  const showPendingLeavesLoading = isPendingLeavesLoading && !pendingLeavesData;

  const stats = statsData || {}; // Stats returned directly from backend
  const activities = activityData?.activities || [];
  const leaveBalance = leaveData?.balance || {};
  const recentLeaves = recentLeavesData?.leaves || [];
  const pendingLeaves = pendingLeavesData?.leaves?.filter((l: any) => l.status === 'pending') || [];

  // Derive first name for greeting
  const fullName: string | undefined = profileData?.profile?.fullName || profileData?.profile?.username;
  const firstName = fullName ? fullName.trim().split(/\s+/)[0] : 'User';

  // Combine attendance and leave activities
  const allActivities = [
    ...activities.map((a: any) => ({
      ...a,
      type: 'attendance',
      // Prefer precise backend timestamp (ISO). Fallback to parsing time string.
      timestamp: a.timestamp ? new Date(a.timestamp).getTime() : (a.time ? new Date(a.time).getTime() : Date.now())
    })),
    ...recentLeaves.slice(0, 3).map((leave: any) => ({
      id: leave.id,
      user: 'You',
      action: `Applied for ${leave.type}`,
      time: leave.appliedOn,
      status: leave.status,
      type: 'leave',
      timestamp: new Date(leave.appliedOn).getTime(),
      days: leave.days
    }))
  ].sort((a, b) => b.timestamp - a.timestamp).slice(0, 5);

  const getActivityIcon = (type: string, status?: string, action?: string) => {
    // Match icons from screenshot - icons represent actions, not outcomes
    if (action === 'Checked in') {
      return <ArrowDownCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    }
    if (action === 'Checked out') {
      return <ArrowUpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    if (action === 'Requested attendance correction') {
      return <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    }
    // For leave activities, always show document icon (action-focused, not status-focused)
    if (type === 'leave') {
      return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    }
    // Fallback neutral icon
    return <Calendar className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, action?: string) => {
    // Handle check-in/check-out actions
    if (action === 'Checked in') {
      return (
        <Badge variant="outline" className="bg-transparent border-transparent text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="text-foreground">Check In</span>
        </Badge>
      );
    }
    if (action === 'Checked out') {
      return (
        <Badge variant="outline" className="bg-transparent border-transparent text-foreground flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-foreground">Check Out</span>
        </Badge>
      );
    }
    
    switch (status) {
      case 'present':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            Present
          </Badge>
        );
      case 'late':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
            Late
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-foreground">Pending</span>
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-foreground">Approved</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-foreground flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-foreground">Rejected</span>
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
            Absent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700">
            {status}
          </Badge>
        );
    }
  };

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
      <div className="max-w-[1600px] mx-auto space-y-6">
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

        {showStatsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            title="Total Employees" 
            value={stats.totalEmployees || 0} 
            icon={Users} 
            trend={
              typeof stats.employeesGrowthPct === 'number'
                ? `${stats.employeesGrowthPct >= 0 ? '+' : ''}${stats.employeesGrowthPct}% vs last month`
                : '—'
            }
            trendUp={(stats.employeesGrowthPct ?? 0) >= 0}
          />
          <StatCard 
            title="Present Today" 
            value={stats.presentToday || 0} 
            icon={UserCheck} 
            trend={`${(stats.attendanceRate ?? 0).toFixed ? (stats.attendanceRate as number).toFixed(1) : stats.attendanceRate || 0}% this month`} 
            trendUp={true} 
          />
          <StatCard 
            title="Pending Leaves" 
            value={stats.pendingLeaves || 0} 
            icon={Clock} 
          />
          <StatCard 
            title="Attendance Rate" 
            value={`${stats.attendanceRate || 0}%`} 
            icon={TrendingUp} 
            trend={
              typeof stats.attendanceRateDiff === 'number'
                ? `${stats.attendanceRateDiff >= 0 ? '+' : ''}${stats.attendanceRateDiff}% vs last month`
                : '—'
            }
            trendUp={(stats.attendanceRateDiff ?? 0) >= 0} 
          />
          </div>
        )}

        {/* Admin Activity + Not Checked In */}
        <AdminOverviewSection />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">New Hires This Month</span>
                <span className="font-semibold">{stats.newHiresThisMonth ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Employees on Leave Today</span>
                <span className="font-semibold">{stats.employeesOnLeaveToday ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pending Leaves</span>
                <span className="font-semibold">{stats.pendingLeaves ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Work Hours / Day</span>
                <span className="font-semibold">{stats.avgHoursPerDay ? `${stats.avgHoursPerDay} hrs` : '0.0 hrs'}</span>
              </div>
            </div>
          </Card>
          <TodayBreakdownCard />
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
              <span className="text-5xl font-bold">{firstName}</span>
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
        {showStatsLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="relative overflow-hidden border shadow-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16" />
            <div className="p-8 relative">
              <AttendanceButton />
              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{stats.presentDays || 0}</span>
                  <span className="text-muted-foreground">days</span>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Leave Balance - Minimal */}
        {showLeaveLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Leave Balance</p>
                <p className="text-4xl font-bold">
                  {(leaveBalance.sickLeave?.total - leaveBalance.sickLeave?.used || 0) + 
                   (leaveBalance.vacation?.total - leaveBalance.vacation?.used || 0) + 
                   (leaveBalance.personalLeave?.total - leaveBalance.personalLeave?.used || 0)}
                </p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sick Leave</span>
                <span className="font-medium">{leaveBalance.sickLeave?.total - leaveBalance.sickLeave?.used || 0} left</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vacation</span>
                <span className="font-medium">{leaveBalance.vacation?.total - leaveBalance.vacation?.used || 0} left</span>
              </div>
            </div>
          </div>
        </Card>
        )}

        {/* Performance - Simple */}
        {showStatsLoading ? (
          <Skeleton className="h-64" />
        ) : (
          <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">{stats.attendanceRate || 0}%</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className={(stats.attendanceRateDiff ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}>
                {(stats.attendanceRateDiff ?? 0) >= 0 ? '↑' : '↓'} {Math.abs(stats.attendanceRateDiff ?? 0)}%
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        </Card>
        )}
      </div>

      {/* Recent Activity - Matching This Week Design */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent Activity Card */}
        {showRecentLeavesLoading ? (
          <Card className="border shadow-sm lg:col-span-3 p-6">
            <Skeleton className="h-8 w-48 mb-5" />
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-20" />
              ))}
            </div>
          </Card>
        ) : (
          <Card className="border shadow-sm lg:col-span-3">
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Recent Activity</h2>
              <Link href="/activity">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </Link>
            </div>
            <div className="space-y-3">
              {allActivities.map((activity: any, index: number) => (
                <div 
                  key={activity.id || index}
                  className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors ${
                    index !== allActivities.length - 1 ? 'border-b' : ''
                  }`}
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                    {getActivityIcon(activity.type, activity.status, activity.action)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">
                      {activity.action}
                      {activity.days && <span className="text-muted-foreground"> ({activity.days} days)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                  {!(activity.action === 'Checked in' || activity.action === 'Checked out') && (
                    <div className="flex-shrink-0">
                      {getStatusBadge(activity.status, activity.action)}
                    </div>
                  )}
                </div>
              ))}
              {allActivities.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </Card>
        )}

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
                    <span className="text-2xl font-bold">{stats.weekTotalHours?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b">
                    <span className="text-sm text-muted-foreground">Days Worked</span>
                    <span className="text-2xl font-bold">{stats.weekPresentDays || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Daily Average</span>
                    <span className="text-2xl font-bold">{stats.weekAvgHours?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
    </div>
  );
}

function AdminOverviewSection() {
  const { data: adminActivityData, isLoading: isAdminActivityLoading } = useQuery({
    queryKey: ['admin-activity'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/activity', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch admin activity');
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: notCheckedInData, isLoading: isNotCheckedInLoading } = useQuery({
    queryKey: ['admin-not-checked-in'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/not-checked-in-today', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch not-checked-in');
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: topEmployeesData, isLoading: isTopEmployeesLoading } = useQuery({
    queryKey: ['admin-top-employees'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/top-employees', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch top employees');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });

  const adminActivities = adminActivityData?.activities || [];
  const notCheckedIn = notCheckedInData?.employees || [];
  const top = topEmployeesData || {};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Admin Recent Activity */}
      <Card className="p-6 lg:col-span-2">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Recent Admin Activity</h3>
          <Link href="/activity">
            <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              View all →
            </button>
          </Link>
        </div>
        {isAdminActivityLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : adminActivities.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">No recent admin actions</div>
        ) : (
          <div className="space-y-0">
            {adminActivities.slice(0, 5).map((a: any, i: number) => (
              <div key={a.id}>
                <div className="flex items-center gap-4 p-3 hover:bg-muted/50 rounded-md">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                    {/* Icon based on action */}
                    {a.action.includes('leave') ? (
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Clock className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.action}</p>
                    <p className="text-xs text-muted-foreground">{a.user} • {a.time}</p>
                  </div>
                </div>
                {i < Math.min(5, adminActivities.length) - 1 && <div className="border-b" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Right: Not Checked In Today */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2"><UserX className="w-4 h-4" /> Not Checked In</h3>
          <span className="text-sm text-muted-foreground">Today</span>
        </div>
        {isNotCheckedInLoading ? (
          <div className="space-y-3">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : notCheckedIn.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Everyone has checked in</div>
        ) : (
          <div className="space-y-0 max-h-72 overflow-y-auto no-scrollbar">
            {notCheckedIn.map((e: any, i: number) => (
              <div key={e.id}>
                <div className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{e.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{e.position} • {e.department}</p>
                  </div>
                </div>
                {i < notCheckedIn.length - 1 && <div className="border-b" />}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Bottom: Top Employees Summary */}
      <div className="lg:col-span-3 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2"><Trophy className="w-4 h-4" /> Most Worked</h4>
          </div>
          {isTopEmployeesLoading ? (
            <Skeleton className="h-10 mt-4" />
          ) : top.mostWorked && (top.mostWorked.metrics?.hours ?? 0) > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{top.mostWorked.name}</p>
              <p className="text-xs text-muted-foreground">{Number(top.mostWorked.metrics.hours.toFixed(1))} hrs this month</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">—</p>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2"><Target className="w-4 h-4" /> Most Regular</h4>
          </div>
          {isTopEmployeesLoading ? (
            <Skeleton className="h-10 mt-4" />
          ) : top.mostRegular && (((top.mostRegular.metrics?.present ?? 0) + (top.mostRegular.metrics?.late ?? 0)) > 0) ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{top.mostRegular.name}</p>
              <p className="text-xs text-muted-foreground">{(top.mostRegular.metrics.present + top.mostRegular.metrics.late)} days present/late</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">—</p>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2"><Clock4 className="w-4 h-4" /> Most Punctual</h4>
          </div>
          {isTopEmployeesLoading ? (
            <Skeleton className="h-10 mt-4" />
          ) : top.mostPunctual && ((top.mostPunctual.metrics?.late ?? 0) > 0) ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{top.mostPunctual.name}</p>
              <p className="text-xs text-muted-foreground">{top.mostPunctual.metrics.late} late days</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">—</p>
          )}
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold flex items-center gap-2"><ThumbsDown className="w-4 h-4" /> Most Absent</h4>
          </div>
          {isTopEmployeesLoading ? (
            <Skeleton className="h-10 mt-4" />
          ) : top.mostAbsent && (top.mostAbsent.metrics?.absent ?? 0) > 0 ? (
            <div className="mt-4">
              <p className="text-sm font-medium">{top.mostAbsent.name}</p>
              <p className="text-xs text-muted-foreground">{top.mostAbsent.metrics.absent} absent days</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mt-4">—</p>
          )}
        </Card>
      </div>
    </div>
  );
}

function TodayBreakdownCard() {
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['admin-today-breakdown'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/today-breakdown', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch today breakdown');
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const breakdown = todayData || { present: 0, late: 0, absent: 0, leave: 0, notCheckedIn: 0 };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Today Breakdown</h3>
      {isLoading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-6" />
          ))}
        </div>
      ) : (
        <div className="space-y-4 text-sm">
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Present</span><span className="font-semibold">{breakdown.present}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Late</span><span className="font-semibold">{breakdown.late}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">On Leave</span><span className="font-semibold">{breakdown.leave}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Absent</span><span className="font-semibold">{breakdown.absent}</span></div>
          <div className="flex items-center justify-between"><span className="text-muted-foreground">Not Checked In</span><span className="font-semibold">{breakdown.notCheckedIn}</span></div>
        </div>
      )}
    </Card>
  );
}
