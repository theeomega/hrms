import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Download, ArrowLeft, Pencil, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function EmployeeDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const id = params?.id;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 50;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    department: '',
    position: '',
    location: '',
    role: '',
    phone: ''
  });

  const { data: currentUser } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      return (await res.json()).user;
    }
  });
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'hr_admin';

  const { data: orgData } = useQuery({
    queryKey: ['org-data'],
    queryFn: async () => {
      const [depts, zones, roles] = await Promise.all([
        fetch('/api/org/departments').then(r => r.json()),
        fetch('/api/org/zones').then(r => r.json()),
        fetch('/api/org/roles').then(r => r.json())
      ]);
      return { 
        departments: depts.departments || [], 
        zones: zones.zones || [], 
        roles: roles.roles || [] 
      };
    },
    enabled: isEditing && isAdmin
  });

  const { data: employeeData, isLoading: isEmpLoading } = useQuery({
    queryKey: ['employee-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/employees/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch employee');
      return res.json();
    },
    enabled: !!id,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const employee = employeeData?.employee;

  useEffect(() => {
    if (employee) {
      setEditForm({
        fullName: employee.fullName || employee.name || '',
        department: employee.department || '',
        position: employee.position || '',
        location: employee.location || '',
        role: employee.role === 'admin' || employee.role === 'hr_admin' || employee.role === 'employee' ? employee.role : 'employee',
        phone: employee.phone || ''
      });
    }
  }, [employee]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    onSuccess: () => {
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['employee-detail', id] });
      toast({ title: 'Updated', description: 'Employee details updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateMutation.mutate(editForm);
  };

  const { data: attendanceAllData, isLoading: isAttLoading } = useQuery({
    queryKey: ['employee-attendance-all', id, employee?.joinDate],
    queryFn: async () => {
      const startDate = employee?.joinDate ? new Date(employee.joinDate).toISOString() : new Date(now.getFullYear()-2,0,1).toISOString();
      const endDate = new Date().toISOString();
      const url = `/api/employees/${id}/attendance?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}&limit=10000`;
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch attendance');
      return res.json();
    },
    enabled: !!id && !!employee,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });
  const allRecords = attendanceAllData?.records || [];

  const records = useMemo(() => {
    return allRecords.filter((r: any) => {
      if (!r.date) return false;
      const d = new Date(r.date);
      if (isNaN(d.getTime())) return false;
      const year = String(d.getFullYear());
      const month = String(d.getMonth() + 1).padStart(2,'0');
      if (selectedYear !== 'all' && year !== selectedYear) return false;
      if (selectedMonth !== 'all' && month !== selectedMonth) return false;
      return true;
    });
  }, [allRecords, selectedMonth, selectedYear]);

  const paginatedRecords = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return records.slice(startIdx, startIdx + itemsPerPage);
  }, [records, currentPage, itemsPerPage]);
  const totalPages = useMemo(() => Math.max(1, Math.ceil(records.length / itemsPerPage)), [records.length, itemsPerPage]);
  useMemo(() => { setCurrentPage(1); }, [selectedMonth, selectedYear]);

  const summary = useMemo(() => {
    let present = 0, late = 0, absent = 0, leave = 0, hours = 0;
    records.forEach((r: any) => {
      if (r.status === 'present') present++;
      else if (r.status === 'late') late++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
      hours += parseFloat(r.hours) || 0;
    });
    return { present, late, absent, leave, hours: Number(hours.toFixed(1)) };
  }, [records]);

  const getInitials = (name?: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleExport = () => {
    const header = ['Date','Check In','Check Out','Hours','Status'];
    const rows = records.map((r: any) => [r.date, r.checkIn, r.checkOut, r.hours, r.status]);
    const csv = [header, ...rows]
      .map((r: (string | number)[]) => r.map((v: string | number) => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const baseName = (employee?.fullName || employee?.name || 'employee').replace(/\s+/g,'_');
    const yearSlug = selectedYear === 'all' ? 'all-years' : selectedYear;
    const monthSlug = selectedMonth === 'all' ? 'all-months' : selectedMonth;
    a.href = url;
    a.download = `${baseName}_attendance_${yearSlug}_${monthSlug}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/employees')} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>
      <Card className="p-6">
        {isEmpLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        ) : !employee ? (
          <p className="text-sm text-muted-foreground">Employee not found.</p>
        ) : (
          <div className="flex items-start gap-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary font-medium text-lg">
                {getInitials(employee.fullName || employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-wrap">
                  {isEditing ? (
                    <div className="space-y-1">
                      <Label>Full Name</Label>
                      <Input 
                        value={editForm.fullName} 
                        onChange={(e) => setEditForm({...editForm, fullName: e.target.value})} 
                        className="max-w-sm"
                      />
                    </div>
                  ) : (
                    <>
                      <h1 className="text-2xl font-semibold truncate" title={employee.fullName || employee.name}>{employee.fullName || employee.name}</h1>
                      {employee.employeeId && (
                        <span className="text-xs font-mono bg-muted px-2 py-0.5 rounded border text-muted-foreground">{employee.employeeId}</span>
                      )}
                    </>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex gap-2 shrink-0">
                    {isEditing ? (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                          <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={updateMutation.isPending}>
                          <Save className="w-4 h-4 mr-2" /> Save
                        </Button>
                      </>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                        <Pencil className="w-4 h-4 mr-2" /> Edit Profile
                      </Button>
                    )}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                {/* Position / Role */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Position</p>
                  {isEditing ? (
                    <Select 
                      value={editForm.position} 
                      onValueChange={(v) => setEditForm({...editForm, position: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select position" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgData?.roles?.map((r: any) => (
                          <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                        ))}
                        {!orgData?.roles?.find((r: any) => r.name === editForm.position) && editForm.position && (
                          <SelectItem value={editForm.position}>{editForm.position}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium truncate">{employee.position || employee.role || '—'}</p>
                  )}
                </div>

                {/* Department */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Department</p>
                  {isEditing ? (
                    <Select 
                      value={editForm.department} 
                      onValueChange={(v) => setEditForm({...editForm, department: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select department" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgData?.departments?.map((d: any) => (
                          <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                        ))}
                        {!orgData?.departments?.find((d: any) => d.name === editForm.department) && editForm.department && (
                          <SelectItem value={editForm.department}>{editForm.department}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium truncate">{employee.department || '—'}</p>
                  )}
                </div>

                {/* Location / Zone */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Location</p>
                  {isEditing ? (
                    <Select 
                      value={editForm.location} 
                      onValueChange={(v) => setEditForm({...editForm, location: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        {orgData?.zones?.map((z: any) => (
                          <SelectItem key={z.id} value={z.name}>{z.name}</SelectItem>
                        ))}
                        {!orgData?.zones?.find((z: any) => z.name === editForm.location) && editForm.location && (
                          <SelectItem value={editForm.location}>{editForm.location}</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium truncate">{employee.location || '—'}</p>
                  )}
                </div>

                {/* System Role */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">System Role</p>
                  {isEditing ? (
                    <Select 
                      value={editForm.role} 
                      onValueChange={(v) => setEditForm({...editForm, role: v})}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="hr_admin">HR Admin</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="font-medium truncate capitalize">{employee.role || '—'}</p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <Input 
                      value={editForm.phone} 
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})} 
                      className="h-8"
                    />
                  ) : (
                    <p className="font-medium truncate">{employee.phone || '—'}</p>
                  )}
                </div>

                {/* Read-only fields */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="font-medium truncate">{employee.email || '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Join Date</p>
                  <p className="font-medium truncate">{employee.joinDate ? new Date(employee.joinDate).toISOString().split('T')[0] : '—'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Username</p>
                  <p className="font-medium truncate">{employee.username || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="p-4 md:p-6 flex flex-col justify-between"><p className="text-xs text-muted-foreground mb-1">Present</p><p className="text-3xl font-bold">{summary.present}</p></Card>
        <Card className="p-4 md:p-6 flex flex-col justify-between"><p className="text-xs text-muted-foreground mb-1">Late</p><p className="text-3xl font-bold">{summary.late}</p></Card>
        <Card className="p-4 md:p-6 flex flex-col justify-between"><p className="text-xs text-muted-foreground mb-1">Absent</p><p className="text-3xl font-bold">{summary.absent}</p></Card>
        <Card className="p-4 md:p-6 flex flex-col justify-between"><p className="text-xs text-muted-foreground mb-1">Leave</p><p className="text-3xl font-bold">{summary.leave}</p></Card>
        <Card className="p-4 md:p-6 flex flex-col justify-between"><p className="text-xs text-muted-foreground mb-1">Hours</p><p className="text-3xl font-bold">{summary.hours}</p></Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4 gap-4">
          <h2 className="text-lg font-semibold">Attendance Records ({records.length})</h2>
          <div className="flex items-center gap-2">
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                {Array.from({ length: 12 }).map((_, i) => {
                  const v = String(i+1).padStart(2,'0');
                  const d = new Date(now.getFullYear(), i, 1);
                  return <SelectItem key={v} value={v}>{d.toLocaleDateString('en-US',{ month:'short' })}</SelectItem>;
                })}
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="h-8 w-[110px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {(() => {
                  const years: number[] = [];
                  const startYear = employee?.joinDate ? new Date(employee.joinDate).getFullYear() : now.getFullYear()-2;
                  for (let y = now.getFullYear(); y >= startYear; y--) years.push(y);
                  return years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>);
                })()}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleExport} disabled={isAttLoading || records.length === 0}>
              <Download className="w-4 h-4 mr-2" /> Export CSV
            </Button>
          </div>
        </div>
        {isAttLoading ? (
          <div className="space-y-2">{Array(8).fill(0).map((_, i) => (<Skeleton key={i} className="h-6" />))}</div>
        ) : records.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6">No attendance records for this selection.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRecords.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.date}</TableCell>
                  <TableCell>{r.checkIn}</TableCell>
                  <TableCell>{r.checkOut}</TableCell>
                  <TableCell>{r.hours}</TableCell>
                  <TableCell className="capitalize"><div className="flex items-center gap-2"><span className={`inline-block h-2.5 w-2.5 rounded-full ${r.status === 'present' ? 'bg-emerald-500' : r.status === 'late' ? 'bg-amber-500' : r.status === 'absent' ? 'bg-rose-500' : r.status === 'leave' ? 'bg-indigo-500' : 'bg-muted-foreground'}`}></span>{r.status}</div></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
      {records.length > 0 && totalPages > 1 && (
        <Card className="p-4 flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Showing {(currentPage-1)*itemsPerPage + 1} - {Math.min(currentPage*itemsPerPage, records.length)} of {records.length} records</div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1}>Previous</Button>
            <div className="flex items-center gap-1">
              {currentPage > 2 && (
                <>
                  <Button variant={currentPage === 1 ? 'default':'outline'} size="sm" className="w-9 h-9 p-0" onClick={() => setCurrentPage(1)}>1</Button>
                  {currentPage > 3 && <span className="text-muted-foreground px-1">...</span>}
                </>
              )}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = currentPage === 1 ? i + 1 : currentPage === totalPages ? totalPages - 2 + i : currentPage - 1 + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button key={pageNum} variant={currentPage === pageNum ? 'default':'outline'} size="sm" className="w-9 h-9 p-0" onClick={() => setCurrentPage(pageNum)}>{pageNum}</Button>
                );
              })}
              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && <span className="text-muted-foreground px-1">...</span>}
                  <Button variant={currentPage === totalPages ? 'default':'outline'} size="sm" className="w-9 h-9 p-0" onClick={() => setCurrentPage(totalPages)}>{totalPages}</Button>
                </>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages}>Next</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
