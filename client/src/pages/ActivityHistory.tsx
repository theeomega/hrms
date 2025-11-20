import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Search, Filter, UserCheck, Clock, FileText, CheckCircle, XCircle, Calendar, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { Link } from "wouter";

export default function ActivityHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Fetch profile to determine role
  const { data: profileData } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await fetch('/api/profile', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });
  const role: string | undefined = profileData?.profile?.role;
  const isAdmin = role === 'admin' || role === 'hr_admin';

  // Fetch activity data: use admin-specific endpoint when admin
  const { data: activityData, isLoading } = useQuery({
    queryKey: [isAdmin ? 'admin-activity-history' : 'activity-history'],
    queryFn: async () => {
      const endpoint = isAdmin ? '/api/dashboard/admin/activity' : '/api/dashboard/activity';
      const response = await fetch(endpoint, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch activity');
      return response.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  // Fetch recent leave requests (only for non-admin users' activity history)
  const { data: leavesData, isLoading: isLeavesLoading } = useQuery({
    queryKey: ['activity-leaves'],
    enabled: !isAdmin,
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leaves');
      return response.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const activities = activityData?.activities || [];
  const leaves = leavesData?.leaves || [];

  // Only show skeleton on initial load
  const showLoading = (isLoading || (!isAdmin && isLeavesLoading)) && !activityData && (!isAdmin && !leavesData);

  // Build unified activities list
  const allActivities = useMemo(() => {
    if (isAdmin) {
      // Admin: only admin actions
      return activities.map((a: any) => ({
        ...a,
        type: 'admin',
        timestamp: a.timestamp ? new Date(a.timestamp).getTime() : (a.time ? new Date(a.time).getTime() : Date.now())
      })).sort((a: any, b: any) => b.timestamp - a.timestamp);
    }
    // Employee/self view: attendance + leave applications
    return [
      ...activities.map((a: any) => ({
        ...a,
        type: 'attendance',
        timestamp: a.timestamp ? new Date(a.timestamp).getTime() : (a.time ? new Date(a.time).getTime() : Date.now())
      })),
      ...leaves.map((leave: any) => ({
        id: leave.id,
        user: 'You',
        action: `Applied for ${leave.type}`,
        time: leave.appliedOn,
        status: leave.status,
        type: 'leave',
        timestamp: new Date(leave.appliedOn).getTime(),
        days: leave.days,
        startDate: leave.startDate,
        endDate: leave.endDate
      }))
    ].sort((a, b) => b.timestamp - a.timestamp);
  }, [activities, leaves, isAdmin]);

  // Filter activities
  const filteredActivities = useMemo(() => {
    return allActivities.filter((activity: any) => {
      const matchesSearch = activity.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (activity.time && activity.time.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesType = filterType === 'all' || activity.type === filterType;
      const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [allActivities, searchTerm, filterType, filterStatus]);

  // Pagination
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredActivities.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredActivities, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType, filterStatus]);

  const getActivityIcon = (type: string, action?: string, status?: string) => {
    // Match icons as in admin dashboard Recent Admin Activity box
    if (type === 'admin') {
      if (action?.includes('leave')) {
        // Any leave approval/rejection
        return <FileText className="w-5 h-5 text-blue-600" />;
      }
      // All other admin actions (attendance correction, notification, update)
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
    // Employee actions
    if (action === 'Checked in') {
      return <ArrowDownCircle className="w-5 h-5 text-green-600" />;
    }
    if (action === 'Checked out') {
      return <ArrowUpCircle className="w-5 h-5 text-blue-600" />;
    }
    if (action === 'Requested attendance correction') {
      return <Clock className="w-5 h-5 text-orange-600" />;
    }
    if (type === 'leave') {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    return <Calendar className="w-5 h-5 text-muted-foreground" />;
  };

  const getStatusBadge = (status: string, action?: string) => {
    // Don't show badge for check-in/check-out
    if (action === 'Checked in' || action === 'Checked out') {
      return null;
    }
    
    switch (status) {
      case 'present':
        return (
          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-700">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
            Present
          </Badge>
        );
      case 'late':
        return (
          <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
            <div className="w-2 h-2 rounded-full bg-amber-500 mr-1.5" />
            Late
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-yellow-500" />
            <span className="text-gray-800">Pending</span>
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-800">Approved</span>
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-transparent border-transparent text-gray-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-800">Rejected</span>
          </Badge>
        );
      case 'absent':
        return (
          <Badge variant="outline" className="border-red-200 bg-red-50 text-red-700">
            <div className="w-2 h-2 rounded-full bg-red-500 mr-1.5" />
            Absent
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-700">
            {status}
          </Badge>
        );
    }
  };

  if (showLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-8">
        <div className="relative">
          <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <Link href="/">
                <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-baseline gap-3">
                <h1 className="text-5xl font-light tracking-tight">Recent</h1>
                <span className="text-5xl font-bold">Activity</span>
              </div>
              <p className="text-muted-foreground text-lg ml-1">
                Complete history of all your activities
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>

        <Skeleton className="h-96" />
      </div>
    );
  }

  // Calculate stats
  const stats = isAdmin ? {
    total: filteredActivities.length,
    admin: filteredActivities.filter((a: any) => a.type === 'admin').length
  } : {
    total: filteredActivities.length,
    attendance: filteredActivities.filter((a: any) => a.type === 'attendance').length,
    leaves: filteredActivities.filter((a: any) => a.type === 'leave').length,
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">Recent</h1>
              <span className="text-5xl font-bold">Activity</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Complete history of all your activities
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{stats.total} Activities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Activities</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <Calendar className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>
        </Card>
        {isAdmin ? (
          <Card className="border shadow-sm">
            <div className="p-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Admin Actions</p>
                  <p className="text-3xl font-bold">{stats.admin}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
          </Card>
        ) : (
          <>
            <Card className="border shadow-sm">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Attendance Events</p>
                    <p className="text-3xl font-bold">{stats.attendance}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </Card>
            <Card className="border shadow-sm">
              <div className="p-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Leave Requests</p>
                    <p className="text-3xl font-bold">{stats.leaves}</p>
                  </div>
                  <FileText className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* Activity List */}
      <Card className="border shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">All Activities</h3>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search activities..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {isAdmin ? (
                  <SelectItem value="admin">Admin</SelectItem>
                ) : (
                  <>
                    <SelectItem value="attendance">Attendance</SelectItem>
                    <SelectItem value="leave">Leave</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Activity Items */}
          <div className="space-y-0">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No activities found</p>
              </div>
            ) : (
              <>
                {paginatedActivities.map((activity: any, index: number) => (
                  <div key={activity.id || index}>
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-muted">
                        {getActivityIcon(activity.type, activity.action, activity.status)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">
                          {activity.action}
                          {activity.days && <span className="text-muted-foreground"> ({activity.days} days)</span>}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-xs text-muted-foreground">{activity.time}</p>
                          {activity.startDate && activity.endDate && (
                            <span className="text-xs text-muted-foreground">
                              • {activity.startDate} to {activity.endDate}
                            </span>
                          )}
                        </div>
                      </div>
                      {getStatusBadge(activity.status, activity.action) && (
                        <div className="flex-shrink-0">
                          {getStatusBadge(activity.status, activity.action)}
                        </div>
                      )}
                    </div>
                    {index < paginatedActivities.length - 1 && (
                      <div className="border-b border-border"></div>
                    )}
                  </div>
                ))}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-6 mt-6 border-t">
                    <div className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredActivities.length)} of {filteredActivities.length} activities
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              className="w-9"
                              onClick={() => setCurrentPage(pageNum)}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
