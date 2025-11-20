import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

export default function Settings() {
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
            Manage your account preferences.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="account" className="flex flex-col md:flex-row gap-8">
        <aside className="md:w-64 flex-shrink-0">
          <TabsList className="flex flex-col h-auto w-full bg-transparent p-0 gap-1">
            <TabsTrigger 
              value="account" 
              className="w-full justify-start px-4 py-2.5 h-auto data-[state=active]:bg-primary/10 data-[state=active]:text-primary hover:bg-muted/50 transition-colors text-muted-foreground font-medium rounded-md"
            >
              <Lock className="w-4 h-4 mr-3" />
              Account
            </TabsTrigger>
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
        </div>
      </Tabs>
    </div>
  );
}
