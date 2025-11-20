import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, Clock, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceCorrection() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [correctionReason, setCorrectionReason] = useState("");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch attendance record by ID
  const { data: attendanceResponse, isLoading, refetch } = useQuery<any>({
    queryKey: ['/api/attendance'],
    queryFn: async () => {
      const response = await fetch('/api/attendance?limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    staleTime: 0,
  });

  // Find the specific record from the fetched data
  const recordId = params.id;
  const attendanceRecords = attendanceResponse?.records || [];
  const record = Array.isArray(attendanceRecords)
    ? attendanceRecords.find((r: any) => r.id === recordId)
    : null;

  // Fetch user profile for display
  const { data: userData } = useQuery<any>({
    queryKey: ['/api/profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
  });

  const user = userData?.user;

  // Check if there's a pending correction for this record
  const { data: pendingCorrections } = useQuery<any>({
    queryKey: ['/api/attendance/corrections/pending'],
    queryFn: async () => {
      const res = await fetch('/api/attendance/corrections/pending', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch corrections');
      return res.json();
    },
    staleTime: 1000 * 60 * 1,
  });

  const existingCorrection = pendingCorrections?.corrections?.find(
    (c: any) => c.attendance?.id === recordId || c.attendance?._id === recordId
  );

  // Load existing note from record when it's available
  useEffect(() => {
    if (record?.notes) {
      setNote(record.notes);
    }
  }, [record]);

  const submitCorrection = async () => {
    if (!correctionReason.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide a reason for the correction request.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/attendance/${recordId}/request-correction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reason: correctionReason })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit request');
      }

      toast({
        title: "Request Submitted",
        description: "Your correction request has been submitted for review.",
      });

      setCorrectionReason("");
      // Invalidate queries to refetch data and show the new pending status
      await queryClient.invalidateQueries({ queryKey: ['/api/attendance/corrections/pending'] });
      await queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit correction request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitNote = async () => {
    if (!note.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a note to save.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/attendance/${recordId}/note`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ note })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save note');
      }

      toast({
        title: "Note Saved",
        description: "Your attendance note has been saved successfully.",
      });

      // Refetch the data to update the display
      await refetch();

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500";
      case "late": return "bg-yellow-500";
      case "absent": return "bg-red-500";
      case "leave": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
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
      ) : !record ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Record Not Found</h2>
          <p className="text-muted-foreground">The attendance record doesn't exist.</p>
          <Button onClick={() => navigate("/attendance")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Attendance
          </Button>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/attendance")}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Attendance Details Before Update */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Attendance Record</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Date</p>
                      <p className="font-medium">{record.date}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${getStatusColor(record.status)}`} />
                        <span className="font-medium capitalize">{record.status}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Check In</p>
                      <p className="font-medium">{record.checkIn || '--'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Check Out</p>
                      <p className="font-medium">{record.checkOut || '--'}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Hours</p>
                    <p className="font-medium">{record.hours ?? '--'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Request Correction */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Correction</CardTitle>
                  <CardDescription className="text-xs">
                    {existingCorrection
                      ? "Your correction request details"
                      : "Explain what needs to be corrected and why"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {existingCorrection ? (
                    <div className="space-y-4">
                      {/* Status Badge */}
                      <div className="flex items-center justify-between pb-3 border-b">
                        <span className="text-sm text-muted-foreground">Request Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${existingCorrection.status === 'pending'
                              ? 'bg-yellow-500'
                              : existingCorrection.status === 'approved'
                                ? 'bg-green-500'
                                : 'bg-red-500'
                            }`} />
                          <span className="text-sm font-medium capitalize">{existingCorrection.status}</span>
                        </div>
                      </div>

                      {/* Submitted Date */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Submitted On</span>
                        <span className="text-sm font-medium">
                          {format(new Date(existingCorrection.createdAt), 'MMM dd, yyyy, h:mm a')}
                        </span>
                      </div>

                      {/* Your Reason */}
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground">Your Reason:</p>
                        <div className="bg-muted/50 p-3 rounded-lg">
                          <p className="text-sm whitespace-pre-wrap">{existingCorrection.reason}</p>
                        </div>
                      </div>

                      {/* Admin Notes if available */}
                      {existingCorrection.reviewNotes && (
                        <div className="space-y-2 pt-2 border-t">
                          <p className="text-sm text-muted-foreground">Admin Notes:</p>
                          <div className="bg-muted/50 p-3 rounded-lg">
                            <p className="text-sm whitespace-pre-wrap">{existingCorrection.reviewNotes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <Textarea
                      placeholder="Describe what needs to be corrected and why..."
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      className="min-h-[120px] resize-none border-gray-200"
                      disabled={isSubmitting}
                    />
                  )}
                </CardContent>
                {!existingCorrection && (
                  <CardContent className="pt-0">
                    <Button
                      onClick={submitCorrection}
                      disabled={isSubmitting || !correctionReason.trim()}
                      className="w-full h-11 rounded-md"
                    >
                      {isSubmitting ? "Submitting..." : "Submit Correction Request"}
                    </Button>
                  </CardContent>
                )}
              </Card>

              {/* Personal Note */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Note</CardTitle>
                  <CardDescription className="text-xs">Add a private note for your reference (only you can see this)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {note && note.trim() ? (
                    <div className="space-y-3">
                      <div className="bg-gradient-to-br from-muted/50 to-muted/30 p-4 rounded-lg border border-muted">
                        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">{note}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Info className="h-3.5 w-3.5" />
                        <span>Click below to edit your note</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 px-4 border-2 border-dashed border-muted rounded-lg bg-muted/20">
                      <p className="text-sm text-muted-foreground mb-1">No note added yet</p>
                      <p className="text-xs text-muted-foreground/70">Add a personal note to keep track of important details</p>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Textarea
                      id="note"
                      placeholder="Write your personal note here..."
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      className="min-h-[100px] resize-none border-gray-200 text-sm focus:border-primary/50"
                      disabled={isSubmitting}
                    />
                    <Button
                      onClick={submitNote}
                      disabled={isSubmitting || !note.trim()}
                      variant="outline"
                      className="w-full h-10 rounded-md hover:bg-primary hover:text-primary-foreground transition-colors"
                    >
                      {isSubmitting ? "Saving..." : note && note.trim() ? "Update Note" : "Save Note"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sticky */}
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* Status Card */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium">Request Status</CardTitle>
                </CardHeader>
                <CardContent>
                  {existingCorrection ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center p-6 bg-muted/30 rounded-lg border-2 border-dashed" style={{
                        borderColor: existingCorrection.status === 'pending' ? '#eab308' : existingCorrection.status === 'approved' ? '#22c55e' : '#ef4444'
                      }}>
                        <div className="text-center space-y-2">
                          <div className={`inline-flex h-16 w-16 rounded-full items-center justify-center ${existingCorrection.status === 'pending'
                              ? 'bg-yellow-500/10'
                              : existingCorrection.status === 'approved'
                                ? 'bg-green-500/10'
                                : 'bg-red-500/10'
                            }`}>
                            <div className={`h-8 w-8 rounded-full ${existingCorrection.status === 'pending'
                                ? 'bg-yellow-500'
                                : existingCorrection.status === 'approved'
                                  ? 'bg-green-500'
                                  : 'bg-red-500'
                              }`} />
                          </div>
                          <p className="text-sm font-semibold capitalize">
                            {existingCorrection.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="inline-flex h-16 w-16 rounded-full items-center justify-center bg-muted/50 mb-3">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No pending request</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Timeline */}
              {existingCorrection && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-medium">Timeline</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-0">
                    <div className="relative">
                      {/* Vertical line */}
                      {existingCorrection.status !== 'pending' && (
                        <div className="absolute left-[5.5px] top-2.5 bottom-2.5 w-px bg-muted-foreground/20"></div>
                      )}

                      {/* Submitted Item */}
                      <div className="relative flex items-start gap-3 mb-4">
                        <div className="h-3 w-3 rounded-full bg-blue-500 mt-1 flex-shrink-0 z-10 border-2 border-background"></div>
                        <div className="flex-1 min-w-0 -mt-0.5">
                          <p className="text-sm font-medium mb-0.5">Submitted</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(existingCorrection.createdAt), 'MMM dd, yyyy, h:mm a')}
                          </p>
                        </div>
                      </div>

                      {/* Reviewed Item */}
                      {existingCorrection.status !== 'pending' && existingCorrection.reviewedAt && (
                        <div className="relative flex items-start gap-3">
                          <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 z-10 border-2 border-background ${existingCorrection.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <div className="flex-1 min-w-0 -mt-0.5">
                            <p className="text-sm font-medium mb-0.5 capitalize">
                              {existingCorrection.status}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              by {existingCorrection.reviewedBy?.name || 'Admin'} on {format(new Date(existingCorrection.reviewedAt), 'MMM dd, yyyy, h:mm a')}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Info Alert */}
              <div className="bg-muted/40 border border-muted rounded-lg p-3">
                <div className="flex gap-2.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {existingCorrection
                      ? existingCorrection.status !== 'pending'
                        ? "You cannot submit another request until the current one is reviewed."
                        : "Your correction request is under review by HR."
                      : "Submit a correction request if you notice any discrepancies in your attendance."}
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
