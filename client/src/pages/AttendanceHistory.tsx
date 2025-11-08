import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Download, Calendar, TrendingUp, Clock } from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Extended mock data for history
const mockAttendanceHistory = [
  { id: "1", date: "Nov 03, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: 8.5, status: "present" as const, month: "Nov" },
  { id: "2", date: "Nov 02, 2025", checkIn: "09:15 AM", checkOut: "05:45 PM", hours: 8.5, status: "late" as const, month: "Nov" },
  { id: "3", date: "Nov 01, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: 8.0, status: "present" as const, month: "Nov" },
  { id: "4", date: "Oct 31, 2025", checkIn: "08:55 AM", checkOut: "05:15 PM", hours: 8.3, status: "present" as const, month: "Oct" },
  { id: "5", date: "Oct 30, 2025", checkIn: "09:30 AM", checkOut: "06:00 PM", hours: 8.5, status: "late" as const, month: "Oct" },
  { id: "6", date: "Oct 29, 2025", checkIn: "09:05 AM", checkOut: "05:20 PM", hours: 8.2, status: "present" as const, month: "Oct" },
  { id: "7", date: "Oct 28, 2025", checkIn: "-", checkOut: "-", hours: 0, status: "absent" as const, month: "Oct" },
  { id: "8", date: "Oct 27, 2025", checkIn: "-", checkOut: "-", hours: 8.0, status: "leave" as const, month: "Oct" },
  { id: "9", date: "Oct 26, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: 8.5, status: "present" as const, month: "Oct" },
  { id: "10", date: "Oct 25, 2025", checkIn: "09:10 AM", checkOut: "05:45 PM", hours: 8.6, status: "late" as const, month: "Oct" },
  { id: "11", date: "Sep 30, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: 8.0, status: "present" as const, month: "Sep" },
  { id: "12", date: "Sep 29, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: 8.5, status: "present" as const, month: "Sep" },
  { id: "13", date: "Sep 28, 2025", checkIn: "-", checkOut: "-", hours: 8.0, status: "leave" as const, month: "Sep" },
  { id: "14", date: "Sep 27, 2025", checkIn: "09:20 AM", checkOut: "05:50 PM", hours: 8.5, status: "late" as const, month: "Sep" },
  { id: "15", date: "Sep 26, 2025", checkIn: "09:00 AM", checkOut: "05:15 PM", hours: 8.2, status: "present" as const, month: "Sep" },
];

const COLORS = {
  present: "#10b981",
  late: "#f59e0b",
  absent: "#ef4444",
  leave: "#3b82f6",
};

export default function AttendanceHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const filteredData = useMemo(() => {
    return mockAttendanceHistory.filter(record => {
      const matchesSearch = record.date.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || record.status === filterStatus;
      const matchesMonth = filterMonth === "all" || record.month === filterMonth;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [searchTerm, filterStatus, filterMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    const present = filteredData.filter(r => r.status === "present").length;
    const late = filteredData.filter(r => r.status === "late").length;
    const absent = filteredData.filter(r => r.status === "absent").length;
    const leave = filteredData.filter(r => r.status === "leave").length;
    const totalHours = filteredData.reduce((acc, r) => acc + r.hours, 0);
    const avgHours = filteredData.length > 0 ? totalHours / filteredData.length : 0;
    
    return { present, late, absent, leave, totalHours, avgHours };
  }, [filteredData]);

  // Pie chart data
  const pieData = [
    { name: "Present", value: stats.present, color: COLORS.present },
    { name: "Late", value: stats.late, color: COLORS.late },
    { name: "Absent", value: stats.absent, color: COLORS.absent },
    { name: "Leave", value: stats.leave, color: COLORS.leave },
  ].filter(item => item.value > 0);

  // Line chart data - hours per day
  const lineData = filteredData.slice(0, 10).reverse().map(record => ({
    date: record.date.split(",")[0],
    hours: record.hours,
  }));

  // Bar chart data - status count by month
  const barData = useMemo(() => {
    const monthData: { [key: string]: { present: number; late: number; absent: number; leave: number } } = {};
    
    mockAttendanceHistory.forEach(record => {
      if (!monthData[record.month]) {
        monthData[record.month] = { present: 0, late: 0, absent: 0, leave: 0 };
      }
      monthData[record.month][record.status]++;
    });

    return Object.entries(monthData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm">Present</span>
          </div>
        );
      case "late":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-sm">Late</span>
          </div>
        );
      case "absent":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-sm">Absent</span>
          </div>
        );
      case "leave":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-sky-500" />
            <span className="text-sm">Leave</span>
          </div>
        );
      default:
        return <span className="text-sm">{status}</span>;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      {/* Header */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <Link href="/attendance">
              <Button variant="ghost" size="sm" className="mb-2 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Attendance
              </Button>
            </Link>
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">Attendance</h1>
              <span className="text-5xl font-bold">History</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Complete attendance records and analytics
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">{filteredData.length} Records</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Hours</p>
                <p className="text-3xl font-bold">{stats.totalHours.toFixed(1)}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">Avg: {stats.avgHours.toFixed(1)} hrs/day</p>
          </div>
        </Card>

        <Card className="border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Present Days</p>
                <p className="text-3xl font-bold">{stats.present}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">{((stats.present / filteredData.length) * 100).toFixed(0)}% of total</p>
          </div>
        </Card>

        <Card className="border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Late Days</p>
                <p className="text-3xl font-bold">{stats.late}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground">{((stats.late / filteredData.length) * 100).toFixed(0)}% of total</p>
          </div>
        </Card>

        <Card className="border shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Absent/Leave</p>
                <p className="text-3xl font-bold">{stats.absent + stats.leave}</p>
              </div>
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <p className="text-xs text-muted-foreground">{(((stats.absent + stats.leave) / filteredData.length) * 100).toFixed(0)}% of total</p>
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart - Hours Trend */}
        <Card className="border shadow-sm lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold">Daily Hours Trend</h3>
                <p className="text-sm text-muted-foreground">Last 10 working days</p>
              </div>
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                  labelStyle={{ color: "#111827", fontWeight: 600 }}
                />
                <Line type="monotone" dataKey="hours" stroke="#ef4444" strokeWidth={2} dot={{ fill: "#ef4444", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart - Status Distribution */}
        <Card className="border shadow-sm">
          <div className="p-6">
            <div className="mb-6">
              <h3 className="text-lg font-semibold">Status Distribution</h3>
              <p className="text-sm text-muted-foreground">Overall breakdown</p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bar Chart - Monthly Status */}
      <Card className="border shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold">Monthly Status Breakdown</h3>
              <p className="text-sm text-muted-foreground">Status counts per month</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
              <YAxis stroke="#6b7280" fontSize={12} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                labelStyle={{ color: "#111827", fontWeight: 600 }}
              />
              <Legend />
              <Bar dataKey="present" fill={COLORS.present} name="Present" />
              <Bar dataKey="late" fill={COLORS.late} name="Late" />
              <Bar dataKey="absent" fill={COLORS.absent} name="Absent" />
              <Bar dataKey="leave" fill={COLORS.leave} name="Leave" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Data Table with Filters */}
      <Card className="border shadow-sm">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">All Records</h3>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by date or status..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="late">Late</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="Nov">November</SelectItem>
                <SelectItem value="Oct">October</SelectItem>
                <SelectItem value="Sep">September</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Check In</TableHead>
                  <TableHead>Check Out</TableHead>
                  <TableHead>Hours</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.date}</TableCell>
                      <TableCell>{record.checkIn}</TableCell>
                      <TableCell>{record.checkOut}</TableCell>
                      <TableCell>{record.hours.toFixed(1)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}
