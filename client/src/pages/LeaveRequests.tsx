import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PendingLeaveRequests from "@/components/PendingLeaveRequests";
import StatCard from "@/components/StatCard";
import { Clock, CheckCircle, XCircle, FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockLeaveRequests = [
  { id: "1", employee: "Sarah Johnson", type: "Sick Leave", startDate: "Nov 05, 2025", endDate: "Nov 07, 2025", days: 3, reason: "Medical appointment and recovery", status: "pending" as const },
  { id: "2", employee: "Michael Chen", type: "Vacation", startDate: "Nov 10, 2025", endDate: "Nov 17, 2025", days: 7, reason: "Family vacation", status: "pending" as const },
  { id: "3", employee: "Emily Davis", type: "Personal Leave", startDate: "Oct 28, 2025", endDate: "Oct 29, 2025", days: 2, reason: "Personal matters", status: "approved" as const },
  { id: "4", employee: "James Wilson", type: "Sick Leave", startDate: "Oct 20, 2025", endDate: "Oct 21, 2025", days: 2, reason: "Flu", status: "approved" as const },
  { id: "5", employee: "Lisa Anderson", type: "Vacation", startDate: "Oct 15, 2025", endDate: "Oct 16, 2025", days: 2, reason: "Short trip", status: "rejected" as const },
];

export default function LeaveRequests() {
  const [requests] = useState(mockLeaveRequests);

  const pendingCount = requests.filter(r => r.status === "pending").length;
  const approvedCount = requests.filter(r => r.status === "approved").length;
  const rejectedCount = requests.filter(r => r.status === "rejected").length;

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default";
      case "pending": return "secondary";
      case "rejected": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Leave Requests</h1>
        <p className="text-muted-foreground">Manage employee leave applications</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Requests" value={requests.length} icon={FileText} />
        <StatCard title="Pending" value={pendingCount} icon={Clock} />
        <StatCard title="Approved" value={approvedCount} icon={CheckCircle} />
        <StatCard title="Rejected" value={rejectedCount} icon={XCircle} />
      </div>

      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">Pending ({pendingCount})</TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">Approved ({approvedCount})</TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">Rejected ({rejectedCount})</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">All Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <PendingLeaveRequests requests={requests} />
        </TabsContent>

        <TabsContent value="approved">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Approved Requests</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === "approved").map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employee}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.startDate} - {request.endDate}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)} className="capitalize">
                        {request.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">Rejected Requests</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.filter(r => r.status === "rejected").map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employee}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.startDate} - {request.endDate}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)} className="capitalize">
                        {request.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card className="p-6">
            <h3 className="font-semibold mb-4">All Leave Requests</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.employee}</TableCell>
                    <TableCell>{request.type}</TableCell>
                    <TableCell>{request.startDate} - {request.endDate}</TableCell>
                    <TableCell>{request.days}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusVariant(request.status)} className="capitalize">
                        {request.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
