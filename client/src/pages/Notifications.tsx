import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CheckCircle2,
  BellRing,
  UserCheck,
  FileText,
  Trash2,
  Search,
  Filter,
  AlertTriangle,
  CalendarDays,
  CalendarClock,
  AlarmClock,
  Users
} from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface Notification {
  id: string;
  type: "leave" | "attendance" | "system" | "approval" | "alert" | "meeting" | "reminder" | "team";
  title: string;
  message: string;
  time: string;
  read: boolean;
  user?: string;
}

export default function Notifications() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch notifications with real-time polling (every 5 seconds)
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch notifications');
      return response.json();
    },
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });

  //  Mark notification as read mutation
  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark notification as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to mark all as read');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "All notifications marked as read",
      });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notification-count'] });
    },
  });

  const notifications: Notification[] = notificationsData?.notifications || [];

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !notificationsData;

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "leave":
        return <CalendarDays className="w-5 h-5 text-blue-600" />;
      case "attendance":
        return <UserCheck className="w-5 h-5 text-emerald-600" />;
      case "approval":
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case "system":
        return <BellRing className="w-5 h-5 text-purple-600" />;
      case "alert":
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
      case "meeting":
        return <CalendarClock className="w-5 h-5 text-indigo-600" />;
      case "reminder":
        return <AlarmClock className="w-5 h-5 text-orange-600" />;
      case "team":
        return <Users className="w-5 h-5 text-cyan-600" />;
      default:
        return <BellRing className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification: Notification) => {
      const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           notification.message.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "all" || notification.type === filterType;
      const matchesStatus = filterStatus === "all" || 
                           (filterStatus === "unread" && !notification.read) ||
                           (filterStatus === "read" && notification.read);
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchTerm, filterType, filterStatus]);

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    markReadMutation.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

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
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleMarkAllRead}
              disabled={markAllReadMutation.isPending || unreadCount === 0}
              data-testid="button-mark-all-read"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {markAllReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
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
            {showLoading ? (
              <div className="space-y-0">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i}>
                    <div className="flex items-start gap-4 p-4">
                      <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                    {i < 4 && <div className="border-b border-border"></div>}
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <BellRing className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification, index) => {
                const isUnread = !notification.read;
                const prevUnread = index > 0 && !filteredNotifications[index - 1]?.read;
                const nextUnread = index < filteredNotifications.length - 1 && !filteredNotifications[index + 1]?.read;
                const unreadClasses = isUnread
                  ? `bg-primary/5 border border-primary ${prevUnread ? 'border-t-0 rounded-t-none' : 'rounded-t-md'} ${nextUnread ? 'rounded-b-none' : 'rounded-b-md'}`
                  : '';
                return (
                <div key={notification.id}>
                  <div
                    className={`flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 ${unreadClasses}`}
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
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 px-3 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              data-testid={`button-mark-read-${notification.id}`}
                            >
                              <CheckCircle2 className="w-4 h-4 mr-1" />
                              Mark as Read
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0" 
                            data-testid={`button-delete-${notification.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {(() => {
                    const next = filteredNotifications[index + 1];
                    const shouldShowDivider = index < filteredNotifications.length - 1 && notification.read && (!next || next.read);
                    return shouldShowDivider ? (
                      <div className="border-b border-border"></div>
                    ) : null;
                  })()}
                </div>
                );
              })
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
