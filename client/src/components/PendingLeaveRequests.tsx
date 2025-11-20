import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface LeaveRequest {
  id: string;
  employee: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
}

interface PendingLeaveRequestsProps {
  requests: LeaveRequest[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function PendingLeaveRequests({ requests, onApprove, onReject }: PendingLeaveRequestsProps) {
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .trim()
      .split(/\s+/)
      .map(n => n[0] || '')
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Pending Leave Requests</h3>
      <div className="space-y-4">
        {requests.filter(r => r.status === "pending").map((request) => (
          <div key={request.id} className="p-4 border rounded-lg hover-elevate">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(request.employee)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="font-medium" data-testid={`text-employee-${request.id}`}>{request.employee}</p>
                    <Badge variant="secondary" className="mt-1" data-testid={`badge-type-${request.id}`}>
                      {request.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{request.days} days</p>
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {request.startDate} - {request.endDate}
                </p>
                <p className="text-sm mb-3">{request.reason}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => onApprove?.(request.id)}
                    data-testid={`button-approve-${request.id}`}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onReject?.(request.id)}
                    data-testid={`button-reject-${request.id}`}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {requests.filter(r => r.status === "pending").length === 0 && (
          <p className="text-center text-muted-foreground py-8">No pending requests</p>
        )}
      </div>
    </Card>
  );
}
