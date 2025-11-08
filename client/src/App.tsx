import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "@/components/AppSidebar";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Employees from "@/pages/Employees";
import Attendance from "@/pages/Attendance";
import AttendanceHistory from "@/pages/AttendanceHistory";
import LeaveRequests from "@/pages/LeaveRequests";
import Leaves from "@/pages/Leaves";
import Profile from "@/pages/Profile";
import Notifications from "@/pages/Notifications";
import Reports from "@/pages/Reports";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
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
  const isHRAdmin = user.role === "hr_admin";

  const style = {
    "--sidebar-width": "16rem",
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
      onLogout(); // Logout anyway
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar isHRAdmin={isHRAdmin} />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between p-4 border-b">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                {user.username} {isHRAdmin && "(Admin)"}
              </span>
              <ThemeToggle />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleLogout}
                data-testid="button-logout"
              >
                Logout
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 bg-muted/30">
            <Switch>
              <Route path="/" component={() => <Dashboard isHRAdmin={isHRAdmin} />} />
              <Route path="/employees" component={Employees} />
              <Route path="/attendance" component={Attendance} />
              <Route path="/attendance/history" component={AttendanceHistory} />
              <Route path="/leaves" component={Leaves} />
              <Route path="/leave-requests" component={LeaveRequests} />
              <Route path="/reports" component={Reports} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/profile" component={Profile} />
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
