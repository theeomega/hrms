import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StatCard from "@/components/StatCard";
import { Download, TrendingUp, Users, Calendar, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AttendancePie, AttendanceLine, LeavePie } from "@/components/ReportCharts";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Reports() {
  const [range, setRange] = useState<"month" | "30" | "90">("month");
  const { startISO, endISO } = useMemo(() => {
    const end = new Date();
    let start = new Date();
    if (range === "month") {
      start = new Date(end.getFullYear(), end.getMonth(), 1);
    } else if (range === "30") {
      start = new Date(end);
      start.setDate(end.getDate() - 30);
    } else {
      start = new Date(end);
      start.setDate(end.getDate() - 90);
    }
    return { startISO: start.toISOString(), endISO: end.toISOString() };
  }, [range]);
  // Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/admin/stats', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });
  // Attendance summary
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['attendance-summary', range, startISO, endISO],
    queryFn: async () => {
      const url = `/api/employees/summary?startDate=${encodeURIComponent(startISO)}&endDate=${encodeURIComponent(endISO)}`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch summary');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });
  // Leave requests
  const { data: leaveData, isLoading: leaveLoading } = useQuery({
    queryKey: ['leave-requests'],
    queryFn: async () => {
      const res = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch leaves');
      return res.json();
    },
    refetchOnWindowFocus: true,
  });

  // Stat cards
  const stats = statsData || {};
  // Attendance summaries (per-employee from API)
  const summaries = summaryData?.summaries || [];

  // Aggregate by department so each department appears once
  const deptAgg = useMemo(() => {
    const map = new Map<string, { present: number; late: number; absent: number; leave: number; hours: number; count: number }>();
    for (const s of summaries) {
      const dept = s.department || 'Unassigned';
      if (!map.has(dept)) map.set(dept, { present: 0, late: 0, absent: 0, leave: 0, hours: 0, count: 0 });
      const m = map.get(dept)!;
      m.present += s.present || 0;
      m.late += s.late || 0;
      m.absent += s.absent || 0;
      m.leave += s.leave || 0;
      m.hours += s.hours || 0;
      m.count += 1;
    }
    return map;
  }, [summaries]);

  const deptRows = useMemo(() => {
    return Array.from(deptAgg.entries()).map(([department, m]) => ({
      department,
      present: m.present,
      late: m.late,
      absent: m.absent,
      leave: m.leave,
      hours: Number(m.hours.toFixed(1)),
      total: m.present + m.late + m.absent + m.leave,
    }));
  }, [deptAgg]);
  // Leave requests
  const leaves = useMemo(() => {
    const all = leaveData?.leaves || [];
    // Filter by appliedOnISO within selected range if available
    return all.filter((l: any) => {
      if (!l?.appliedOnISO) return true; // keep if no ISO timestamp (legacy)
      const t = new Date(l.appliedOnISO).getTime();
      return t >= new Date(startISO).getTime() && t <= new Date(endISO).getTime();
    });
  }, [leaveData, startISO, endISO]);

  // Pie chart data: attendance breakdown by department (aggregated)
  const attendancePieData = useMemo(() => {
    return deptRows.map((d) => ({ name: d.department, value: d.total }));
  }, [deptRows]);
  // Line chart data: attendance rate by department (aggregated)
  const attendanceLineData = useMemo(() => {
    return deptRows.map((d) => ({
      month: d.department,
      attendanceRate: d.total > 0 ? ((d.present + d.late) / d.total) * 100 : 0,
    }));
  }, [deptRows]);
  // Leave pie chart data
  const leaveTypeCounts: Record<string, number> = {};
  leaves.forEach((l: any) => {
    leaveTypeCounts[l.type] = (leaveTypeCounts[l.type] || 0) + 1;
  });
  const leavePieData = Object.entries(leaveTypeCounts).map(([name, value]) => ({ name, value }));

  const loading = statsLoading || summaryLoading || leaveLoading;

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground">Minimal overview of key HR metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={range} onValueChange={(v) => setRange(v as any)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Date range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stat strip */}
      {statsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Employees" value={stats.totalEmployees || 0} icon={Users} trend={typeof stats.employeesGrowthPct === 'number' ? `${stats.employeesGrowthPct >= 0 ? '+' : ''}${stats.employeesGrowthPct}% vs last month` : '—'} trendUp={(stats.employeesGrowthPct ?? 0) >= 0} />
          <StatCard title="Attendance Rate" value={`${Math.round(stats.attendanceRate || 0)}%`} icon={Calendar} trend={typeof stats.attendanceRateDiff === 'number' ? `${stats.attendanceRateDiff >= 0 ? '+' : ''}${stats.attendanceRateDiff}% vs last month` : '—'} trendUp={(stats.attendanceRateDiff ?? 0) >= 0} />
          <StatCard title="Pending Leaves" value={stats.pendingLeaves || 0} icon={FileText} trend="Current" />
          <StatCard title="Avg Work Hours" value={stats.avgHoursPerDay ? `${stats.avgHoursPerDay} hrs` : '0.0 hrs'} icon={TrendingUp} trend="Daily average" />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Attendance Breakdown</h3>
          {summaryLoading ? (
            <Skeleton className="h-72" />
          ) : attendancePieData.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
              No attendance data available
            </div>
          ) : (
            <AttendancePie data={attendancePieData} />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Attendance Rate</h3>
          {summaryLoading ? (
            <Skeleton className="h-72" />
          ) : attendanceLineData.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
              No attendance data available
            </div>
          ) : (
            <AttendanceLine data={attendanceLineData} />
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Leave Types</h3>
          {leaveLoading ? (
            <Skeleton className="h-72" />
          ) : leavePieData.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
              No leave data available
            </div>
          ) : (
            <LeavePie data={leavePieData} />
          )}
        </Card>

        <Card className="p-5">
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Department Snapshot</h3>
          {summaryLoading ? (
            <Skeleton className="h-72" />
          ) : deptRows.length === 0 ? (
            <div className="flex items-center justify-center h-72 text-sm text-muted-foreground">
              No department data available
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Present</TableHead>
                  <TableHead className="text-right">Late</TableHead>
                  <TableHead className="text-right">Absent</TableHead>
                  <TableHead className="text-right">Leave</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deptRows.map((d) => (
                  <TableRow key={d.department}>
                    <TableCell className="font-medium">{d.department}</TableCell>
                    <TableCell className="text-right">{d.present}</TableCell>
                    <TableCell className="text-right">{d.late}</TableCell>
                    <TableCell className="text-right">{d.absent}</TableCell>
                    <TableCell className="text-right">{d.leave}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
// End of file
}
