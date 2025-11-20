import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";

export default function LeaveRequests() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all leave requests with real-time updates
  const { data: leaveData, isLoading } = useQuery({
    queryKey: ['/api/leave/requests-admin'],
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 2000, // Refresh every 2 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });

  const allRequests = leaveData?.leaves || [];
  
  // Filter by status
  const pendingRequests = allRequests.filter((r: any) => r.status === 'pending');
  const approvedRequests = allRequests.filter((r: any) => r.status === 'approved');
  const rejectedRequests = allRequests.filter((r: any) => r.status === 'rejected');

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !leaveData;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leave/approve/${id}`, {
        method: 'POST',
        credentials: 'include'
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to approve leave');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave/requests-admin'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      toast({
        title: "Leave Approved",
        description: "The leave request has been approved successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Approval Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/leave/reject/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: 'Rejected by admin' })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to reject leave');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/leave/requests-admin'] });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
      toast({
        title: "Leave Rejected",
        description: "The leave request has been rejected",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Rejection Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "sick leave": return "bg-red-500";
      case "vacation": return "bg-blue-500";
      case "personal leave": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const renderLeaveList = (requests: any[], emptyMessage: string) => {
    if (requests.length === 0) {
      return (
        <Card className="py-16 border-dashed">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileText className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground">No leave requests found in this category.</p>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] px-6">Employee</TableHead>
              <TableHead className="w-[150px] px-6">Leave Type</TableHead>
              <TableHead className="w-[200px] px-6">Duration</TableHead>
              <TableHead className="w-[80px] px-6">Days</TableHead>
              <TableHead className="w-[150px] text-right px-6">Applied</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {requests.map((request: any) => (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/leave-requests/${request.id}`)}
              >
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                        {getInitials(request.employeeName || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.employeeName || 'Unknown Employee'}</p>
                      <p className="text-xs text-muted-foreground truncate max-w-[200px]">{request.reason}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getLeaveTypeColor(request.type)}`} />
                    <span>{request.type}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6">
                  <div className="flex items-center gap-1 text-sm">
                    <span>{request.startDate} - {request.endDate}</span>
                  </div>
                </TableCell>
                <TableCell className="px-6">
                  <div className="flex items-center gap-1 text-sm">
                    <span>{request.days} days</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground px-6">
                  {(() => {
                    try {
                      const date = new Date(request.appliedOn);
                      if (isNaN(date.getTime())) {
                        return request.appliedOn;
                      }
                      return formatDistanceToNow(date, { addSuffix: true });
                    } catch {
                      return request.appliedOn;
                    }
                  })()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <p className="text-muted-foreground">Review and manage employee leave applications</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderLeaveList(pendingRequests, "No pending requests")}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {renderLeaveList(approvedRequests, "No approved requests")}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {renderLeaveList(rejectedRequests, "No rejected requests")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
