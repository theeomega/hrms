import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AttendanceRecord {
  id: string;
  date: string;
  checkIn: string;
  checkOut: string;
  hours: string;
  status: "present" | "late" | "absent";
}

interface AttendanceTableProps {
  records: AttendanceRecord[];
}

export default function AttendanceTable({ records }: AttendanceTableProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "present":
        return "default";
      case "late":
        return "secondary";
      case "absent":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Attendance History</h3>
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
          {records.map((record) => (
            <TableRow key={record.id}>
              <TableCell className="font-medium" data-testid={`text-date-${record.id}`}>{record.date}</TableCell>
              <TableCell data-testid={`text-checkin-${record.id}`}>{record.checkIn}</TableCell>
              <TableCell data-testid={`text-checkout-${record.id}`}>{record.checkOut}</TableCell>
              <TableCell data-testid={`text-hours-${record.id}`}>{record.hours}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(record.status)} className="capitalize" data-testid={`badge-status-${record.id}`}>
                  {record.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
