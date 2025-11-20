import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileEdit } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function AttendanceCorrectionManagement() {
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("pending");

  const { data: correctionsData, isLoading } = useQuery({
    queryKey: ['/api/attendance/corrections/all'],
    queryFn: async () => {
      const response = await fetch('/api/attendance/corrections/pending', { 
        credentials: 'include' 
      });
      if (!response.ok) throw new Error('Failed to fetch correction requests');
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 2000, // Refresh every 2 seconds for faster updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });

  const allCorrections = correctionsData?.corrections || [];
  
  // Filter corrections by status
  const pendingCorrections = allCorrections.filter((c: any) => c.status === 'pending');
  const approvedCorrections = allCorrections.filter((c: any) => c.status === 'approved');
  const rejectedCorrections = allCorrections.filter((c: any) => c.status === 'rejected');

  const showLoading = isLoading && !correctionsData;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present": return "bg-green-500";
      case "late": return "bg-yellow-500";
      case "absent": return "bg-red-500";
      case "leave": return "bg-blue-500";
      default: return "bg-gray-500";
    }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const renderCorrectionsList = (corrections: any[], emptyMessage: string) => {
    if (corrections.length === 0) {
      return (
        <Card className="py-16 border-dashed">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <FileEdit className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{emptyMessage}</h3>
            <p className="text-sm text-muted-foreground">No correction requests found in this category.</p>
          </div>
        </Card>
      );
    }

    return (
      <Card>
        <Table className="table-fixed w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] px-6">Employee</TableHead>
              <TableHead className="w-[120px] px-6">Date</TableHead>
              <TableHead className="w-[180px] px-6">Time</TableHead>
              <TableHead className="w-[120px] px-6">Status</TableHead>
              <TableHead className="w-[150px] text-right px-6">Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {corrections.map((request: any) => (
              <TableRow 
                key={request.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/attendance/corrections/${request.id}`)}
              >
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/5 text-primary font-semibold text-xs">
                        {getInitials(request.user.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{request.user.name}</p>
                      <p className="text-xs text-muted-foreground">{request.user.employeeId}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="px-6">{request.attendance.date}</TableCell>
                <TableCell className="px-6">
                  {request.attendance.checkIn || '--'} - {request.attendance.checkOut || '--'}
                </TableCell>
                <TableCell className="px-6">
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${getStatusColor(request.attendance.status)}`} />
                    <span className="capitalize">{request.attendance.status}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right text-muted-foreground px-6">
                  {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    );
  };

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Attendance Corrections</h1>
          <p className="text-muted-foreground">Review and manage employee attendance correction requests</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {renderCorrectionsList(pendingCorrections, "No pending requests")}
        </TabsContent>

        <TabsContent value="approved" className="mt-4">
          {renderCorrectionsList(approvedCorrections, "No approved requests")}
        </TabsContent>

        <TabsContent value="rejected" className="mt-4">
          {renderCorrectionsList(rejectedCorrections, "No rejected requests")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
