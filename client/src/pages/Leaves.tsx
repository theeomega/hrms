import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, FileText, Plus, Download, Search, TrendingUp, CheckCircle, XCircle, Edit, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LeaveRequestDialog from "@/components/LeaveRequestDialog";
import { useToast } from "@/hooks/use-toast";

export default function Leaves() {
  const [, navigate] = useLocation();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const itemsPerPage = 50;

  // Fetch leave requests with real-time updates
  const { data: leaveData, isLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch leave balance with real-time updates
  const { data: balanceData } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      const response = await fetch('/api/leave/balance', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch system settings for fallbacks
  const { data: settings } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) throw new Error('Failed to fetch settings');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const leaveRequests = leaveData?.leaves || [];
  const balance = balanceData?.balance || {};

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !leaveData;

  const defaultSick = settings?.defaultSickLeave ?? 12;
  const defaultVacation = settings?.defaultVacationLeave ?? 15;
  const defaultPersonal = settings?.defaultPersonalLeave ?? 5;

  const mockLeaveBalance = [
    { type: "Sick Leave", used: balance.sickLeave?.used ?? 0, total: balance.sickLeave?.total ?? defaultSick },
    { type: "Vacation", used: balance.vacation?.used ?? 0, total: balance.vacation?.total ?? defaultVacation },
    { type: "Personal Leave", used: balance.personalLeave?.used ?? 0, total: balance.personalLeave?.total ?? defaultPersonal },
  ];

  const filteredRequests = useMemo(() => {
    let filtered = leaveRequests;

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter((req: any) => req.status === filter);
    }

    // Leave type filter
    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter((req: any) => req.type === leaveTypeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter((req: any) =>
        req.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.startDate.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    if (sortBy === "recent") {
      filtered = [...filtered].reverse();
    } else if (sortBy === "oldest") {
      filtered = [...filtered];
    }

    return filtered;
  }, [leaveRequests, filter, searchTerm, leaveTypeFilter, sortBy]);

  // Paginated data
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredRequests.slice(startIndex, endIndex);
  }, [filteredRequests, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filter, leaveTypeFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRequests = leaveRequests.length;
    const approvedCount = leaveRequests.filter((r: any) => r.status === "approved").length;
    const pendingCount = leaveRequests.filter((r: any) => r.status === "pending").length;
    const rejectedCount = leaveRequests.filter((r: any) => r.status === "rejected").length;
    const totalDaysUsed = leaveRequests
      .filter((r: any) => r.status === "approved")
      .reduce((acc: number, r: any) => acc + r.days, 0);
    
    return { totalRequests, approvedCount, pendingCount, rejectedCount, totalDaysUsed };
  }, [leaveRequests]);

  const handleCancelRequest = (id: string) => {
    console.log("Cancel request:", id);
    // TODO: Implement cancel logic
  };

  const handleEditRequest = (id: string) => {
    console.log("Edit request:", id);
    // TODO: Implement edit logic
  };

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['Leave Type', 'Start Date', 'End Date', 'Days', 'Reason', 'Applied On', 'Status'];
    const csvData = filteredRequests.map((request: any) => [
      request.type,
      request.startDate,
      request.endDate,
      request.days,
      request.reason,
      request.appliedOn,
      request.status
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `leave_requests_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved": return "bg-green-500/10 text-green-700 border-green-200";
      case "pending": return "bg-amber-500/10 text-amber-700 border-amber-200";
      case "rejected": return "bg-red-500/10 text-red-700 border-red-200";
      default: return "bg-gray-500/10 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Unique Minimal Header - Split Design */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">My</h1>
              <span className="text-5xl font-bold">Leaves</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Manage your time off and leave requests
            </p>
          </div>
          <div className="text-right space-y-2">
            <LeaveRequestDialog />
          </div>
        </div>
      </div>

      {/* Leave Balance & Stats - Hero Cards */}
      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {mockLeaveBalance.map((leave, index) => (
          <Card key={index} className="border shadow-sm">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{leave.type}</p>
                  <p className="text-4xl font-bold">{leave.total - leave.used}</p>
                </div>
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">days remaining</p>
            </div>
          </Card>
        ))}
        
        {/* Statistics Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Days Off</p>
                <p className="text-4xl font-bold">{stats.totalDaysUsed}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">used this year</p>
          </div>
        </Card>
        </div>
      )}

      {/* Leave History - Combined Filter & Table */}
      <Card className="border shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
              <h2 className="text-lg font-semibold">Leave History</h2>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                variant={filter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("pending")}
              >
                Pending
              </Button>
              <Button
                variant={filter === "approved" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("approved")}
              >
                Approved
              </Button>
              <Button
                variant={filter === "rejected" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("rejected")}
              >
                Rejected
              </Button>
              <Button variant="outline" size="sm" onClick={handleExport} className="gap-1 ml-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by type, reason, or date..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Leave Type Filter */}
            <Select value={leaveTypeFilter} onValueChange={setLeaveTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Vacation">Vacation</SelectItem>
                <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                <SelectItem value="Personal Leave">Personal</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No leave requests found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || leaveTypeFilter !== "all" 
                ? "Try adjusting your filters to see more results"
                : "You haven't applied for any leaves in this category"}
            </p>
            <LeaveRequestDialog />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Leave Type</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Days</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Applied On</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRequests.map((request) => (
                <TableRow
                  key={request.id}
                  className="hover:bg-muted/50"
                >
                  <TableCell className="font-medium">{request.type}</TableCell>
                  <TableCell>{request.startDate}</TableCell>
                  <TableCell>{request.endDate}</TableCell>
                  <TableCell>{request.days}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{request.reason}</TableCell>
                  <TableCell className="text-muted-foreground">{request.appliedOn}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        request.status === 'approved' ? 'bg-emerald-500' : 
                        request.status === 'pending' ? 'bg-amber-500' : 
                        'bg-rose-500'
                      }`} />
                      <span className="text-sm capitalize">{request.status}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/leaves/${request.id}`)}>
                          View Detail
                        </DropdownMenuItem>
                        {request.status === "pending" && (
                          <>
                            <DropdownMenuItem onClick={() => handleEditRequest(request.id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Request
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleCancelRequest(request.id)}
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Cancel Request
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {/* Pagination */}
        {filteredRequests.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRequests.length)} of {filteredRequests.length} requests
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
                {currentPage > 2 && (
                  <>
                    <Button
                      variant={currentPage === 1 ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </Button>
                    {currentPage > 3 && <span className="text-muted-foreground px-1">...</span>}
                  </>
                )}
                {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                  const pageNum = currentPage === 1 ? i + 1 : 
                                 currentPage === totalPages ? totalPages - 2 + i :
                                 currentPage - 1 + i;
                  if (pageNum < 1 || pageNum > totalPages) return null;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                {currentPage < totalPages - 1 && (
                  <>
                    {currentPage < totalPages - 2 && <span className="text-muted-foreground px-1">...</span>}
                    <Button
                      variant={currentPage === totalPages ? "default" : "outline"}
                      size="sm"
                      className="w-9 h-9 p-0"
                      onClick={() => setCurrentPage(totalPages)}
                    >
                      {totalPages}
                    </Button>
                  </>
                )}
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
      </Card>

      {/* Help Section */}
      <Card className="border shadow-sm bg-muted/20">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Leave Policy</h3>
          <p className="text-muted-foreground text-sm">
            You can apply for leaves at least 2 days in advance. For emergency leaves, 
            please contact HR directly. Your manager will review and approve your request 
            within 24 hours.
          </p>
        </div>
      </Card>
    </div>
  );
}
