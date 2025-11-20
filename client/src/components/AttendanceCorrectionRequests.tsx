import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileEdit, Clock, Calendar, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AttendanceCorrectionRequests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewAction, setReviewAction] = useState<'approved' | 'rejected'>('approved');

  const { data: correctionsData, isLoading } = useQuery({
    queryKey: ['/api/attendance/corrections/pending'],
    queryFn: async () => {
      const response = await fetch('/api/attendance/corrections/pending', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to fetch correction requests');
      return response.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const response = await fetch(`/api/attendance/corrections/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, reviewNotes: notes })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to review request');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/corrections/pending'] });
      toast({
        title: "Success",
        description: `Request ${reviewAction === 'approved' ? 'approved' : 'rejected'} successfully.`,
      });
      setReviewDialogOpen(false);
      setSelectedRequest(null);
      setReviewNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review request.",
        variant: "destructive",
      });
    }
  });

  const handleReview = (request: any, action: 'approved' | 'rejected') => {
    setSelectedRequest(request);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const submitReview = () => {
    if (!selectedRequest) return;
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: reviewAction,
      notes: reviewNotes
    });
  };

  const corrections = correctionsData?.corrections || [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Attendance Correction Requests</CardTitle>
          <CardDescription>Pending requests awaiting review</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Attendance Correction Requests</CardTitle>
              <CardDescription>Pending requests awaiting review</CardDescription>
            </div>
            <Badge variant="outline" className="gap-2">
              <AlertCircle className="h-3 w-3" />
              {corrections.length} Pending
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {corrections.length === 0 ? (
            <div className="text-center py-12">
              <FileEdit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No pending correction requests</p>
            </div>
          ) : (
            <div className="space-y-4">
              {corrections.map((request: any) => (
                <Card key={request.id} className="border-l-4 border-l-yellow-500">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Employee Info */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Employee</p>
                        <p className="font-semibold">{request.user.name}</p>
                        <p className="text-sm text-muted-foreground">{request.user.employeeId}</p>
                      </div>

                      {/* Attendance Details */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Attendance</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.attendance.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{request.attendance.checkIn} - {request.attendance.checkOut}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {request.attendance.status}
                        </Badge>
                      </div>

                      {/* Reason */}
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">Reason</p>
                        <p className="text-sm line-clamp-3">{request.reason}</p>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2 flex flex-col justify-center">
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="gap-1"
                            onClick={() => handleReview(request, 'approved')}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1"
                            onClick={() => handleReview(request, 'rejected')}
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approved' ? 'Approve' : 'Reject'} Correction Request
            </DialogTitle>
            <DialogDescription>
              {reviewAction === 'approved' 
                ? 'Approve this attendance correction request' 
                : 'Reject this attendance correction request'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRequest && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Employee:</span>
                  <span className="font-medium">{selectedRequest.user.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Date:</span>
                  <span className="font-medium">{selectedRequest.attendance.date}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Reason:</span>
                  <p className="text-sm mt-1">{selectedRequest.reason}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="review-notes">Review Notes (Optional)</Label>
                <Textarea
                  id="review-notes"
                  placeholder="Add any notes about your decision..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialogOpen(false);
                setReviewNotes("");
              }}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              variant={reviewAction === 'approved' ? 'default' : 'destructive'}
            >
              {reviewMutation.isPending ? 'Processing...' : `Confirm ${reviewAction === 'approved' ? 'Approval' : 'Rejection'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
