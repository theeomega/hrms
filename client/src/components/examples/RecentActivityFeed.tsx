import RecentActivityFeed from '../RecentActivityFeed';

export default function RecentActivityFeedExample() {
  const mockActivities = [
    { id: "1", user: "Sarah Johnson", action: "Applied for sick leave", time: "2 hours ago", status: "pending" as const },
    { id: "2", user: "Michael Chen", action: "Checked in", time: "3 hours ago" },
    { id: "3", user: "Emily Davis", action: "Leave request approved", time: "5 hours ago", status: "approved" as const },
    { id: "4", user: "James Wilson", action: "Checked out", time: "1 day ago" }
  ];
  
  return <RecentActivityFeed activities={mockActivities} />;
}
