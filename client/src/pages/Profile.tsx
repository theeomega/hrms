import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Edit, Mail, Phone, MapPin, Briefcase, Calendar, User, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    location: "",
    department: "",
    position: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch profile with periodic refresh
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await fetch('/api/profile', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch profile');
      return response.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
    refetchOnWindowFocus: true,
  });

  const profile = profileData?.profile;

  // Update formData when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        department: profile.department || "",
        position: profile.position || "",
      });
    }
  }, [profile]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['auth-me'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Only show skeleton on initial load, not on refetch
  const showLoading = isLoading && !profileData;

  const handleSave = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      fullName: profile.fullName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      location: profile.location || "",
      department: profile.department || "",
      position: profile.position || "",
    });
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (showLoading) {
    return (
      <div className="max-w-[1600px] mx-auto space-y-12">
        <div className="relative">
          <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
          <div className="relative flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                <h1 className="text-5xl font-light tracking-tight">My</h1>
                <span className="text-5xl font-bold">Profile</span>
              </div>
              <p className="text-muted-foreground text-lg ml-1">
                Manage your personal information and settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto space-y-12">
      {/* Unique Minimal Header - Split Design */}
      <div className="relative">
        <div className="absolute top-0 right-0 w-64 h-32 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <div className="relative flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-baseline gap-3">
              <h1 className="text-5xl font-light tracking-tight">My</h1>
              <span className="text-5xl font-bold">Profile</span>
            </div>
            <p className="text-muted-foreground text-lg ml-1">
              Manage your personal information and settings
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left: Profile Card */}
        <Card className="p-6 bg-primary text-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-white/30 shadow-sm">
              <AvatarFallback className="text-2xl bg-transparent text-white">{getInitials(profile.fullName)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 text-white leading-tight" data-testid="text-profile-name">{profile.fullName || "User"}</h2>
              <p className="text-red-100 mb-1 opacity-90">{profile.position || "Employee"}</p>
              <p className="text-sm text-red-100 opacity-90">Employee ID: {profile.employeeId || "N/A"}</p>
            </div>
          </div>

          <div className="my-10" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Email Address</p>
                <p className="font-medium text-sm">{profile.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Phone Number</p>
                <p className="font-medium text-sm">{profile.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Department</p>
                <p className="font-medium text-sm">{profile.department || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Zone</p>
                <p className="font-medium text-sm">{profile.zone?.name || profile.location || "N/A"}</p>
                {profile.zone?.description && (
                  <p className="text-[11px] text-red-100/80 mt-0.5">{profile.zone.description}</p>
                )}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Join Date</p>
                <p className="font-medium text-sm">{profile.joinDate || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Position</p>
                <p className="font-medium text-sm">{profile.position || "N/A"}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Personal Information (editable) */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Personal Information</h3>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-profile">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancel} data-testid="button-cancel-profile">Cancel</Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave}
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input 
                id="full-name" 
                value={formData.fullName} 
                onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                disabled={!isEditing} 
                data-testid="input-full-name" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input id="employee-id" value={profile.employeeId || "N/A"} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input 
                id="profile-email" 
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                disabled={!isEditing} 
                data-testid="input-profile-email" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input 
                id="profile-phone" 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                disabled={!isEditing} 
                data-testid="input-profile-phone" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-location">Zone</Label>
              <Input 
                id="profile-location" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                disabled={!isEditing} 
                data-testid="input-profile-location" 
                placeholder="Enter zone name"
              />
              {profile.zone?.description && (
                <p className="text-xs text-muted-foreground">{profile.zone.description}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role">Position</Label>
              <Input 
                id="profile-role" 
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                disabled={!isEditing} 
                data-testid="input-profile-role" 
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
