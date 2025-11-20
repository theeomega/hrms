import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { 
  Shield, 
  Building2, 
  MapPin, 
  Users, 
  FileText, 
  Lock, 
  Plus, 
  Pencil, 
  Trash2, 
  X,
  Check,
  Clock,
  CalendarDays,
  History
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { startOfDay } from 'date-fns';

export default function AdminSettings() {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to change password');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: 'Success', description: data.message || 'Password updated.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({ title: 'Validation', description: 'Fill in all password fields', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Validation', description: 'New passwords do not match', variant: 'destructive' });
      return;
    }
    changePasswordMutation.mutate();
  };

  return (
    <div className="max-w-[1600px] mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">
            Manage organization preferences and policies.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="account" className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 flex-shrink-0">
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
            <SettingsTab value="account" icon={Lock} label="Account" />
            <SettingsTab value="organization" icon={Building2} label="Departments" />
            <SettingsTab value="zones" icon={MapPin} label="Zones" />
            <SettingsTab value="roles" icon={Users} label="Roles" />
            <SettingsTab value="attendance" icon={Clock} label="Attendance" />
            <SettingsTab value="leave" icon={FileText} label="Leave Policy" />
            <SettingsTab value="security" icon={Shield} label="Security" />
          </TabsList>
        </aside>

        <div className="flex-1 space-y-6">
          <TabsContent value="account" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>Ensure your account is using a strong password.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="current">Current Password</Label>
                  <Input 
                    id="current" 
                    type="password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="new">New Password</Label>
                  <Input 
                    id="new" 
                    type="password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm">Confirm Password</Label>
                  <Input 
                    id="confirm" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleChangePassword} disabled={changePasswordMutation.isPending}>
                    {changePasswordMutation.isPending ? 'Updating...' : 'Update Password'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <OrgCrudSection 
            kind="organization" 
            title="Departments" 
            description="Manage the departments within your organization." 
          />

          <OrgCrudSection 
            kind="zones" 
            title="Zones" 
            description="Define geographical zones or office locations." 
          />

          <OrgCrudSection 
            kind="roles" 
            title="Roles" 
            description="Configure employee roles and designations." 
          />

          <TabsContent value="attendance" className="mt-0 space-y-6">
            <WorkScheduleSection />
            <HolidaysSection />
            <SpecialDaysSection />
          </TabsContent>

          <TabsContent value="leave" className="mt-0">
            <LeavePolicySection />
          </TabsContent>

          <TabsContent value="security" className="mt-0">
            <SecuritySection />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function LeavePolicySection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sickLeave, setSickLeave] = useState(0);
  const [vacationLeave, setVacationLeave] = useState(0);
  const [personalLeave, setPersonalLeave] = useState(0);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    }
  });

  useEffect(() => {
    if (settings) {
      setSickLeave(settings.defaultSickLeave ?? 10);
      setVacationLeave(settings.defaultVacationLeave ?? 15);
      setPersonalLeave(settings.defaultPersonalLeave ?? 5);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          defaultSickLeave: sickLeave,
          defaultVacationLeave: vacationLeave,
          defaultPersonalLeave: personalLeave
        })
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ title: 'Saved', description: 'Leave policy updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
  });

  const applyToAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/apply-leave-defaults', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to apply defaults');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Applied', description: 'Leave defaults applied to all employees.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to apply defaults', variant: 'destructive' })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave Policy</CardTitle>
        <CardDescription>Configure default leave allocations for new employees.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Sick Leave (Days)</Label>
            <Input 
              type="number" 
              min="0"
              value={sickLeave} 
              onChange={(e) => setSickLeave(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Vacation Leave (Days)</Label>
            <Input 
              type="number" 
              min="0"
              value={vacationLeave} 
              onChange={(e) => setVacationLeave(parseInt(e.target.value) || 0)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Personal Leave (Days)</Label>
            <Input 
              type="number" 
              min="0"
              value={personalLeave} 
              onChange={(e) => setPersonalLeave(parseInt(e.target.value) || 0)} 
            />
          </div>
        </div>

        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            onClick={() => {
              if (confirm('This will update the TOTAL leave allowance for ALL employees for the current year to match these defaults. Used leave will be preserved. Are you sure?')) {
                applyToAllMutation.mutate();
              }
            }}
            disabled={applyToAllMutation.isPending}
          >
            {applyToAllMutation.isPending ? 'Applying...' : 'Apply to All Employees'}
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySection() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await fetch('/api/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      return res.json();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newSettings)
      });
      if (!res.ok) throw new Error('Failed to update settings');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({ title: 'Saved', description: 'System settings updated.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' })
  });

  if (isLoading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Manage system access and security policies.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between space-x-2">
          <div className="space-y-0.5">
            <Label className="text-base">Public Signup</Label>
            <p className="text-sm text-muted-foreground">
              Allow new users to sign up freely. If disabled, only admins can create accounts.
            </p>
          </div>
          <Switch
            checked={settings?.signupEnabled ?? true}
            onCheckedChange={(checked) => updateMutation.mutate({ signupEnabled: checked })}
            disabled={updateMutation.isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsTab({ value, icon: Icon, label }: { value: string, icon: any, label: string }) {
  return (
    <TabsTrigger 
      value={value} 
      className="w-full justify-start px-4 py-2.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50 transition-colors text-muted-foreground font-medium rounded-md"
    >
      <Icon className="w-4 h-4 mr-3" />
      {label}
    </TabsTrigger>
  );
}

function WorkScheduleSection() {
  const { toast } = useToast();
  const [workDays, setWorkDays] = useState<number[]>([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');

  const { data, isLoading } = useQuery({
    queryKey: ['work-schedule'],
    queryFn: async () => {
      const res = await fetch('/api/org/schedule', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load schedule');
      return res.json();
    },
    staleTime: 0, // Always fetch fresh data on mount
    refetchOnMount: true
  });

  useEffect(() => {
    if (data) {
      setWorkDays(data.workDays || []);
      setWorkStartTime(data.workStartTime || '09:00');
      setWorkEndTime(data.workEndTime || '17:00');
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/org/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ workDays, workStartTime, workEndTime })
      });
      if (!res.ok) throw new Error('Failed to update schedule');
      return res.json();
    },
    onSuccess: () => toast({ title: 'Saved', description: 'Work schedule updated & employees notified.' }),
    onError: (e: any) => toast({ title: 'Error', description: e.message, variant: 'destructive' })
  });

  const toggleDay = (day: number) => {
    setWorkDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const days = [
    { id: 1, label: 'M' },
    { id: 2, label: 'T' },
    { id: 3, label: 'W' },
    { id: 4, label: 'T' },
    { id: 5, label: 'F' },
    { id: 6, label: 'S' },
    { id: 0, label: 'S' },
  ];

  if (isLoading) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Schedule</CardTitle>
        <CardDescription>Set your standard working days and hours.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Working Days</Label>
          <div className="flex gap-2">
            {days.map(day => {
              const isSelected = workDays.includes(day.id);
              return (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                    isSelected 
                      ? "bg-primary text-primary-foreground shadow-sm" 
                      : "bg-muted text-muted-foreground hover:bg-muted/80"
                  )}
                >
                  {day.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Work Hours</Label>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="time" 
                value={workStartTime} 
                onChange={(e) => setWorkStartTime(e.target.value)} 
                className="w-36 pl-9"
              />
            </div>
            <span className="text-muted-foreground text-sm">to</span>
            <div className="relative">
              <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                type="time" 
                value={workEndTime} 
                onChange={(e) => setWorkEndTime(e.target.value)} 
                className="w-36 pl-9"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function HolidaysSection() {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['holidays'],
    queryFn: async () => {
      const res = await fetch('/api/org/holidays', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load holidays');
      return res.json();
    }
  });

  const today = startOfDay(new Date());
  const upcomingHolidays = data?.holidays?.filter((h: any) => new Date(h.date) >= today) || [];
  const pastHolidays = data?.holidays?.filter((h: any) => new Date(h.date) < today) || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/org/holidays', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name, date })
      });
      if (!res.ok) throw new Error('Failed to add holiday');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setName('');
      setDate('');
      setIsAdding(false);
      toast({ title: 'Added', description: 'Holiday added & employees notified.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add holiday', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/org/holidays/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => {
      refetch();
      toast({ title: 'Deleted', description: 'Holiday removed' });
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Holidays</CardTitle>
          <CardDescription>Manage public and company holidays.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Holiday'}
        </Button>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="flex gap-3 items-end mb-6 p-4 bg-muted/30 rounded-lg border border-dashed">
            <div className="flex-1 space-y-2">
              <Label>Holiday Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New Year" />
            </div>
            <div className="w-40 space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!name || !date}>Add</Button>
          </div>
        )}

        <div className="space-y-1">
          {upcomingHolidays.length === 0 && !isAdding && (
            <div className="text-sm text-muted-foreground text-center py-4">No upcoming holidays.</div>
          )}
          {upcomingHolidays.map((h: any) => (
            <div key={h.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group">
              <div className="flex items-center gap-4">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{h.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(h.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {pastHolidays.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="h-3 w-3" /> Past Holidays
              </h4>
              <div className="space-y-1 opacity-60">
                {pastHolidays.map((h: any) => (
                  <div key={h.id} className="flex items-center justify-between p-3 rounded-md">
                    <div className="flex items-center gap-4">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">{h.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(h.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    {/* Optional: Allow deleting past holidays too */}
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(h.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function SpecialDaysSection() {
  const { toast } = useToast();
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const { data, refetch } = useQuery({
    queryKey: ['special-days'],
    queryFn: async () => {
      const res = await fetch('/api/org/special-days', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load special days');
      return res.json();
    }
  });

  const today = startOfDay(new Date());
  const upcomingDays = data?.specialDays?.filter((d: any) => new Date(d.date) >= today) || [];
  const pastDays = data?.specialDays?.filter((d: any) => new Date(d.date) < today) || [];

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/org/special-days', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ date, reason })
      });
      if (!res.ok) throw new Error('Failed to add special day');
      return res.json();
    },
    onSuccess: () => {
      refetch();
      setDate('');
      setReason('');
      setIsAdding(false);
      toast({ title: 'Added', description: 'Special day added & employees notified.' });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to add special day', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/org/special-days/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => {
      refetch();
      toast({ title: 'Deleted', description: 'Special day removed' });
    }
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>Special Working Days</CardTitle>
          <CardDescription>Exceptions to the standard schedule.</CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
          {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
          {isAdding ? 'Cancel' : 'Add Day'}
        </Button>
      </CardHeader>
      <CardContent>
        {isAdding && (
          <div className="flex gap-3 items-end mb-6 p-4 bg-muted/30 rounded-lg border border-dashed">
            <div className="w-40 space-y-2">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="flex-1 space-y-2">
              <Label>Reason</Label>
              <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Urgent Project" />
            </div>
            <Button onClick={() => addMutation.mutate()} disabled={!date}>Add</Button>
          </div>
        )}

        <div className="space-y-1">
          {upcomingDays.length === 0 && !isAdding && (
            <div className="text-sm text-muted-foreground text-center py-4">No upcoming special days.</div>
          )}
          {upcomingDays.map((d: any) => (
            <div key={d.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group">
              <div className="flex items-center gap-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">
                    {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                  {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                </div>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                onClick={() => deleteMutation.mutate(d.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {pastDays.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <History className="h-3 w-3" /> Past Special Days
              </h4>
              <div className="space-y-1 opacity-60">
                {pastDays.map((d: any) => (
                  <div key={d.id} className="flex items-center justify-between p-3 rounded-md">
                    <div className="flex items-center gap-4">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">
                          {new Date(d.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {d.reason && <p className="text-xs text-muted-foreground">{d.reason}</p>}
                      </div>
                    </div>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(d.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

type OrgKind = 'organization' | 'zones' | 'roles';

function OrgCrudSection({ kind, title, description }: { kind: OrgKind; title: string; description: string }) {
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const resource = kind === 'organization' ? 'departments' : kind;
  const listKey = ['org', resource];

  const listQuery = useQuery({
    queryKey: listKey,
    queryFn: async () => {
      const res = await fetch(`/api/org/${resource}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to load');
      return res.json();
    }
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/org/${resource}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error('Failed to add');
      return res.json();
    },
    onSuccess: () => {
      listQuery.refetch();
      setName('');
      setIsAdding(false);
      toast({ title: 'Saved', description: `${title} updated` });
    },
    onError: () => toast({ title: 'Error', description: 'Failed to save', variant: 'destructive' })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/org/${resource}/${id}`, { method: 'DELETE', credentials: 'include' });
    },
    onSuccess: () => listQuery.refetch(),
    onError: () => toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' })
  });

  const list: Array<{ id: string; name: string; protected?: boolean; description?: string }> = listQuery.data?.[resource] || [];

  return (
    <TabsContent value={kind} className="mt-0">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => setIsAdding(!isAdding)}>
            {isAdding ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-2" />}
            {isAdding ? 'Cancel' : 'Add New'}
          </Button>
        </CardHeader>
        <CardContent>
          {isAdding && (
            <div className="flex gap-3 items-end mb-6 p-4 bg-muted/30 rounded-lg border border-dashed">
              <div className="flex-1 space-y-2">
                <Label>Name</Label>
                <Input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder={`e.g. ${kind === 'organization' ? 'Engineering' : kind === 'zones' ? 'New York' : 'Manager'}`} 
                />
              </div>
              <Button onClick={() => addMutation.mutate()} disabled={!name}>Save</Button>
            </div>
          )}

          <div className="space-y-1">
            {listQuery.isLoading ? (
              <div className="text-sm text-muted-foreground py-4">Loading...</div>
            ) : list.length === 0 && !isAdding ? (
              <div className="text-sm text-muted-foreground py-4 text-center">No items found.</div>
            ) : (
              list.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-md transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{item.name}</span>
                    {kind === 'roles' && item.protected && (
                      <span className="text-[10px] uppercase tracking-wide bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20 flex items-center gap-1">
                        <Lock className="h-3 w-3" /> default
                      </span>
                    )}
                  </div>
                  {!(kind === 'roles' && item.protected) && (
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={() => deleteMutation.mutate(item.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  );
}