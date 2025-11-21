import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Building2, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import NotFound from "./not-found";

export default function Signup() {
  const [, setLocation] = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    department: "",
    position: "",
    phone: "",
    location: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Check if user is logged in and is admin
  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      return (await res.json()).user;
    },
    retry: false
  });
  
  const isSystemAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';

  // Fetch system settings
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    }
  });

  // Check bootstrap state (are there existing users?)
  const { data: bootstrap } = useQuery({
    queryKey: ['bootstrap-info'],
    queryFn: async () => {
      const res = await fetch('/api/auth/bootstrap');
      if (!res.ok) throw new Error('Failed to load bootstrap info');
      return res.json();
    }
  });

  const signupEnabled = settings?.signupEnabled ?? true;

  // Fetch public org data
  const { data: orgData } = useQuery({
    queryKey: ['public-org-data'],
    queryFn: async () => {
      const [depts, zones, roles] = await Promise.all([
        fetch('/api/public/org/departments').then(r => r.json()),
        fetch('/api/public/org/zones').then(r => r.json()),
        fetch('/api/public/org/roles').then(r => r.json())
      ]);
      return { 
        departments: depts.departments || [], 
        zones: zones.zones || [], 
        roles: roles.roles || [] 
      };
    }
  });

  if (isSettingsLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  const hasUsers = bootstrap?.hasUsers;
  const isInitialSetup = hasUsers === false; // explicitly false means no users yet

  if (!signupEnabled && !isSystemAdmin && hasUsers) {
    return <NotFound />;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.username || !formData.email || !formData.password || !formData.fullName) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isAdmin) {
      if (!formData.department) {
        toast({
          title: "Missing Information",
          description: "Please select a department",
          variant: "destructive",
        });
        return;
      }

      if (!formData.position) {
        toast({
          title: "Missing Information",
          description: "Please select a position",
          variant: "destructive",
        });
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Weak Password",
        description: "Password must be at least 6 characters",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          department: formData.department,
          position: formData.position,
          phone: formData.phone || '',
          location: formData.location,
          role: isAdmin ? 'admin' : 'employee'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Signup failed');
      }
      
      toast({
        title: "Signup Successful",
        description: "Your account has been created. Please login.",
      });
      
      setLocation("/login");
    } catch (error) {
      toast({
        title: "Signup Failed",
        description: error instanceof Error ? error.message : "An error occurred during signup",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-chart-2/10 py-8">
      <Card className="w-full max-w-2xl p-8 mx-4">
        <div className="flex flex-col items-center mb-8">
          <div className={`flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isAdmin ? 'bg-purple-600' : 'bg-primary'}`}>
            {isAdmin ? (
              <ShieldCheck className="w-8 h-8 text-white" />
            ) : (
              <Building2 className="w-8 h-8 text-primary-foreground" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-center">HR Management System</h1>
          <p className="text-muted-foreground text-center mt-2">
            {isInitialSetup
              ? 'Initial system setup — create the first account'
              : isAdmin ? 'Create admin account' : 'Create your account'}
          </p>
        </div>

        {/* Admin Toggle */}
        <div className="flex items-center justify-between p-4 mb-6 rounded-lg bg-muted/50 border">
          <div className="flex items-center gap-3">
            <ShieldCheck className={`w-5 h-5 ${isAdmin ? 'text-purple-600' : 'text-muted-foreground'}`} />
            <div>
              <Label htmlFor="admin-mode" className="text-sm font-medium">Admin Account</Label>
              <p className="text-xs text-muted-foreground">Create account with administrative privileges</p>
            </div>
          </div>
          <Switch
            id="admin-mode"
            checked={isAdmin}
            onCheckedChange={setIsAdmin}
            disabled={isLoading}
          />
        </div>
        {isInitialSetup && (
          <div className="mb-6 text-xs text-center bg-primary/5 border border-primary/20 rounded-md p-3 text-muted-foreground">
            Public signup is disabled, but no accounts exist yet. This initial signup is allowed.
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 characters"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password *</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="John Doe"
                value={formData.fullName}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="department">Department {isAdmin ? '(Optional)' : '*'}</Label>
              <Select 
                value={formData.department} 
                onValueChange={(v) => setFormData({...formData, department: v})}
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {orgData?.departments?.map((d: any) => (
                    <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="position">Position {isAdmin ? '(Optional)' : '*'}</Label>
              <Select 
                value={formData.position} 
                onValueChange={(v) => setFormData({...formData, position: v})}
              >
                <SelectTrigger id="position">
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {orgData?.roles?.map((r: any) => (
                    <SelectItem key={r.id} value={r.name}>
                      <div className="flex items-center gap-2">
                        {r.name}
                        {r.protected && (
                          <span className="text-[9px] uppercase tracking-wide bg-primary/10 text-primary px-1 py-0.5 rounded">
                            default
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 234 567 8900"
                value={formData.phone}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location {isAdmin ? '(Optional)' : ''}</Label>
              <Select 
                value={formData.location} 
                onValueChange={(v) => setFormData({...formData, location: v})}
              >
                <SelectTrigger id="location">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {orgData?.zones?.map((z: any) => (
                    <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login">
              <span className="text-primary font-medium hover:underline cursor-pointer">
                Sign in
              </span>
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
