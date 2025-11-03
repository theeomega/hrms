import AttendanceTable from '../AttendanceTable';

export default function AttendanceTableExample() {
  const mockRecords = [
    { id: "1", date: "Nov 03, 2025", checkIn: "09:00 AM", checkOut: "05:30 PM", hours: "8.5", status: "present" as const },
    { id: "2", date: "Nov 02, 2025", checkIn: "09:15 AM", checkOut: "05:45 PM", hours: "8.5", status: "late" as const },
    { id: "3", date: "Nov 01, 2025", checkIn: "09:00 AM", checkOut: "05:00 PM", hours: "8.0", status: "present" as const },
  ];
  
  return <AttendanceTable records={mockRecords} />;
}
