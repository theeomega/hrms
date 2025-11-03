import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LeaveType {
  type: string;
  used: number;
  total: number;
  color: string;
}

interface LeaveBalanceCardProps {
  leaves: LeaveType[];
}

export default function LeaveBalanceCard({ leaves }: LeaveBalanceCardProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Leave Balance</h3>
      <div className="space-y-4">
        {leaves.map((leave, index) => (
          <div key={index}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">{leave.type}</span>
              <span className="text-sm text-muted-foreground">
                {leave.used}/{leave.total} days
              </span>
            </div>
            <Progress 
              value={(leave.used / leave.total) * 100} 
              className="h-2"
            />
          </div>
        ))}
      </div>
    </Card>
  );
}
