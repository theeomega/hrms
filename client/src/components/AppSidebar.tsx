import { Home, Calendar, FileText, Users, User, LogOut, Bell, Building2, BarChart3, Settings, Clock } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar";
import { useLocation } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

interface AppSidebarProps {
  isHRAdmin?: boolean;
}

export default function AppSidebar({ isHRAdmin = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();

  const employeeItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Attendance", url: "/attendance", icon: Calendar },
    { title: "My Leaves", url: "/leaves", icon: FileText },
    { title: "Notifications", url: "/notifications", icon: Bell, badge: 2 },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const hrItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Attendance", url: "/attendance", icon: Calendar },
    { title: "Leave Requests", url: "/leave-requests", icon: FileText },
    { title: "Reports", url: "/reports", icon: BarChart3 },
    { title: "Notifications", url: "/notifications", icon: Bell, badge: 2 },
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
              {items.map((item) => (
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
                      {item.badge && item.badge > 0 && (
                        <Badge variant="default" className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-xs">{item.badge}</Badge>
                      )}
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
                <SidebarMenuButton data-testid="link-settings">
                  <Settings className="w-4 h-4" />
                  <span className="text-sm font-medium">Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <Separator />
      
      <SidebarFooter className="p-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 mb-2">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {isHRAdmin ? 'HR' : 'JD'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{isHRAdmin ? 'Admin User' : 'John Doe'}</p>
            <p className="text-xs text-muted-foreground truncate">{isHRAdmin ? 'HR Manager' : 'Employee'}</p>
          </div>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-logout" className="w-full">
              <LogOut className="w-4 h-4" />
              <span className="text-sm font-medium">Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
