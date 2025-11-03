import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  user: string;
  action: string;
  time: string;
  status?: "approved" | "pending" | "rejected";
}

interface RecentActivityFeedProps {
  activities: Activity[];
}

export default function RecentActivityFeed({ activities }: RecentActivityFeedProps) {
  const getStatusVariant = (status?: string) => {
    switch (status) {
      case "approved":
        return "default";
      case "pending":
        return "secondary";
      case "rejected":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <ScrollArea className="h-[300px]">
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>{getInitials(activity.user)}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{activity.user}</p>
                    <p className="text-sm text-muted-foreground">{activity.action}</p>
                  </div>
                  {activity.status && (
                    <Badge variant={getStatusVariant(activity.status)} className="capitalize">
                      {activity.status}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
