import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Edit, Mail, Phone, MapPin, Briefcase, Calendar, User, Building } from "lucide-react";
import { useState } from "react";

const mockProfile = {
  name: "John Anderson",
  role: "Senior Software Engineer",
  department: "Engineering",
  email: "john.anderson@company.com",
  phone: "+1 (555) 123-4567",
  location: "San Francisco, CA",
  joinDate: "Jan 15, 2023",
  employeeId: "EMP-2023-001",
};

export default function Profile() {
  const [isEditing, setIsEditing] = useState(false);

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
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
        {/* Left: John Anderson (professional red theme) */}
        <Card className="p-6 bg-primary text-white rounded-2xl shadow-lg border border-primary/20 overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="h-24 w-24 ring-4 ring-white/30 shadow-sm">
              <AvatarFallback className="text-2xl bg-transparent text-white">{getInitials(mockProfile.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1 text-white leading-tight" data-testid="text-profile-name">{mockProfile.name}</h2>
              <p className="text-red-100 mb-1 opacity-90">{mockProfile.role}</p>
              <p className="text-sm text-red-100 opacity-90">Employee ID: {mockProfile.employeeId}</p>
            </div>
          </div>

          <Separator className="my-6 border-white/20" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Email Address</p>
                <p className="font-medium text-sm">{mockProfile.email}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Phone Number</p>
                <p className="font-medium text-sm">{mockProfile.phone}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Department</p>
                <p className="font-medium text-sm">{mockProfile.department}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Location</p>
                <p className="font-medium text-sm">{mockProfile.location}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Join Date</p>
                <p className="font-medium text-sm">{mockProfile.joinDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Briefcase className="w-5 h-5 text-white" />
              <div>
                <p className="text-xs text-red-100 mb-1 opacity-90">Position</p>
                <p className="font-medium text-sm">{mockProfile.role}</p>
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
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} data-testid="button-cancel-profile">Cancel</Button>
                  <Button size="sm" data-testid="button-save-profile">Save Changes</Button>
                </>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" defaultValue={mockProfile.name} disabled={!isEditing} data-testid="input-full-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="employee-id">Employee ID</Label>
              <Input id="employee-id" defaultValue={mockProfile.employeeId} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email</Label>
              <Input id="profile-email" type="email" defaultValue={mockProfile.email} disabled={!isEditing} data-testid="input-profile-email" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" defaultValue={mockProfile.phone} disabled={!isEditing} data-testid="input-profile-phone" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-location">Location</Label>
              <Input id="profile-location" defaultValue={mockProfile.location} disabled={!isEditing} data-testid="input-profile-location" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-role">Role</Label>
              <Input id="profile-role" defaultValue={mockProfile.role} disabled={!isEditing} data-testid="input-profile-role" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
