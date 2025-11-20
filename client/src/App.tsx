import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import EmployeeDetail from './pages/EmployeeDetail';
import Attendance from "@/pages/Attendance";
import AttendanceHistory from "@/pages/AttendanceHistory";
import AttendanceCorrection from "@/pages/AttendanceCorrection";
import AttendanceCorrectionManagement from "@/pages/AttendanceCorrectionManagement";
import AttendanceCorrectionDetail from "@/pages/AttendanceCorrectionDetail";
import ActivityHistory from "@/pages/ActivityHistory";
import LeaveRequests from "@/pages/LeaveRequests";
import LeaveRequestDetail from "@/pages/LeaveRequestDetail";
import Leaves from "@/pages/Leaves";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import AdminSettings from "@/pages/AdminSettings";
import Messages from "@/pages/Messages";
import NotFound from "@/pages/not-found";
import Settings from "@/pages/Settings";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Moon, Sun } from "lucide-react";
import { authAPI } from "@/lib/api";
import type { User } from "@shared/schema";

function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      data-testid="button-theme-toggle"
    >
      {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
    </Button>
  );
}

interface AuthenticatedAppProps {
  user: User;
  onLogout: () => void;
}

function AuthenticatedApp({ user, onLogout }: AuthenticatedAppProps) {
  const isHRAdmin = user.role === "admin" || user.role === "hr_admin";
  const queryClient = useQueryClient();

  const style = {
    "--sidebar-width": "16rem",
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      // Clear all React Query cache on logout
      queryClient.clear();
      onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
      // Clear cache even if logout fails
      queryClient.clear();
      onLogout(); // Logout anyway
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isHRAdmin={isHRAdmin} onLogout={handleLogout} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium leading-none">{user.username}</p>
                  <p className="text-xs text-muted-foreground mt-1">{isHRAdmin ? 'Admin' : 'Employee'}</p>
                </div>
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            <Switch>
              <Route path="/" component={() => <Dashboard isHRAdmin={isHRAdmin} />} />
              {isHRAdmin && <Route path="/employees" component={Employees} />}
              <Route path="/employees/:id" component={EmployeeDetail} />
              <Route path="/attendance" component={Attendance} />
              <Route path="/attendance/history" component={AttendanceHistory} />
              <Route path="/attendance/correction/:id?" component={AttendanceCorrection} />
              {isHRAdmin && <Route path="/attendance/corrections/:id" component={AttendanceCorrectionDetail} />}
              {isHRAdmin && <Route path="/attendance/corrections" component={AttendanceCorrectionManagement} />}
              <Route path="/activity" component={ActivityHistory} />
              <Route path="/leaves" component={Leaves} />
              <Route path="/leaves/:id" component={LeaveRequestDetail} />
              {isHRAdmin && <Route path="/leave-requests/:id" component={LeaveRequestDetail} />}
              {isHRAdmin && <Route path="/leave-requests" component={LeaveRequests} />}
              {isHRAdmin && <Route path="/reports" component={Reports} />}
              {isHRAdmin && <Route path="/admin/settings" component={AdminSettings} />}
              <Route path="/settings" component={Settings} />
              <Route path="/messages" component={Messages} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    authAPI.getMe()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/login">
        <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />
      </Route>
      <Route path="/signup">
        <Signup />
      </Route>
      <Route path="*">
        {user ? (
          <AuthenticatedApp user={user} onLogout={() => setUser(null)} />
        ) : (
          <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />
        )}
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
