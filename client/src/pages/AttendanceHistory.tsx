import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Download, Calendar, TrendingUp, Clock, MoreHorizontal } from "lucide-react";
import { Link, useLocation } from "wouter";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


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
  const [currentPage, setCurrentPage] = useState(1);
  const [, navigate] = useLocation();

  const itemsPerPage = 50;

  // Fetch attendance records with real-time updates
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance-history'],
    queryFn: async () => {
      const response = await fetch('/api/attendance?limit=100', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch attendance');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const attendanceHistory = attendanceData?.records || [];

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !attendanceData;

  const filteredData = useMemo(() => {
    return attendanceHistory.filter((record: any) => {
      const dateStr = new Date(record.date).toLocaleDateString();
      const matchesSearch = dateStr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           record.status.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || record.status === filterStatus;
      const recordMonth = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
      const matchesMonth = filterMonth === "all" || recordMonth === filterMonth;
      return matchesSearch && matchesStatus && matchesMonth;
    });
  }, [attendanceHistory, searchTerm, filterStatus, filterMonth]);

  // Paginated data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterMonth]);

  // Calculate stats
  const stats = useMemo(() => {
    const present = filteredData.filter((r: any) => r.status === "present").length;
    const late = filteredData.filter((r: any) => r.status === "late").length;
    const absent = filteredData.filter((r: any) => r.status === "absent").length;
    const leave = filteredData.filter((r: any) => r.status === "leave").length;
    const totalHours = filteredData.reduce((acc: number, r: any) => {
      const hours = parseFloat(r.hours) || 0;
      return acc + hours;
    }, 0);
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
  const lineData = filteredData.slice(0, 10).reverse().map((record: any) => ({
    date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: parseFloat(record.hours) || 0,
  }));

  // Bar chart data - status count by month
  const barData = useMemo(() => {
    const monthData: { [key: string]: { present: number; late: number; absent: number; leave: number } } = {};
    
    attendanceHistory.forEach((record: any) => {
      const month = new Date(record.date).toLocaleDateString('en-US', { month: 'short' });
      if (!monthData[month]) {
        monthData[month] = { present: 0, late: 0, absent: 0, leave: 0 };
      }
      monthData[month][record.status as keyof typeof monthData[string]]++;
    });

    return Object.entries(monthData).map(([month, data]) => ({
      month,
      ...data,
    }));
  }, [attendanceHistory]);

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

  const handleExport = () => {
    // Prepare CSV data
    const headers = ['Date', 'Check In', 'Check Out', 'Hours', 'Status'];
    const csvData = filteredData.map((record: any) => [
      record.date,
      record.checkIn || '-',
      record.checkOut || '-',
      record.hours || '0.0',
      record.status
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map((row: string[]) => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_history_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (showLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-8">
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
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>

        <Skeleton className="h-96" />
      </div>
    );
  }

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
            <Button variant="outline" size="sm" onClick={handleExport}>
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
          <div>
            <Table>
              <TableHeader>
                <TableRow className="border-b">
                  <TableHead className="border-0">Date</TableHead>
                  <TableHead className="border-0">Check In</TableHead>
                  <TableHead className="border-0">Check Out</TableHead>
                  <TableHead className="border-0">Hours</TableHead>
                  <TableHead className="border-0">Status</TableHead>
                  <TableHead className="text-right w-[100px] border-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow className="border-b">
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground border-0">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record: any) => (
                    <TableRow key={record._id || record.id} className="border-b">
                      <TableCell className="font-medium border-0">{record.date}</TableCell>
                      <TableCell className="border-0">{record.checkIn || '-'}</TableCell>
                      <TableCell className="border-0">{record.checkOut || '-'}</TableCell>
                      <TableCell className="border-0">{record.hours || '0.0'}</TableCell>
                      <TableCell className="border-0">{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right border-0">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/attendance/correction/${record.id || record._id}`)}>
                              Correction
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/attendance/correction/${record.id || record._id}?tab=note`)}>
                              Add Note
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {filteredData.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between px-2 py-4">
              <div className="text-sm text-muted-foreground">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {currentPage > 2 && (
                    <>
                      <Button
                        variant={currentPage === 1 ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(1)}
                      >
                        1
                      </Button>
                      {currentPage > 3 && <span className="text-muted-foreground px-1">...</span>}
                    </>
                  )}
                  {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                    const pageNum = currentPage === 1 ? i + 1 : 
                                   currentPage === totalPages ? totalPages - 2 + i :
                                   currentPage - 1 + i;
                    if (pageNum < 1 || pageNum > totalPages) return null;
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {currentPage < totalPages - 1 && (
                    <>
                      {currentPage < totalPages - 2 && <span className="text-muted-foreground px-1">...</span>}
                      <Button
                        variant={currentPage === totalPages ? "default" : "outline"}
                        size="sm"
                        className="w-9 h-9 p-0"
                        onClick={() => setCurrentPage(totalPages)}
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
