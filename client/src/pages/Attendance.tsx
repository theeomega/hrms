import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import AttendanceTable from "@/components/AttendanceTable";
import StatCard from "@/components/StatCard";
import { UserCheck, Clock, TrendingUp, Calendar as CalendarIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockAttendance = [
  { id: "1", date: "Nov 03, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: "8.5", status: "present" as const },
  { id: "2", date: "Nov 02, 2025", checkIn: "09:15 AM", checkOut: "05:45 PM", hours: "8.5", status: "late" as const },
  { id: "3", date: "Nov 01, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: "8.0", status: "present" as const },
  { id: "4", date: "Oct 31, 2025", checkIn: "08:55 AM", checkOut: "05:15 PM", hours: "8.3", status: "present" as const },
  { id: "5", date: "Oct 30, 2025", checkIn: "09:30 AM", checkOut: "06:00 PM", hours: "8.5", status: "late" as const },
  { id: "6", date: "Oct 29, 2025", checkIn: "09:05 AM", checkOut: "05:20 PM", hours: "8.2", status: "present" as const },
  { id: "7", date: "Oct 28, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: "8.0", status: "present" as const },
];

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterPeriod, setFilterPeriod] = useState("month");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Attendance Management</h1>
        <p className="text-muted-foreground">Track and manage attendance records</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Days Present" value={22} icon={UserCheck} trend="This month" />
        <StatCard title="Total Hours" value={180} icon={Clock} trend="This month" />
        <StatCard title="Avg Hours/Day" value="8.2" icon={TrendingUp} trend="+0.3 vs last month" trendUp={true} />
        <StatCard title="Attendance Rate" value="95%" icon={CalendarIcon} trend="+3% improvement" trendUp={true} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Calendar View</h3>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md"
          />
          <div className="mt-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Present</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-secondary"></div>
              <span>Late</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-destructive"></div>
              <span>Absent</span>
            </div>
          </div>
        </Card>

        <div className="lg:col-span-2 space-y-4">
          <Card className="p-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="font-semibold">Attendance Records</h3>
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger className="w-[180px]" data-testid="select-period">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">This Quarter</SelectItem>
                  <SelectItem value="year">This Year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Card>
          <AttendanceTable records={mockAttendance} />
        </div>
      </div>
    </div>
  );
}
