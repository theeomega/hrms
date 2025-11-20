import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Mail, User, Calendar, Clock, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react";
import { format } from "date-fns";

export default function AttendanceCorrectionDetail() {
  const [, navigate] = useLocation();
  const params = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [reviewNotes, setReviewNotes] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [attendanceStatus, setAttendanceStatus] = useState("");
  const [attendanceDate, setAttendanceDate] = useState("");
  
  // Track original values to detect changes
  const [originalCheckIn, setOriginalCheckIn] = useState("");
  const [originalCheckOut, setOriginalCheckOut] = useState("");
  const [originalStatus, setOriginalStatus] = useState("");

  // Separate state for check-in time parts
  const [checkInHour, setCheckInHour] = useState("");
  const [checkInMinute, setCheckInMinute] = useState("");
  const [checkInPeriod, setCheckInPeriod] = useState("AM");

  // Separate state for check-out time parts
  const [checkOutHour, setCheckOutHour] = useState("");
  const [checkOutMinute, setCheckOutMinute] = useState("");
  const [checkOutPeriod, setCheckOutPeriod] = useState("PM");

  // Generate time component options
  const hours = Array.from({ length: 12 }, (_, i) => (i + 1).toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
  const periods = ['AM', 'PM'];

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (hour: string, minute: string, period: string) => {
    let h = parseInt(hour);
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };

  // Convert 24-hour to 12-hour format
  const convertTo12Hour = (time24: string) => {
    if (!time24 || time24 === '-') return { hour: '', minute: '', period: 'AM' };
    
    // Check if time is already in 12-hour format (e.g., "9:00 AM")
    if (time24.match(/AM|PM/i)) {
      // Use regex to handle different spaces or formats
      const match = time24.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (match) {
        const [, hour, minute, period] = match;
        return { hour: hour.padStart(2, '0'), minute, period: period.toUpperCase() };
      }
    }
    
    // Otherwise, convert from 24-hour format
    const [hour24, minute] = time24.split(':');
    const h = parseInt(hour24);
    if (isNaN(h)) return { hour: '', minute: '', period: 'AM' };
    
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return { hour: hour12.toString().padStart(2, '0'), minute: minute || '00', period };
  };

  // Update combined time when parts change
  useEffect(() => {
    if (checkInHour && checkInMinute) {
      setCheckInTime(convertTo24Hour(checkInHour, checkInMinute, checkInPeriod));
    }
  }, [checkInHour, checkInMinute, checkInPeriod]);

  useEffect(() => {
    if (checkOutHour && checkOutMinute) {
      setCheckOutTime(convertTo24Hour(checkOutHour, checkOutMinute, checkOutPeriod));
    }
  }, [checkOutHour, checkOutMinute, checkOutPeriod]);

  // Fetch the specific correction request
  const { data: correctionData, isLoading } = useQuery<any>({
    queryKey: [`/api/attendance/corrections/${params.id}`],
    queryFn: async () => {
      const response = await fetch('/api/attendance/corrections/pending', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to fetch correction request');
      const data = await response.json();
      const correction = data.corrections.find((c: any) => c.id === params.id);
      if (!correction) throw new Error('Correction request not found');
      return correction;
    },
  });

  const correction = correctionData;
  const isCompleted = correction?.status !== 'pending';

  // Initialize form fields when data loads
  useEffect(() => {
    if (correction?.attendance) {
      const checkIn = correction.attendance.checkIn || "";
      const checkOut = correction.attendance.checkOut || "";
      const status = correction.attendance.status || "";
      
      // Parse check-in time
      if (checkIn && checkIn !== '-') {
        const checkInParts = convertTo12Hour(checkIn);
        setCheckInHour(checkInParts.hour);
        setCheckInMinute(checkInParts.minute);
        setCheckInPeriod(checkInParts.period);
        
        // Store as 24-hour format for comparison
        const normalized24h = convertTo24Hour(checkInParts.hour, checkInParts.minute, checkInParts.period);
        setOriginalCheckIn(normalized24h);
        setCheckInTime(normalized24h);
      }

      // Parse check-out time
      if (checkOut && checkOut !== '-') {
        const checkOutParts = convertTo12Hour(checkOut);
        setCheckOutHour(checkOutParts.hour);
        setCheckOutMinute(checkOutParts.minute);
        setCheckOutPeriod(checkOutParts.period);
        
        // Store as 24-hour format for comparison
        const normalized24h = convertTo24Hour(checkOutParts.hour, checkOutParts.minute, checkOutParts.period);
        setOriginalCheckOut(normalized24h);
        setCheckOutTime(normalized24h);
      }
      
      setAttendanceStatus(status);
      setAttendanceDate(correction.attendance.date || "");
      setOriginalStatus(status);
      if (correction.reviewNotes) {
        setReviewNotes(correction.reviewNotes);
      }
    }
  }, [correction]);

  // Check if any changes were made
  const hasChanges = () => {
    return checkInTime !== originalCheckIn || 
           checkOutTime !== originalCheckOut || 
           attendanceStatus !== originalStatus;
  };

  // Update attendance mutation
  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const attendanceId = correction?.attendance?.id ?? correction?.attendance?._id;
      if (!attendanceId) throw new Error('Attendance id is missing');

      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update attendance');
      }
      return response.json();
    },
  });

  // Review mutation (approve/reject)
  const reviewMutation = useMutation({
    mutationFn: async ({ status, notes }: { status: string; notes: string }) => {
      const response = await fetch(`/api/attendance/corrections/${params.id}/review`, {
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
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/corrections/pending'] });
      toast({
        title: "Success",
        description: `Request ${variables.status === 'approved' ? 'approved' : 'rejected'} successfully.`,
      });
      setTimeout(() => navigate("/attendance/corrections"), 1500);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to review request.",
        variant: "destructive",
      });
    }
  });

  const handleApprove = async () => {
    // Check if changes were made
    if (!hasChanges()) {
      toast({
        title: "No Changes Made",
        description: "Please update the attendance details before approving.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First update the attendance
      const updates: any = {
        status: attendanceStatus,
      };

      // Only include check-in/out times if status is present or late
      if (attendanceStatus !== 'absent' && attendanceStatus !== 'leave') {
        if (checkInTime && attendanceDate) {
          updates.checkIn = new Date(`${attendanceDate} ${checkInTime}`).toISOString();
        }
        
        if (checkOutTime && attendanceDate) {
          updates.checkOut = new Date(`${attendanceDate} ${checkOutTime}`).toISOString();
        }
      }

      await updateMutation.mutateAsync(updates);
      
      // Then approve the request
      reviewMutation.mutate({ status: 'approved', notes: reviewNotes });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update attendance.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    // If changes were made, apply them before rejecting
    if (hasChanges()) {
      try {
        const updates: any = {
          status: attendanceStatus,
        };

        // Only include check-in/out times if status is present or late
        if (attendanceStatus !== 'absent' && attendanceStatus !== 'leave') {
          if (checkInTime && attendanceDate) {
            updates.checkIn = new Date(`${attendanceDate} ${checkInTime}`).toISOString();
          }
          
          if (checkOutTime && attendanceDate) {
            updates.checkOut = new Date(`${attendanceDate} ${checkOutTime}`).toISOString();
          }
        }

        await updateMutation.mutateAsync(updates);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to update attendance.",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Then reject the request
    reviewMutation.mutate({ status: 'rejected', notes: reviewNotes });
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

  return (
    <div className="min-h-full">
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      ) : !correction ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <AlertCircle className="h-16 w-16 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">Request Not Found</h2>
          <p className="text-muted-foreground">The correction request doesn't exist or has been processed.</p>
          <Button onClick={() => navigate("/attendance/corrections")} variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Corrections
          </Button>
        </div>
      ) : (
        <div className="max-w-[1600px] mx-auto w-full space-y-6 pb-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/attendance/corrections")}
              className="gap-2 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </div>

          {/* Main Grid - Two Columns with Fixed Right */}
            <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6 items-start">
              {/* Left Column - Scrollable */}
              <div className="space-y-6">{/* Employee Information */}
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
                        {(correction.user?.name || correction.user?.fullName || correction.user?.username || '')
                          .split(' ')
                          .map((n: string) => n[0])
                          .join('')
                          .slice(0, 2)
                          .toUpperCase() || 'NA'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-foreground mb-0.5">{correction.user?.name || correction.user?.fullName || correction.user?.username || 'N/A'}</h3>
                      <p className="text-sm text-muted-foreground mb-3">ID: {correction.user.employeeId}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5" />
                        {correction.user.email || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {/* Other Details */}
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Designation</p>
                      <p className="font-medium">{correction.user?.position || correction.user?.role || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Department</p>
                      <p className="font-medium">{correction.user.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Reporting Manager</p>
                      <p className="font-medium">{correction.user.manager || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request Information and Reason - Side by Side */}
              <div className="grid grid-cols-2 gap-6">
                {/* Request Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Request Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Attendance Date</p>
                        <p className="font-medium">{correction.attendance.date}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${getStatusColor(correction.attendance.status)}`} />
                          <span className="font-medium capitalize">{correction.attendance.status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Check In</p>
                        <p className="font-medium">{correction.attendance.checkIn || '--'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1.5">Check Out</p>
                        <p className="font-medium">{correction.attendance.checkOut || '--'}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground mb-1.5">Hours</p>
                      <p className="font-medium">{correction.attendance.hours ?? '--'}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Reason for Correction */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Reason for Attendance Correction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                      {correction.reason}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Edit Attendance Record */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Edit Attendance Record</CardTitle>
                  <CardDescription className="text-xs">
                    {isCompleted
                      ? "This request has been processed and is read-only."
                      : hasChanges() 
                        ? "Changes detected - approve to save" 
                        : "Make changes before approving"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Time Inputs Row */}
                  <div className="grid grid-cols-3 gap-6">
                    {/* Check In Time */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Check In Time
                      </Label>
                      {attendanceStatus === 'absent' || attendanceStatus === 'leave' ? (
                        <div className="h-11 flex items-center justify-center border border-gray-200 rounded-md bg-muted text-muted-foreground">
                          -
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={checkInHour} onValueChange={setCheckInHour} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {hours.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={checkInMinute} onValueChange={setCheckInMinute} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={checkInPeriod} onValueChange={setCheckInPeriod} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Check Out Time */}
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5" />
                        Check Out Time
                      </Label>
                      {attendanceStatus === 'absent' || attendanceStatus === 'leave' ? (
                        <div className="h-11 flex items-center justify-center border border-gray-200 rounded-md bg-muted text-muted-foreground">
                          -
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <Select value={checkOutHour} onValueChange={setCheckOutHour} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue placeholder="HH" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {hours.map((h) => (
                                <SelectItem key={h} value={h}>{h}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={checkOutMinute} onValueChange={setCheckOutMinute} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px]">
                              {minutes.map((m) => (
                                <SelectItem key={m} value={m}>{m}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select value={checkOutPeriod} onValueChange={setCheckOutPeriod} disabled={isCompleted}>
                            <SelectTrigger className="border-gray-200 h-11">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {periods.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Status */}
                    <div className="space-y-2">
                      <Label htmlFor="status" className="text-xs text-muted-foreground font-medium flex items-center">Status</Label>
                      <Select value={attendanceStatus} onValueChange={setAttendanceStatus} disabled={isCompleted}>
                        <SelectTrigger className="border-gray-200 h-11 focus:border-primary focus:ring-1 focus:ring-primary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">Present</SelectItem>
                          <SelectItem value="late">Late</SelectItem>
                          <SelectItem value="absent">Absent</SelectItem>
                          <SelectItem value="leave">Leave</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div className="space-y-2">
                    <Label htmlFor="reviewNotes" className="text-xs text-muted-foreground">Admin Notes (Optional)</Label>
                    <Textarea
                      id="reviewNotes"
                      placeholder={isCompleted && !correction.reviewNotes ? "No notes were added." : "Add notes about this decision..."}
                      value={isCompleted ? correction.reviewNotes || "" : reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      className="min-h-[100px] resize-none border-gray-200 text-sm"
                      disabled={isCompleted}
                      readOnly={isCompleted}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Sticky on large screens */}
            <div className="space-y-6 lg:sticky lg:top-6">
              {/* Admin Actions */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="text-base font-medium">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    onClick={handleApprove}
                    disabled={reviewMutation.isPending || updateMutation.isPending || correction.status !== 'pending'}
                    className="w-full h-12 rounded-md"
                  >
                    {reviewMutation.isPending || updateMutation.isPending ? "Processing..." : "Approve"}
                  </Button>
                  <Button
                    onClick={handleReject}
                    disabled={reviewMutation.isPending || updateMutation.isPending || correction.status !== 'pending'}
                    variant="outline"
                    className="w-full h-12 rounded-md"
                  >
                    {reviewMutation.isPending ? "Processing..." : "Reject"}
                  </Button>
                </CardContent>
              </Card>

              {/* Request History */}
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
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(correction.createdAt), 'MMM dd, yyyy, h:mm a')}
                        </p>
                      </div>
                    </div>

                    {/* Reviewed Item - Conditional */}
                    {isCompleted && (
                      <div className="relative flex items-start gap-3">
                        <div className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 z-10 border-2 border-background ${correction.status === 'approved' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <div className="flex-1 min-w-0 -mt-0.5">
                          <p className="text-sm font-medium mb-0.5 capitalize">
                            {correction.status}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            by {correction.reviewedBy?.name || 'Admin'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(correction.reviewedAt), 'MMM dd, yyyy, h:mm a')}
                          </p>
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
                    Approved changes update records immediately.
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
