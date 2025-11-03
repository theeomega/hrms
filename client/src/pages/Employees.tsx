import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Filter } from "lucide-react";
import EmployeeProfileCard from "@/components/EmployeeProfileCard";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const mockEmployees = [
  { id: "1", name: "Sarah Johnson", role: "Senior Software Engineer", department: "Engineering", email: "sarah.j@company.com", phone: "+1 (555) 123-4567", location: "San Francisco, CA", status: "active" as const },
  { id: "2", name: "Michael Chen", role: "Product Manager", department: "Product", email: "michael.c@company.com", phone: "+1 (555) 234-5678", location: "New York, NY", status: "active" as const },
  { id: "3", name: "Emily Davis", role: "UX Designer", department: "Design", email: "emily.d@company.com", phone: "+1 (555) 345-6789", location: "Austin, TX", status: "on-leave" as const },
  { id: "4", name: "James Wilson", role: "DevOps Engineer", department: "Engineering", email: "james.w@company.com", phone: "+1 (555) 456-7890", location: "Seattle, WA", status: "active" as const },
  { id: "5", name: "Lisa Anderson", role: "Marketing Manager", department: "Marketing", email: "lisa.a@company.com", phone: "+1 (555) 567-8901", location: "Boston, MA", status: "active" as const },
  { id: "6", name: "David Kim", role: "Data Analyst", department: "Analytics", email: "david.k@company.com", phone: "+1 (555) 678-9012", location: "Chicago, IL", status: "active" as const },
];

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<typeof mockEmployees[0] | null>(null);

  const filteredEmployees = mockEmployees.filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default";
      case "on-leave": return "secondary";
      case "inactive": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">Manage your team members</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-add-employee">
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
              <DialogDescription>Enter employee information</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="emp-name">Full Name</Label>
                <Input id="emp-name" placeholder="John Doe" data-testid="input-emp-name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-email">Email</Label>
                <Input id="emp-email" type="email" placeholder="john@company.com" data-testid="input-emp-email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-role">Role</Label>
                <Input id="emp-role" placeholder="Software Engineer" data-testid="input-emp-role" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emp-dept">Department</Label>
                <Select>
                  <SelectTrigger id="emp-dept" data-testid="select-emp-dept">
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="engineering">Engineering</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" data-testid="button-cancel-add">Cancel</Button>
              <Button data-testid="button-save-employee">Add Employee</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-employees"
            />
          </div>
          <Button variant="outline" data-testid="button-filter">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="p-6 hover-elevate cursor-pointer" onClick={() => setSelectedEmployee(employee)}>
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12">
                <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold truncate" data-testid={`text-emp-name-${employee.id}`}>{employee.name}</h3>
                  <Badge variant={getStatusVariant(employee.status)} className="capitalize shrink-0">
                    {employee.status.replace("-", " ")}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{employee.role}</p>
                <p className="text-sm text-muted-foreground truncate">{employee.department}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {selectedEmployee && (
        <Dialog open={!!selectedEmployee} onOpenChange={() => setSelectedEmployee(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Employee Details</DialogTitle>
            </DialogHeader>
            <EmployeeProfileCard employee={selectedEmployee} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
