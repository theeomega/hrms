import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut, CalendarDays } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceButton() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's attendance status
  const { data: todayData, isLoading } = useQuery({
    queryKey: ['attendance-today'],
    queryFn: async () => {
      const response = await fetch('/api/attendance/today', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-in failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checked In Successfully",
        description: `You checked in at ${data.attendance.checkIn}`,
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves-activity'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-in Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Check-out failed');
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Checked Out Successfully",
        description: `You checked out at ${data.attendance.checkOut}. Total hours: ${data.attendance.hours}`,
      });
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-activity'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['recent-leaves-activity'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Check-out Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCheckIn = () => {
    checkInMutation.mutate();
  };

  const handleCheckOut = () => {
    checkOutMutation.mutate();
  };

  if (isLoading) {
    return (
      <Button 
        size="lg"
        disabled
        className="w-full"
      >
        Loading...
      </Button>
    );
  }

  const checkedIn = todayData?.checkedIn;
  const checkedOut = todayData?.checkedOut;
  const checkInTime = todayData?.checkIn;
  const isWorkingDay = todayData?.isWorkingDay;
  const nonWorkingReason = todayData?.nonWorkingReason;

  if (isWorkingDay === false) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-yellow-500" />
          <span className="text-sm text-muted-foreground">{nonWorkingReason || 'Off Day'}</span>
        </div>
        <Button 
          size="lg"
          disabled
          variant="secondary"
          className="w-full opacity-80"
        >
          <CalendarDays className="w-4 h-4 mr-2" />
          No Check-in Required
        </Button>
      </div>
    );
  }

  if (checkedIn && !checkedOut) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Checked in at {checkInTime}</span>
        </div>
        <Button 
          variant="outline"
          size="lg"
          onClick={handleCheckOut}
          disabled={checkOutMutation.isPending}
          className="w-full"
          data-testid="button-checkout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {checkOutMutation.isPending ? 'Checking out...' : 'Check Out'}
        </Button>
      </div>
    );
  }

  if (checkedOut) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gray-500" />
          <span className="text-sm text-muted-foreground">Completed for today</span>
        </div>
        <Button 
          size="lg"
          disabled
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Checked Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="lg"
      onClick={handleCheckIn}
      disabled={checkInMutation.isPending}
      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      data-testid="button-checkin"
    >
      <LogIn className="w-4 h-4 mr-2" />
      {checkInMutation.isPending ? 'Checking in...' : 'Check In Now'}
    </Button>
  );
}
