import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCheck, Bell, Calendar, UserCheck, FileText, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  type: "leave" | "attendance" | "system" | "approval";
  title: string;
  message: string;
  time: string;
  read: boolean;
  user?: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "leave", title: "Leave Request Approved", message: "Your vacation leave request for Nov 10-17 has been approved", time: "2 hours ago", read: false },
  { id: "2", type: "attendance", title: "Check-in Reminder", message: "Don't forget to check in for today", time: "5 hours ago", read: false },
  { id: "3", type: "approval", title: "New Leave Request", message: "Sarah Johnson has applied for sick leave (Nov 5-7)", time: "1 day ago", read: true, user: "Sarah Johnson" },
  { id: "4", type: "system", title: "System Update", message: "The HR portal will be under maintenance on Nov 5, 2025", time: "2 days ago", read: true },
  { id: "5", type: "attendance", title: "Late Check-in", message: "You checked in late today at 9:15 AM", time: "3 days ago", read: true },
  { id: "6", type: "leave", title: "Leave Balance Update", message: "Your leave balance has been updated for the new quarter", time: "5 days ago", read: true },
];

export default function Notifications() {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave": return <FileText className="w-5 h-5 text-primary" />;
      case "attendance": return <UserCheck className="w-5 h-5 text-secondary" />;
      case "approval": return <CheckCheck className="w-5 h-5 text-accent" />;
      case "system": return <Bell className="w-5 h-5 text-muted-foreground" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your latest activities</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-mark-all-read">
            <CheckCheck className="w-4 h-4 mr-2" />
            Mark all as read
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" data-testid="tab-all-notifications">
            All ({mockNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="unread" data-testid="tab-unread">
            Unread ({unreadCount})
          </TabsTrigger>
          <TabsTrigger value="leave" data-testid="tab-leave-notif">Leave</TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance-notif">Attendance</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {mockNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 hover-elevate ${!notification.read ? 'border-l-4 border-l-primary' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className={`font-semibold ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`text-notif-title-${notification.id}`}>
                      {notification.title}
                    </h3>
                    {!notification.read && (
                      <Badge variant="default" className="shrink-0">New</Badge>
                    )}
                  </div>
                  {notification.user && (
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{getInitials(notification.user)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-muted-foreground">{notification.user}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-${notification.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="unread" className="space-y-3">
          {mockNotifications.filter(n => !n.read).map((notification) => (
            <Card key={notification.id} className="p-4 border-l-4 border-l-primary hover-elevate">
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold">{notification.title}</h3>
                    <Badge variant="default" className="shrink-0">New</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">{notification.time}</span>
                    <Button variant="ghost" size="sm" data-testid={`button-delete-unread-${notification.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="leave" className="space-y-3">
          {mockNotifications.filter(n => n.type === "leave").map((notification) => (
            <Card key={notification.id} className={`p-4 hover-elevate ${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-3">
          {mockNotifications.filter(n => n.type === "attendance").map((notification) => (
            <Card key={notification.id} className={`p-4 hover-elevate ${!notification.read ? 'border-l-4 border-l-primary' : ''}`}>
              <div className="flex items-start gap-4">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full ${!notification.read ? 'bg-primary/10' : 'bg-muted'}`}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold mb-1 ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
                  <span className="text-xs text-muted-foreground">{notification.time}</span>
                </div>
              </div>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
