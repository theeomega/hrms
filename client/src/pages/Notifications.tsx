import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCheck, Bell, UserCheck, FileText, Trash2, Search, Filter, AlertCircle, Calendar, Clock, Users } from "lucide-react";
import { useState, useMemo } from "react";

interface Notification {
  id: string;
  type: "leave" | "attendance" | "system" | "approval" | "alert" | "meeting" | "reminder" | "team";
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
  { id: "7", type: "alert", title: "Missed Check-out", message: "You forgot to check out yesterday. Please update your attendance.", time: "1 day ago", read: false },
  { id: "8", type: "meeting", title: "Team Meeting Scheduled", message: "Weekly team sync scheduled for Nov 7, 2025 at 10:00 AM", time: "3 hours ago", read: false },
  { id: "9", type: "reminder", title: "Timesheet Submission", message: "Your monthly timesheet is due by end of this week", time: "6 hours ago", read: false },
  { id: "10", type: "team", title: "New Team Member", message: "John Doe has joined the Development team", time: "2 days ago", read: true, user: "John Doe" },
  { id: "11", type: "approval", title: "Overtime Request Pending", message: "Your overtime request for Nov 3 is pending approval", time: "4 days ago", read: true },
  { id: "12", type: "alert", title: "Policy Update", message: "Company leave policy has been updated. Please review the changes.", time: "1 week ago", read: true },
];

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave": return <FileText className="w-5 h-5 text-blue-500" />;
      case "attendance": return <UserCheck className="w-5 h-5 text-emerald-500" />;
      case "approval": return <CheckCheck className="w-5 h-5 text-amber-500" />;
      case "system": return <Bell className="w-5 h-5 text-purple-500" />;
      case "alert": return <AlertCircle className="w-5 h-5 text-rose-500" />;
      case "meeting": return <Calendar className="w-5 h-5 text-indigo-500" />;
      case "reminder": return <Clock className="w-5 h-5 text-orange-500" />;
      case "team": return <Users className="w-5 h-5 text-cyan-500" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    return mockNotifications.filter(notification => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || notification.type === filterType;
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "unread" && !notification.read) ||
                           (filterStatus === "read" && notification.read);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [searchTerm, filterType, filterStatus]);

  const unreadCount = mockNotifications.filter(n => !n.read).length;

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Unique Minimal Header - Split Design */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">My</h1>
              <span className="text-5xl font-bold">Notifications</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Stay updated with your latest activities
            </p>
          </div>
          <div className="text-right space-y-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Header with Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold">All Notifications</h2>
            <Button variant="outline" size="sm" data-testid="button-mark-all-read">
              <CheckCheck className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="attendance">Attendance</SelectItem>
                <SelectItem value="approval">Approval</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="alert">Alert</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="team">Team</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notifications */}
          <div className="space-y-0">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${
                      !notification.read ? 'bg-primary/10' : 'bg-muted'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`} data-testid={`text-notif-title-${notification.id}`}>
                          {notification.title}
                        </h3>
                        {!notification.read && (
                          <Badge variant="default" className="shrink-0 text-xs">New</Badge>
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
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" data-testid={`button-delete-${notification.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < filteredNotifications.length - 1 && (
                    <div className="border-b border-border"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
