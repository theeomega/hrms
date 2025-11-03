import { Home, Calendar, FileText, Users, User, LogOut } from "lucide-react";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter } from "@/components/ui/sidebar";
import { useLocation } from "wouter";

interface AppSidebarProps {
  isHRAdmin?: boolean;
}

export default function AppSidebar({ isHRAdmin = false }: AppSidebarProps) {
  const [location, setLocation] = useLocation();

  const employeeItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "My Attendance", url: "/attendance", icon: Calendar },
    { title: "My Leaves", url: "/leaves", icon: FileText },
    { title: "Profile", url: "/profile", icon: User },
  ];

  const hrItems = [
    { title: "Dashboard", url: "/", icon: Home },
    { title: "Employees", url: "/employees", icon: Users },
    { title: "Attendance", url: "/attendance", icon: Calendar },
    { title: "Leave Requests", url: "/leave-requests", icon: FileText },
  ];

  const items = isHRAdmin ? hrItems : employeeItems;

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg font-bold px-2 mb-2">HR Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    <a href={item.url} onClick={(e) => { e.preventDefault(); setLocation(item.url); }}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton data-testid="button-logout">
              <LogOut />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
