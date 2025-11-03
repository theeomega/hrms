import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LogIn, LogOut, Clock } from "lucide-react";
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

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold">Quick Attendance</h3>
          <p className="text-sm text-muted-foreground">Mark your attendance for today</p>
        </div>
      </div>
      
      {checkedIn && checkInTime && (
        <div className="mb-4 p-3 bg-chart-2/10 rounded-lg">
          <p className="text-sm text-chart-2">Checked in at {checkInTime}</p>
        </div>
      )}

      <Button 
        className="w-full"
        variant={checkedIn ? "destructive" : "default"}
        onClick={checkedIn ? handleCheckOut : handleCheckIn}
        data-testid={checkedIn ? "button-checkout" : "button-checkin"}
      >
        {checkedIn ? (
          <>
            <LogOut className="w-4 h-4 mr-2" />
            Check Out
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Check In
          </>
        )}
      </Button>
    </Card>
  );
}
