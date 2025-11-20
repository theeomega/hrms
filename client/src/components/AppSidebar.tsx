import { Home, Calendar, FileText, Users, User, LogOut, Bell, Building2, BarChart3, Settings, Clock, FileEdit, MessageSquare } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";

interface AppSidebarProps {
  isHRAdmin?: boolean;
  onLogout: () => void;
}

export default function AppSidebar({ isHRAdmin = false, onLogout }: AppSidebarProps) {
  const [location, setLocation] = useLocation();

  // Fetch notification count with real-time auto-refresh (every 5 seconds)
  const { data: notificationData } = useQuery({
    queryKey: ['notification-count'],
    queryFn: async () => {
      const response = await fetch('/api/notifications', { credentials: 'include' });
      if (!response.ok) return { count: 0 };
      const data = await response.json();
      const unreadCount = data.notifications?.filter((n: any) => !n.read).length || 0;
      return { count: unreadCount };
    },
    staleTime: 0, // Always consider data stale to ensure fresh updates
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true, // Continue polling even when tab is not focused
  });

  // Fetch unread messages count
  const { data: messagesData } = useQuery({
    queryKey: ['unread-count'],
    queryFn: async () => {
      const response = await fetch('/api/messages/unread-count', { credentials: 'include' });
      if (!response.ok) return { count: 0 };
      return response.json();
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
  });

  // Fetch pending attendance corrections count for HR admins
  const { data: correctionsData } = useQuery({
    queryKey: ['pending-corrections-count'],
    queryFn: async () => {
      if (!isHRAdmin) return { count: 0 };
      const response = await fetch('/api/attendance/corrections/pending', { credentials: 'include' });
      if (!response.ok) return { count: 0 };
      const data = await response.json();
      const pendingCount = data.corrections?.filter((c: any) => c.status === 'pending').length || 0;
      return { count: pendingCount };
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: isHRAdmin, // Only run this query if the user is an HR admin
  });

  // Fetch pending leave requests count for HR admins
  const { data: leaveRequestsData } = useQuery({
    queryKey: ['pending-leave-requests-count'],
    queryFn: async () => {
      if (!isHRAdmin) return { count: 0 };
      const response = await fetch('/api/leave/requests', { credentials: 'include' });
      if (!response.ok) return { count: 0 };
      const data = await response.json();
      const pendingCount = data.leaves?.filter((l: any) => l.status === 'pending').length || 0;
      return { count: pendingCount };
    },
    staleTime: 0,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
    enabled: isHRAdmin, // Only run this query if the user is an HR admin
  });

  const unreadNotificationCount = notificationData?.count || 0;
  const unreadMessageCount = messagesData?.count || 0;
  const pendingCorrectionsCount = correctionsData?.count || 0;
  const pendingLeaveRequestsCount = leaveRequestsData?.count || 0;

  const employeeItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Attendance", url: "/attendance", icon: Calendar },
    { title: "My Leaves", url: "/leaves", icon: FileText },
    { title: "Messages", url: "/messages", icon: MessageSquare, badge: () => unreadMessageCount },
    { title: "Notifications", url: "/notifications", icon: Bell, badge: () => unreadNotificationCount },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const hrItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Attendance", url: "/attendance", icon: Calendar },
    { title: "Leave Requests", url: "/leave-requests", icon: FileText, badge: () => pendingLeaveRequestsCount },
    { title: "Att. Corrections", url: "/attendance/corrections", icon: FileEdit, badge: () => pendingCorrectionsCount },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Messages", url: "/messages", icon: MessageSquare, badge: () => unreadMessageCount },
    { title: "Notifications", url: "/notifications", icon: Bell, badge: () => unreadNotificationCount },
  ];

  const items = isHRAdmin ? hrItems : employeeItems;

  return (
    <Sidebar className="border-r">
      <SidebarHeader className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary">
            <Building2 className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-bold">HR Portal</h2>
            <p className="text-xs text-muted-foreground">{isHRAdmin ? 'Admin Panel' : 'Employee Panel'}</p>
          </div>
        </div>
      </SidebarHeader>
      
      <Separator />
      
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Main Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const badgeCount = item.badge ? item.badge() : 0;
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.url}
                      data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="mb-1"
                    >
                      <a href={item.url} onClick={(e) => { e.preventDefault(); setLocation(item.url); }} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-3">
                          <item.icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.title}</span>
                        </div>
                        {badgeCount > 0 && (
                          <Badge variant="default" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">
                            {badgeCount}
                          </Badge>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-4" />

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Settings
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={location === (isHRAdmin ? '/admin/settings' : '/settings')}
                  data-testid="link-settings"
                >
                  <a 
                    href={isHRAdmin ? "/admin/settings" : "/settings"} 
                    onClick={(e) => { 
                      e.preventDefault(); 
                      setLocation(isHRAdmin ? '/admin/settings' : '/settings'); 
                    }} 
                    className="flex items-center gap-3"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Settings</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <Separator />
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-logout" className="w-full" onClick={onLogout}>
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
