import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";
import { useLocation } from "wouter";

export default function Employees() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();

  // Fetch all employees (directory only)
  const { data: employeesData, isLoading } = useQuery({
    queryKey: ['employees-directory'],
    queryFn: async () => {
      const res = await fetch('/api/employees', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch employees');
      return res.json();
    },
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const employees = employeesData?.employees || [];

  // Only show skeleton on initial load (not on refetch)
  const showLoading = isLoading && !employeesData;

  const filteredDirectory = employees.filter((emp: any) => 
    emp.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  // Initial loading handled via skeletons below

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Employees</h1>
          <p className="text-muted-foreground">All team members</p>
        </div>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            data-testid="input-search-employees"
          />
        </div>
      </Card>

      {showLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDirectory.map((employee: any) => (
            <Card key={employee.id} className="p-5 hover:bg-muted/60 transition-colors cursor-pointer" onClick={() => navigate(`/employees/${employee.id}`)}>
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10"><AvatarFallback>{getInitials(employee.name)}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold truncate" title={employee.name}>{employee.name}</h3>
                    {employee.employeeId && (
                      <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border text-muted-foreground">{employee.employeeId}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{employee.position || employee.role || '—'}</p>
                  <p className="text-xs text-muted-foreground truncate">{employee.department || '—'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Detailed view handled by /employees/:id route */}
    </div>
  );
}
