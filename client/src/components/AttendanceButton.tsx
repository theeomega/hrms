import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AttendanceButton() {
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string | null>(null);
  const { toast } = useToast();

  const handleCheckIn = () => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    setCheckedIn(true);
    setCheckInTime(time);
    toast({
      title: "Checked In Successfully",
      description: `You checked in at ${time}`,
    });
  };

  const handleCheckOut = () => {
    const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    toast({
      title: "Checked Out Successfully",
      description: `You checked out at ${time}`,
    });
    setCheckedIn(false);
    setCheckInTime(null);
  };

  if (checkedIn && checkInTime) {
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
          className="w-full"
          data-testid="button-checkout"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Check Out
        </Button>
      </div>
    );
  }

  return (
    <Button 
      size="lg"
      onClick={handleCheckIn}
      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
      data-testid="button-checkin"
    >
      <LogIn className="w-4 h-4 mr-2" />
      Check In Now
    </Button>
  );
}
