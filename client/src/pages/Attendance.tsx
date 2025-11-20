import EventCalendar from "@/components/EventCalendar";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import AttendanceTable from "@/components/AttendanceTable";
import { UserCheck, Clock, TrendingUp, Calendar as CalendarIcon, Search, Download, PlusCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

export default function Attendance() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [filterPeriod, setFilterPeriod] = useState("month");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch attendance records with real-time updates
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-records'],
    queryFn: async () => {
      const response = await fetch('/api/attendance?limit=50', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  // Fetch dashboard stats for summary with real-time updates
  const { data: statsData } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/dashboard/stats', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const records = attendanceData?.records || [];
  const stats = statsData || {}; // stats are returned directly, not nested

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !attendanceData;

  const filteredAttendance = useMemo(() => {
    const filtered = records.filter((record: any) =>
      record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Show only 8 latest records
    return filtered.slice(0, 8);
  }, [records, searchTerm]);

  // Quick derived summary for the calendar card to avoid negative whitespace
  const presentCount = filteredAttendance.filter((r: any) => r.status === "present").length;
  const lateCount = filteredAttendance.filter((r: any) => r.status === "late").length;
  const absentCount = filteredAttendance.filter((r: any) => r.status === "absent").length;
  const leaveCount = filteredAttendance.filter((r: any) => r.status === "leave").length;
  const totalHours = filteredAttendance.reduce((acc: number, r: any) => acc + (parseFloat(String(r.hours)) || 0), 0);

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
      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Days Present Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Days Present</p>
                <p className="text-4xl font-bold">{stats.presentDays || 0}</p>
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
                <p className="text-4xl font-bold">{stats.totalHours?.toFixed(1) || '0.0'}</p>
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
                <p className="text-4xl font-bold">{stats.avgHours?.toFixed(1) || '0.0'}</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            {stats.avgHoursDiff !== undefined && stats.avgHoursDiff !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className={stats.avgHoursDiff > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.avgHoursDiff > 0 ? '↑' : '↓'} {Math.abs(stats.avgHoursDiff).toFixed(1)}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
        </Card>

        {/* Attendance Rate Card */}
        <Card className="border shadow-sm">
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Attendance Rate</p>
                <p className="text-4xl font-bold">{stats.attendanceRate || 0}%</p>
              </div>
              <div className="w-16 h-16 rounded-2xl  flex items-center justify-center">
                <CalendarIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            </div>
            {stats.attendanceRateDiff !== undefined && stats.attendanceRateDiff !== 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className={stats.attendanceRateDiff > 0 ? "text-green-600" : "text-red-600"}>
                  {stats.attendanceRateDiff > 0 ? '↑' : '↓'} {Math.abs(stats.attendanceRateDiff).toFixed(1)}%
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            )}
          </div>
        </Card>
        </div>
      )}

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
            <div className="p-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Attendance History</h2>
              <Link href="/attendance/history">
                <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  View all →
                </button>
              </Link>
            </div>
            <div className="p-6 pt-0">
              {/* Fixed height scroll area (~8 rows). Assuming average row height ~48-52px plus header. */}
              <div className="max-h-[460px] overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent">
                <AttendanceTable records={filteredAttendance} />
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
