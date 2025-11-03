import PendingLeaveRequests from '../PendingLeaveRequests';

export default function PendingLeaveRequestsExample() {
  const mockRequests = [
    {
      id: "1",
      employee: "Sarah Johnson",
      type: "Sick Leave",
      startDate: "Nov 05, 2025",
      endDate: "Nov 07, 2025",
      days: 3,
      reason: "Medical appointment and recovery",
      status: "pending" as const
    },
    {
      id: "2",
      employee: "Michael Chen",
      type: "Vacation",
      startDate: "Nov 10, 2025",
      endDate: "Nov 17, 2025",
      days: 7,
      reason: "Family vacation",
      status: "pending" as const
    }
  ];
  
  return <PendingLeaveRequests requests={mockRequests} />;
}
