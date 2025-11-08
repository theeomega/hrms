import EventCalendar from "@/components/EventCalendar";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AttendanceTable from "@/components/AttendanceTable";
import { UserCheck, Clock, TrendingUp, Calendar as CalendarIcon, Search, Download, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

const mockAttendance = [
  { id: "1", date: "Nov 03, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: "8.5", status: "present" as const },
  { id: "2", date: "Nov 02, 2025", checkIn: "09:15 AM", checkOut: "05:45 PM", hours: "8.5", status: "late" as const },
  { id: "3", date: "Nov 01, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: "8.0", status: "present" as const },
  { id: "4", date: "Oct 31, 2025", checkIn: "08:55 AM", checkOut: "05:15 PM", hours: "8.3", status: "present" as const },
  { id: "5", date: "Oct 30, 2025", checkIn: "09:30 AM", checkOut: "06:00 PM", hours: "8.5", status: "late" as const },
  { id: "6", date: "Oct 29, 2025", checkIn: "09:05 AM", checkOut: "05:20 PM", hours: "8.2", status: "present" as const },
  { id: "7", date: "Oct 28, 2025", checkIn: "-", checkOut: "-", hours: "0.0", status: "absent" as const },
  { id: "8", date: "Oct 27, 2025", checkIn: "-", checkOut: "-", hours: "8.0", status: "leave" as const },
];

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredAttendance = useMemo(() => {
    return mockAttendance.filter(record =>
      record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  // Quick derived summary for the calendar card to avoid negative whitespace
  const presentCount = filteredAttendance.filter((r) => r.status === "present").length;
  const lateCount = filteredAttendance.filter((r) => r.status === "late").length;
  const absentCount = filteredAttendance.filter((r) => r.status === "absent").length;
  const leaveCount = filteredAttendance.filter((r) => r.status === "leave").length;
  const totalHours = filteredAttendance.reduce((acc, r) => acc + (parseFloat(String(r.hours)) || 0), 0);

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Unique Minimal Header - Split Design */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">My</h1>
              <span className="text-5xl font-bold">Attendance</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Track your attendance records and patterns
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Stats - Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Days Present Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Days Present</p>
                <p className="text-4xl font-bold">22</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <UserCheck className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
        </Card>

        {/* Total Hours Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                <p className="text-4xl font-bold">180</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">This month</p>
          </div>
        </Card>

        {/* Avg Hours/Day Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg Hours/Day</p>
                <p className="text-4xl font-bold">8.2</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">↑ 0.3</span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
          </div>
        </Card>

        {/* Attendance Rate Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">95%</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600">↑ 3%</span>
              <span className="text-muted-foreground">improvement</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column: Event Calendar (takes 2/5 width on large screens) */}
        <div className="lg:col-span-2 space-y-6">
          <EventCalendar />
          <Card className="border shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">This Period Summary</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Present
                  </span>
                  <Badge variant="outline" className="font-semibold">{presentCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> Late
                  </span>
                  <Badge variant="outline" className="font-semibold">{lateCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" /> Absent
                  </span>
                  <Badge variant="outline" className="font-semibold">{absentCount}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-sky-500" /> Leave
                  </span>
                  <Badge variant="outline" className="font-semibold">{leaveCount}</Badge>
                </div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-muted-foreground">Total Hours</span>
                  <span className="font-bold text-lg">{totalHours.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Attendance Records (takes 3/5 width on large screens) */}
        <div className="space-y-6 lg:col-span-3">
          <Card className="border shadow-sm">
            <div className="p-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-lg font-semibold">Recent Records</h2>
                <div className="flex items-center gap-2">
                  <div className="relative w-full max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search by date or status..." 
                      className="pl-10"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                      <SelectItem value="year">This Year</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" className="h-9 gap-1">
                    <Download className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                    </span>
                  </Button>
                  <Button size="sm" className="h-9 gap-1">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Entry
                    </span>
                  </Button>
                </div>
              </div>
            </div>
          </Card>
          <Card className="border shadow-sm">
            <div className="p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Attendance History</h2>
              <Link href="/attendance/history">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </Link>
            </div>
            <div className="p-6 pt-0">
              <AttendanceTable records={filteredAttendance} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
