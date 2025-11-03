import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, MapPin, Briefcase } from "lucide-react";

interface EmployeeProfile {
  name: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  location: string;
  status: "active" | "on-leave" | "inactive";
}

interface EmployeeProfileCardProps {
  employee: EmployeeProfile;
}

export default function EmployeeProfileCard({ employee }: EmployeeProfileCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "on-leave":
        return "secondary";
      case "inactive":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16">
          <AvatarFallback className="text-lg">{getInitials(employee.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <div>
              <h3 className="font-semibold text-lg" data-testid="text-employee-name">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.role}</p>
            </div>
            <Badge variant={getStatusVariant(employee.status)} className="capitalize" data-testid="badge-employee-status">
              {employee.status.replace("-", " ")}
            </Badge>
          </div>
          
          <div className="space-y-2 mt-4">
            <div className="flex items-center gap-2 text-sm">
              <Briefcase className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{employee.department}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{employee.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{employee.phone}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">{employee.location}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
