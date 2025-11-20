import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";
import { useLocation } from "wouter";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: "present" | "late" | "absent" | "leave";
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
  const [, navigate] = useLocation();

  const handleRequestCorrection = (record: AttendanceRecord) => {
    navigate(`/attendance/correction/${record.id}`);
  };

  const handleAddNote = (record: AttendanceRecord) => {
    navigate(`/attendance/correction/${record.id}?tab=note`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return { variant: "secondary" as const, className: "bg-emerald-500/10 text-emerald-700 border-0 font-medium dark:bg-emerald-500/10 dark:text-emerald-400" };
      case "late":
        return { variant: "secondary" as const, className: "bg-amber-500/10 text-amber-700 border-0 font-medium dark:bg-amber-500/10 dark:text-amber-400" };
      case "absent":
        return { variant: "secondary" as const, className: "bg-rose-500/10 text-rose-700 border-0 font-medium dark:bg-rose-500/10 dark:text-rose-400" };
      case "leave":
        return { variant: "secondary" as const, className: "bg-sky-500/10 text-sky-700 border-0 font-medium dark:bg-sky-500/10 dark:text-sky-400" };
      default:
        return { variant: "secondary" as const, className: "bg-slate-500/10 text-slate-700 border-0 font-medium dark:bg-slate-500/10 dark:text-slate-400" };
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Check In</TableHead>
            <TableHead>Check Out</TableHead>
            <TableHead>Hours</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium" data-testid={`text-date-${record.id}`}>{record.date}</TableCell>
              <TableCell data-testid={`text-checkin-${record.id}`}>{record.checkIn}</TableCell>
              <TableCell data-testid={`text-checkout-${record.id}`}>{record.checkOut}</TableCell>
              <TableCell data-testid={`text-hours-${record.id}`}>{record.hours}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    record.status === 'present' ? 'bg-emerald-500' : 
                    record.status === 'late' ? 'bg-amber-500' : 
                    record.status === 'absent' ? 'bg-rose-500' : 
                    record.status === 'leave' ? 'bg-sky-500' : 'bg-slate-500'
                  }`} />
                  <span className="text-sm font-medium capitalize">{record.status}</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleRequestCorrection(record)}>
                      Correction
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleAddNote(record)}>
                      Add Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  );
}
