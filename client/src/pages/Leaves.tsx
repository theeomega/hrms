import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Clock, FileText, Plus, Download, Search, TrendingUp, CheckCircle, XCircle, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import LeaveRequestDialog from "@/components/LeaveRequestDialog";

const mockLeaveRequests = [
  { 
    id: "1", 
    type: "Vacation", 
    startDate: "Dec 20, 2025", 
    endDate: "Dec 25, 2025", 
    days: 5, 
    reason: "Holiday vacation",
    status: "approved" as const,
    appliedOn: "Nov 01, 2025"
  },
  { 
    id: "2", 
    type: "Sick Leave", 
    startDate: "Nov 05, 2025", 
    endDate: "Nov 06, 2025", 
    days: 2, 
    reason: "Medical appointment",
    status: "pending" as const,
    appliedOn: "Nov 03, 2025"
  },
  { 
    id: "3", 
    type: "Personal Leave", 
    startDate: "Oct 15, 2025", 
    endDate: "Oct 16, 2025", 
    days: 2, 
    reason: "Family event",
    status: "approved" as const,
    appliedOn: "Oct 10, 2025"
  },
  { 
    id: "4", 
    type: "Sick Leave", 
    startDate: "Sep 10, 2025", 
    endDate: "Sep 11, 2025", 
    days: 2, 
    reason: "Flu recovery",
    status: "approved" as const,
    appliedOn: "Sep 08, 2025"
  },
  { 
    id: "5", 
    type: "Vacation", 
    startDate: "Aug 05, 2025", 
    endDate: "Aug 09, 2025", 
    days: 5, 
    reason: "Summer vacation",
    status: "approved" as const,
    appliedOn: "Jul 15, 2025"
  },
  { 
    id: "6", 
    type: "Personal Leave", 
    startDate: "Jul 20, 2025", 
    endDate: "Jul 20, 2025", 
    days: 1, 
    reason: "Personal matters",
    status: "rejected" as const,
    appliedOn: "Jul 18, 2025"
  },
];

const mockLeaveBalance = [
  { type: "Sick Leave", used: 3, total: 12 },
  { type: "Vacation", used: 8, total: 15 },
  { type: "Personal Leave", used: 2, total: 5 },
];

export default function Leaves() {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [leaveTypeFilter, setLeaveTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  const filteredRequests = useMemo(() => {
    let filtered = mockLeaveRequests;

    // Status filter
    if (filter !== "all") {
      filtered = filtered.filter(req => req.status === filter);
    }

    // Leave type filter
    if (leaveTypeFilter !== "all") {
      filtered = filtered.filter(req => req.type === leaveTypeFilter);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(req =>
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
  }, [filter, searchTerm, leaveTypeFilter, sortBy]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalRequests = mockLeaveRequests.length;
    const approvedCount = mockLeaveRequests.filter(r => r.status === "approved").length;
    const pendingCount = mockLeaveRequests.filter(r => r.status === "pending").length;
    const rejectedCount = mockLeaveRequests.filter(r => r.status === "rejected").length;
    const totalDaysUsed = mockLeaveRequests
      .filter(r => r.status === "approved")
      .reduce((acc, r) => acc + r.days, 0);
    
    return { totalRequests, approvedCount, pendingCount, rejectedCount, totalDaysUsed };
  }, []);

  const handleCancelRequest = (id: string) => {
    console.log("Cancel request:", id);
    // TODO: Implement cancel logic
  };

  const handleEditRequest = (id: string) => {
    console.log("Edit request:", id);
    // TODO: Implement edit logic
  };

  const handleDeleteRequest = (id: string) => {
    console.log("Delete request:", id);
    // TODO: Implement delete logic
  };

  const handleExport = () => {
    console.log("Export leave data");
    // TODO: Implement export logic
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
              {filteredRequests.map((request) => (
                <TableRow key={request.id} className="hover:bg-muted/50">
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
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
                        <DropdownMenuItem 
                          onClick={() => handleDeleteRequest(request.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
