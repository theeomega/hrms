import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Calendar, Info, AlertCircle, CheckCircle2, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";

export default function LeaveRequestDetail() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reviewNotes, setReviewNotes] = useState("");

  // Determine if this is being viewed by employee (/leaves/:id) or admin (/leave-requests/:id)
  const isEmployeeView = window.location.pathname.startsWith("/leaves/");

  // Fetch the specific leave request
  const { data: allLeavesData, isLoading } = useQuery<any>({
    queryKey: ['/api/leave/requests-admin'],
    queryFn: async () => {
      const response = await fetch('/api/leave/requests', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to fetch leave requests');
      return response.json();
    },
  });

  const leave = allLeavesData?.leaves?.find((l: any) => l.id === params.id);
  const isCompleted = leave?.status !== 'pending';

  // Helpers for consistent date parsing
  const toDate = (val?: string | null) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };
  const submittedAt = toDate(leave?.appliedOnISO || leave?.appliedOn);
  const reviewedAt = isCompleted
    ? (leave?.status === 'approved'
        ? toDate(leave?.approvalDateISO || leave?.approvalDate)
        : toDate(leave?.updatedAtISO))
    : null;
  const reviewedBy = leave?.status === 'approved' ? leave?.approvedBy : undefined;

  // Initialize form fields when data loads
  useEffect(() => {
    if (leave?.reviewNotes) {
      setReviewNotes(leave.reviewNotes);
    }
  }, [leave]);

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/leave/approve/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notes: reviewNotes })
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
      // Admins go back to admin list, employees go back to their leaves
      setTimeout(() => navigate(isEmployeeView ? "/leaves" : "/leave-requests"), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve leave request.",
        variant: "destructive",
      });
    }
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/leave/reject/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: reviewNotes || 'Rejected by admin' })
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
      setTimeout(() => navigate(isEmployeeView ? "/leaves" : "/leave-requests"), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reject leave request.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = () => {
    approveMutation.mutate();
  };

  const handleReject = () => {
    rejectMutation.mutate();
  };

  const getLeaveTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "sick leave": return "bg-red-500";
      case "vacation": return "bg-blue-500";
      case "personal leave": return "bg-purple-500";
      default: return "bg-gray-500";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-full">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : !leave ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Request Not Found</h2>
          <p className="text-muted-foreground">The leave request doesn't exist or has been processed.</p>
          <Button onClick={() => navigate(isEmployeeView ? "/leaves" : "/leave-requests")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Leave Requests
          </Button>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(isEmployeeView ? "/leaves" : "/leave-requests")}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Main Grid - Two Columns */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Employee Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Profile Section */}
                  <div className="flex items-center gap-6 pb-6 border-b">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-primary/10 text-primary font-medium text-xl">
                        {getInitials(leave.employeeName || leave.user?.name || leave.user?.username || 'Unknown')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-0.5">{leave.employeeName || leave.user?.name || leave.user?.username || 'Unknown Employee'}</h3>
                      <p className="text-sm text-muted-foreground mb-3">ID: {leave.employeeId || leave.user?.employeeId || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {leave.email || leave.user?.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Other Details */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Designation</p>
                      <p className="font-medium">{leave.position || leave.role || leave.user?.position || leave.user?.role || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Department</p>
                      <p className="font-medium">{leave.department || leave.user?.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Reporting Manager</p>
                      <p className="font-medium">{leave.manager || leave.user?.manager || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Leave Information and Reason - Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leave Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Leave Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Leave Type</p>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${getLeaveTypeColor(leave.type)}`} />
                        <span className="font-medium">{leave.type}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Start Date</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium">{leave.startDate}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">End Date</p>
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="font-medium">{leave.endDate}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Duration</p>
                      <p className="font-medium">{leave.days} day{leave.days !== 1 ? 's' : ''}</p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Applied On</p>
                      <p className="font-medium">{leave.appliedOn}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Reason for Leave */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reason for Leave</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {leave.reason}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Admin Review (admin view) or Admin Notes (employee view) */}
              {!isEmployeeView ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Review</CardTitle>
                    <CardDescription className="text-xs">
                      {isCompleted
                        ? "This request has been processed and is read-only."
                        : "Add notes about your decision (optional)"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Admin Notes */}
                    <div className="space-y-2">
                      <Label htmlFor="reviewNotes" className="text-xs text-muted-foreground">Admin Notes (Optional)</Label>
                      <Textarea
                        id="reviewNotes"
                        placeholder={isCompleted && !leave.reviewNotes ? "No notes were added." : "Add notes about this decision..."}
                        value={isCompleted ? leave.reviewNotes || "" : reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        className={`min-h-[120px] resize-none border-gray-200 text-sm ${isCompleted ? 'bg-muted/50 cursor-not-allowed opacity-70' : ''}`}
                        disabled={isCompleted}
                        readOnly={isCompleted}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg border border-dashed border-muted bg-muted/30 px-3 py-3 min-h-[72px] flex items-start">
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {leave.reviewNotes && leave.reviewNotes.trim()
                          ? leave.reviewNotes
                          : "No additional notes were added for this request."}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Sticky */}
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* Top of right column: Employee Status card OR Admin Actions */}
              {isEmployeeView ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base font-medium">Request Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="flex items-center justify-center rounded-lg border-2 border-dashed p-6 bg-muted/30"
                      style={{
                        borderColor:
                          leave.status === 'approved'
                            ? '#22c55e'
                            : leave.status === 'rejected'
                            ? '#ef4444'
                            : '#eab308',
                      }}
                    >
                      <div className="text-center space-y-2">
                        <div className="inline-flex items-center justify-center">
                          <div
                            className={`h-16 w-16 rounded-full flex items-center justify-center ${
                              leave.status === 'approved'
                                ? 'bg-green-500/10'
                                : leave.status === 'rejected'
                                ? 'bg-red-500/10'
                                : 'bg-yellow-500/10'
                            }`}
                          >
                            <div
                              className={`h-8 w-8 rounded-full ${
                                leave.status === 'approved'
                                  ? 'bg-green-500'
                                  : leave.status === 'rejected'
                                  ? 'bg-red-500'
                                  : 'bg-yellow-500'
                              }`}
                            />
                          </div>
                        </div>
                        <p
                          className={`text-sm font-semibold capitalize ${
                            leave.status === 'approved'
                              ? 'text-emerald-700'
                              : leave.status === 'rejected'
                              ? 'text-rose-700'
                              : 'text-amber-700'
                          }`}
                        >
                          {leave.status}
                        </p>
                        {reviewedAt && (
                          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(reviewedAt, 'MMM dd, yyyy, h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="text-base font-medium">Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={handleApprove}
                      disabled={approveMutation.isPending || rejectMutation.isPending || isCompleted}
                      className="w-full h-12 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {approveMutation.isPending ? "Processing..." : "Approve"}
                    </Button>
                    <Button
                      onClick={handleReject}
                      disabled={approveMutation.isPending || rejectMutation.isPending || isCompleted}
                      variant="outline"
                      className="w-full h-12 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {rejectMutation.isPending ? "Processing..." : "Reject"}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Request Timeline */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">Timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-0">
                  <div className="relative">
                    {/* Vertical line */}
                    {isCompleted && <div className="absolute left-[5.5px] top-2.5 bottom-2.5 w-px bg-muted-foreground/20"></div>}
                    
                    {/* Submitted Item */}
                    <div className="relative flex items-start gap-3 mb-4">
                      <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 flex-shrink-0 z-10 border-2 border-background"></div>
                      <div className="flex-1 min-w-0 -mt-0.5">
                        <p className="text-sm font-medium mb-0.5">Submitted</p>
                        {submittedAt && (
                          <p className="text-xs text-muted-foreground">
                            {format(submittedAt, 'MMM dd, yyyy, h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Reviewed Item - Conditional */}
                    {isCompleted && (
                      <div className="relative flex items-start gap-3">
                        <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 z-10 border-2 border-background ${
                          leave.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <div className="flex-1 min-w-0 -mt-0.5">
                          <p className="text-sm font-medium mb-0.5 capitalize">
                            {leave.status}
                          </p>
                          {reviewedAt && (
                            <p className="text-xs text-muted-foreground">
                              {format(reviewedAt, 'MMM dd, yyyy, h:mm a')}
                            </p>
                          )}
                          {reviewedBy && (
                            <p className="text-xs text-muted-foreground">
                              by {reviewedBy}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Info Alert */}
              <div className="bg-muted/40 border border-muted rounded-lg p-3">
                <div className="flex gap-2.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Approved leaves will deduct from the employee's leave balance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
