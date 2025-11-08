# Developer Quick Reference

## 🚀 Getting Started

```bash
npm install    # Install dependencies
npm run dev    # Start dev server (localhost:5000)
```

**Login Credentials:**
- Admin: `admin@company.com` / `admin123`
- Employee: `john@company.com` / `john123`

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `shared/schema.ts` | Database schema, types, validation |
| `server/routes.ts` | API endpoints |
| `server/storage.ts` | Data access layer |
| `client/src/App.tsx` | Root component, routing, auth |
| `client/src/lib/api.ts` | API client functions |
| `client/src/pages/*` | Page components |
| `client/src/components/*` | Reusable components |

---

## 🔑 Authentication

**Check if user is logged in:**
```typescript
// In App.tsx - auto checks on mount
useEffect(() => {
  authAPI.getMe()
    .then(({ user }) => setUser(user))
    .catch(() => setUser(null));
}, []);
```

**Login:**
```typescript
const { user } = await authAPI.login(email, password);
```

**Logout:**
```typescript
await authAPI.logout();
```

**Protect routes:**
```typescript
// In server/routes.ts
app.get("/api/endpoint", requireAuth, async (req, res) => {
  // req.session.userId available
});

// HR Admin only
app.get("/api/admin", requireAuth, requireHRAdmin, async (req, res) => {
  // req.session.user.role === "hr_admin"
});
```

---

## 🗄️ Database Operations

**Get all employees:**
```typescript
const employees = await storage.getAllEmployees();
```

**Create employee:**
```typescript
const employee = await storage.createEmployee({
  name: "Jane Doe",
  email: "jane@company.com",
  department: "Engineering",
  // ...
});
```

**Check-in:**
```typescript
const attendance = await storage.createAttendance({
  employeeId: "uuid",
  date: "2025-11-03",
  checkIn: new Date(),
  status: "present",
});
```

**Create leave request:**
```typescript
const request = await storage.createLeaveRequest({
  employeeId: "uuid",
  leaveType: "Sick Leave",
  startDate: "2025-11-05",
  endDate: "2025-11-07",
  days: 3,
  reason: "Medical appointment",
});
```

---

## 🎨 UI Components

**Import shadcn/ui components:**
```typescript
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
```

**Use custom components:**
```typescript
import StatCard from "@/components/StatCard";
import AttendanceTable from "@/components/AttendanceTable";

<StatCard 
  title="Total Employees" 
  value={248} 
  icon={Users} 
  trend="+12%" 
  trendUp={true} 
/>

<AttendanceTable records={attendanceRecords} />
```

**Toast notifications:**
```typescript
import { useToast } from "@/hooks/use-toast";

const { toast } = useToast();

toast({
  title: "Success",
  description: "Employee created successfully",
});

// Error toast
toast({
  title: "Error",
  description: "Failed to create employee",
  variant: "destructive",
});
```

---

## 🔄 API Calls

**From frontend:**
```typescript
import { employeeAPI, attendanceAPI, leaveAPI } from "@/lib/api";

// Get employees
const employees = await employeeAPI.getAll();

// Check in
const attendance = await attendanceAPI.checkIn(employeeId);

// Create leave request
const request = await leaveAPI.create({
  employeeId,
  leaveType: "Vacation",
  startDate: "2025-12-20",
  endDate: "2025-12-25",
  days: 5,
  reason: "Holiday",
});
```

**React Query (optional):**
```typescript
import { useQuery, useMutation } from "@tanstack/react-query";

const { data: employees } = useQuery({
  queryKey: ["employees"],
  queryFn: employeeAPI.getAll,
});

const createMutation = useMutation({
  mutationFn: employeeAPI.create,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries(["employees"]);
  },
});
```

---

## 🎯 Common Tasks

### Add a New API Endpoint

1. **Add route in `server/routes.ts`:**
```typescript
app.get("/api/departments", requireAuth, async (req, res) => {
  const departments = await storage.getAllDepartments();
  res.json(departments);
});
```

2. **Add to API client `client/src/lib/api.ts`:**
```typescript
export const departmentAPI = {
  getAll: async () => {
    const response = await fetch(`${API_BASE}/departments`, {
      credentials: "include",
    });
    return response.json();
  },
};
```

3. **Use in component:**
```typescript
const departments = await departmentAPI.getAll();
```

### Add a New Page

1. **Create page `client/src/pages/NewPage.tsx`:**
```typescript
export default function NewPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">New Page</h1>
      {/* Content */}
    </div>
  );
}
```

2. **Add route in `App.tsx`:**
```typescript
import NewPage from "@/pages/NewPage";

<Route path="/new-page" component={NewPage} />
```

3. **Add to sidebar `client/src/components/AppSidebar.tsx`:**
```typescript
{
  title: "New Page",
  url: "/new-page",
  icon: IconName,
}
```

### Add a Database Table

1. **Define in `shared/schema.ts`:**
```typescript
export const departments = pgTable("departments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Department = typeof departments.$inferSelect;
```

2. **Add to storage interface:**
```typescript
// server/storage.ts
getAllDepartments(): Promise<Department[]>;
```

3. **Implement in storage class:**
```typescript
private departments: Map<string, Department>;

async getAllDepartments(): Promise<Department[]> {
  return Array.from(this.departments.values());
}
```

---

## 🐛 Debugging

**Check API calls:**
```typescript
// In browser console
console.log("API Response:", await fetch("/api/employees", {
  credentials: "include"
}).then(r => r.json()));
```

**Check session:**
```typescript
// In browser console  
await fetch("/api/auth/me", { credentials: "include" })
  .then(r => r.json());
```

**Server logs:**
- API calls logged with timing in console
- Check terminal for server output

---

## 📦 Build & Deploy

```bash
npm run build   # Build for production
npm start       # Run production server
```

**Environment variables:**
```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=your-secret-key
```

---

## 🎨 Styling Quick Reference

**Colors:**
- `bg-primary` - Blue
- `bg-secondary` - Gray
- `bg-destructive` - Red
- `text-muted-foreground` - Light text

**Spacing:**
- `p-4` - Padding 1rem
- `gap-6` - Gap 1.5rem
- `mb-8` - Margin bottom 2rem

**Layout:**
- `flex items-center justify-between`
- `grid grid-cols-3 gap-4`
- `space-y-6` - Vertical spacing

**Responsive:**
- `md:grid-cols-2` - 2 columns on medium+
- `lg:grid-cols-3` - 3 columns on large+

---

## 🔍 TypeScript Tips

**Get type from schema:**
```typescript
import type { Employee, InsertEmployee } from "@shared/schema";
```

**Type API response:**
```typescript
const employees: Employee[] = await employeeAPI.getAll();
```

**Type component props:**
```typescript
interface DashboardProps {
  isHRAdmin: boolean;
}

export default function Dashboard({ isHRAdmin }: DashboardProps) {
  // ...
}
```

---

## 📊 Sample Data

**Users:**
- `admin@company.com` (HR Admin)
- `john@company.com` (Employee)

**Employees:**
- John Anderson (Engineering)
- Sarah Johnson (Engineering)
- Michael Chen (Product)

---

## ⚡ Performance Tips

1. Use React Query for caching
2. Lazy load components
3. Memoize expensive computations
4. Optimize images
5. Enable compression in production

---

## 🔒 Security Checklist

- ✅ Session-based auth
- ✅ HTTP-only cookies
- ✅ Role-based access control
- ✅ Input validation (Zod)
- ✅ XSS protection
- ⚠️ Add CSRF tokens (production)
- ⚠️ Use HTTPS (production)
- ⚠️ Hash passwords (production)

---

## 📚 Resources

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)
- [Express Docs](https://expressjs.com)
- [Drizzle ORM Docs](https://orm.drizzle.team)

---

**Happy Coding! 🎉**
