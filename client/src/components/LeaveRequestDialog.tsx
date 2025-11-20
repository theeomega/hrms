import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Plus, AlertCircle, Info } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function LeaveRequestDialog() {
  const [open, setOpen] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch leave balance
  const { data: leaveData } = useQuery({
    queryKey: ['leave-balance'],
    queryFn: async () => {
      const response = await fetch('/api/leave/balance', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch leave balance');
      return response.json();
    },
    enabled: open, // Only fetch when dialog is open
  });

  const leaveBalance = leaveData?.balance || {};

  // Calculate days requested
  const daysRequested = useMemo(() => {
    if (!startDate || !endDate) return 0;
    const days = differenceInDays(endDate, startDate) + 1;
    return days > 0 ? days : 0;
  }, [startDate, endDate]);

  // Get available balance for selected leave type
  const availableBalance = useMemo(() => {
    if (!leaveType) return null;
    
    const typeMap: Record<string, string> = {
      'sick': 'sickLeave',
      'vacation': 'vacation',
      'personal': 'personalLeave',
    };
    
    const balanceKey = typeMap[leaveType];
    if (!balanceKey || !leaveBalance[balanceKey]) return null;
    
    const balance = leaveBalance[balanceKey];
    return balance.total - balance.used;
  }, [leaveType, leaveBalance]);

  // Check if request exceeds balance
  const exceedsBalance = useMemo(() => {
    if (availableBalance === null || daysRequested === 0) return false;
    return daysRequested > availableBalance;
  }, [availableBalance, daysRequested]);

  // Create leave request mutation
  const createLeaveMutation = useMutation({
    mutationFn: async (data: { type: string; startDate: string; endDate: string; reason: string }) => {
      const response = await fetch('/api/leave/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create leave request');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Leave Request Submitted",
        description: "Your leave request has been submitted for approval",
      });
      queryClient.invalidateQueries({ queryKey: ['leave-requests'] });
      queryClient.invalidateQueries({ queryKey: ['leave-balance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['pending-leaves'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves-activity'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
      setOpen(false);
      setLeaveType("");
      setStartDate(undefined);
      setEndDate(undefined);
      setReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Submit Request",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!leaveType || !startDate || !endDate || !reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    if (exceedsBalance) {
      toast({
        title: "Insufficient Leave Balance",
        description: `You only have ${availableBalance} days available. Please adjust your request.`,
        variant: "destructive",
      });
      return;
    }

    // Map display values to backend expected values
    const typeMap: Record<string, string> = {
      'sick': 'Sick Leave',
      'vacation': 'Vacation',
      'personal': 'Personal Leave',
    };

    createLeaveMutation.mutate({
      type: typeMap[leaveType] || leaveType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      reason,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button data-testid="button-apply-leave">
          <Plus className="w-4 h-4 mr-2" />
          Apply for Leave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Apply for Leave</DialogTitle>
          <DialogDescription>
            Submit your leave request for approval
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Leave Balance Info */}
          {leaveType && availableBalance !== null && (
            <Alert className={exceedsBalance ? "border-red-500 bg-red-50" : "border-blue-500 bg-blue-50"}>
              <Info className={`h-4 w-4 ${exceedsBalance ? "text-red-600" : "text-blue-600"}`} />
              <AlertDescription className={exceedsBalance ? "text-red-800" : "text-blue-800"}>
                <div className="flex items-center justify-between">
                  <span>Available Balance: <strong>{availableBalance} days</strong></span>
                  {daysRequested > 0 && (
                    <span>
                      Requesting: <strong>{daysRequested} days</strong>
                    </span>
                  )}
                </div>
                {exceedsBalance && (
                  <p className="text-sm mt-1 text-red-700">
                    ⚠️ You don't have enough leave balance. Please reduce the number of days.
                  </p>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="leave-type">Leave Type</Label>
            <Select value={leaveType} onValueChange={setLeaveType}>
              <SelectTrigger id="leave-type" data-testid="select-leave-type">
                <SelectValue placeholder="Select leave type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sick">
                  <div className="flex items-center justify-between w-full">
                    <span>Sick Leave</span>
                    {leaveBalance.sickLeave && (
                      <span className="text-xs text-muted-foreground ml-4">
                        ({leaveBalance.sickLeave.total - leaveBalance.sickLeave.used} available)
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="vacation">
                  <div className="flex items-center justify-between w-full">
                    <span>Vacation</span>
                    {leaveBalance.vacation && (
                      <span className="text-xs text-muted-foreground ml-4">
                        ({leaveBalance.vacation.total - leaveBalance.vacation.used} available)
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div className="flex items-center justify-between w-full">
                    <span>Personal Leave</span>
                    {leaveBalance.personalLeave && (
                      <span className="text-xs text-muted-foreground ml-4">
                        ({leaveBalance.personalLeave.total - leaveBalance.personalLeave.used} available)
                      </span>
                    )}
                  </div>
                </SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left" data-testid="button-start-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left" data-testid="button-end-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a reason for your leave request..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              data-testid="input-reason"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={createLeaveMutation.isPending || exceedsBalance}
            data-testid="button-submit-leave"
          >
            {createLeaveMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
