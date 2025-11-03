import LeaveBalanceCard from '../LeaveBalanceCard';

export default function LeaveBalanceCardExample() {
  const mockLeaves = [
    { type: "Sick Leave", used: 3, total: 12, color: "chart-1" },
    { type: "Vacation", used: 8, total: 15, color: "chart-2" },
    { type: "Personal", used: 2, total: 5, color: "chart-3" }
  ];
  
  return <LeaveBalanceCard leaves={mockLeaves} />;
}
