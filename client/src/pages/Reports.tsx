import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StatCard from "@/components/StatCard";
import { Download, TrendingUp, Users, Calendar, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">View comprehensive HR reports and insights</p>
        </div>
        <div className="flex gap-2">
          <Select defaultValue="month">
            <SelectTrigger className="w-[180px]" data-testid="select-report-period">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button data-testid="button-export-report">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Employees" value={248} icon={Users} trend="+12% vs last month" trendUp={true} />
        <StatCard title="Avg Attendance" value="94.2%" icon={Calendar} trend="+2.3% improvement" trendUp={true} />
        <StatCard title="Leave Requests" value={156} icon={FileText} trend="This month" />
        <StatCard title="Productivity" value="87%" icon={TrendingUp} trend="+5% vs last month" trendUp={true} />
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance" data-testid="tab-attendance-report">Attendance Report</TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-leave-report">Leave Report</TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance-report">Performance Report</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Attendance Summary by Department</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Total Employees</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Late</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Engineering</TableCell>
                  <TableCell>85</TableCell>
                  <TableCell>81</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>95.3%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Product</TableCell>
                  <TableCell>42</TableCell>
                  <TableCell>40</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>95.2%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Design</TableCell>
                  <TableCell>28</TableCell>
                  <TableCell>26</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>92.9%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Marketing</TableCell>
                  <TableCell>35</TableCell>
                  <TableCell>33</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>94.3%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sales</TableCell>
                  <TableCell>58</TableCell>
                  <TableCell>52</TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>89.7%</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="leave">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Leave Statistics by Type</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Leave Type</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Pending</TableHead>
                  <TableHead>Rejected</TableHead>
                  <TableHead>Total Days</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Sick Leave</TableCell>
                  <TableCell>45</TableCell>
                  <TableCell>38</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>2</TableCell>
                  <TableCell>132</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Vacation</TableCell>
                  <TableCell>78</TableCell>
                  <TableCell>65</TableCell>
                  <TableCell>10</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>486</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Personal Leave</TableCell>
                  <TableCell>23</TableCell>
                  <TableCell>19</TableCell>
                  <TableCell>3</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>54</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Maternity/Paternity</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>280</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Other</TableCell>
                  <TableCell>5</TableCell>
                  <TableCell>4</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>1</TableCell>
                  <TableCell>12</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="performance">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Department Performance Metrics</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead>Avg Attendance</TableHead>
                  <TableHead>Avg Working Hours</TableHead>
                  <TableHead>Leave Usage</TableHead>
                  <TableHead>Performance Score</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Engineering</TableCell>
                  <TableCell>95.3%</TableCell>
                  <TableCell>8.4 hrs</TableCell>
                  <TableCell>68%</TableCell>
                  <TableCell className="text-secondary font-semibold">Excellent</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Product</TableCell>
                  <TableCell>95.2%</TableCell>
                  <TableCell>8.2 hrs</TableCell>
                  <TableCell>72%</TableCell>
                  <TableCell className="text-secondary font-semibold">Excellent</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Design</TableCell>
                  <TableCell>92.9%</TableCell>
                  <TableCell>8.1 hrs</TableCell>
                  <TableCell>65%</TableCell>
                  <TableCell className="text-primary font-semibold">Good</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Marketing</TableCell>
                  <TableCell>94.3%</TableCell>
                  <TableCell>8.3 hrs</TableCell>
                  <TableCell>70%</TableCell>
                  <TableCell className="text-secondary font-semibold">Excellent</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Sales</TableCell>
                  <TableCell>89.7%</TableCell>
                  <TableCell>8.0 hrs</TableCell>
                  <TableCell>75%</TableCell>
                  <TableCell className="text-accent font-semibold">Average</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
