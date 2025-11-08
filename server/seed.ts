import { db } from "./db";
import { eq } from "drizzle-orm";
import { 
  users, 
  employees, 
  attendance, 
  leaveRequests, 
  notifications, 
  leaveBalances 
} from "@shared/schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Create employees first
    const emp1Id = crypto.randomUUID();
    const emp2Id = crypto.randomUUID();
    const emp3Id = crypto.randomUUID();

    await db.insert(employees).values([
      {
        id: emp1Id,
        name: "John Doe",
        email: "john@company.com",
        phone: "+1234567890",
        role: "Senior Developer",
        department: "Engineering",
        location: "New York",
        employeeId: "EMP001",
        status: "active",
        joinDate: "2023-01-15",
      },
      {
        id: emp2Id,
        name: "Jane Smith",
        email: "jane@company.com",
        phone: "+1234567891",
        role: "Marketing Manager",
        department: "Marketing",
        location: "Los Angeles",
        employeeId: "EMP002",
        status: "active",
        joinDate: "2023-03-01",
      },
      {
        id: emp3Id,
        name: "Admin User",
        email: "admin@company.com",
        phone: "+1234567892",
        role: "HR Manager",
        department: "Human Resources",
        location: "New York",
        employeeId: "EMP003",
        status: "active",
        joinDate: "2022-01-01",
      },
    ]);

    console.log("✅ Employees created");

    // Create users (admin and employee) - passwords are stored in plaintext for simplicity
    await db.insert(users).values([
      {
        id: crypto.randomUUID(),
        username: "admin@company.com",
        password: "admin123",
        role: "hr_admin",
        employeeId: emp3Id,
      },
      {
        id: crypto.randomUUID(),
        username: "john@company.com",
        password: "john123",
        role: "employee",
        employeeId: emp1Id,
      },
    ]);

    console.log("✅ Users created");
    console.log("   📧 admin@company.com / admin123");
    console.log("   📧 john@company.com / john123");

    // Create some sample attendance records
    const today = new Date();
    const dates = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    const attendanceRecords = dates.map((dateStr, i) => {
      const checkIn = new Date(dateStr + "T09:00:00");
      checkIn.setMinutes(i * 2);
      const checkOut = new Date(dateStr + "T18:00:00");
      checkOut.setMinutes(i * 2);
      
      return {
        id: crypto.randomUUID(),
        employeeId: emp1Id,
        date: dateStr,
        checkIn: checkIn,
        checkOut: checkOut,
        status: i % 5 === 0 ? "late" : "present",
        hoursWorked: "9h",
      };
    });

    await db.insert(attendance).values(attendanceRecords);
    console.log("✅ Attendance records created");

    // Create leave balances
    await db.insert(leaveBalances).values([
      {
        id: crypto.randomUUID(),
        employeeId: emp1Id,
        leaveType: "Annual Leave",
        total: 20,
        used: 5,
        remaining: 15,
        year: new Date().getFullYear(),
      },
      {
        id: crypto.randomUUID(),
        employeeId: emp1Id,
        leaveType: "Sick Leave",
        total: 10,
        used: 2,
        remaining: 8,
        year: new Date().getFullYear(),
      },
      {
        id: crypto.randomUUID(),
        employeeId: emp1Id,
        leaveType: "Casual Leave",
        total: 7,
        used: 1,
        remaining: 6,
        year: new Date().getFullYear(),
      },
      {
        id: crypto.randomUUID(),
        employeeId: emp2Id,
        leaveType: "Annual Leave",
        total: 20,
        used: 3,
        remaining: 17,
        year: new Date().getFullYear(),
      },
    ]);

    console.log("✅ Leave balances created");

    // Create some sample leave requests
    await db.insert(leaveRequests).values([
      {
        id: crypto.randomUUID(),
        employeeId: emp1Id,
        leaveType: "Annual Leave",
        startDate: "2024-02-01",
        endDate: "2024-02-03",
        days: 3,
        reason: "Family vacation",
        status: "approved",
      },
      {
        id: crypto.randomUUID(),
        employeeId: emp2Id,
        leaveType: "Sick Leave",
        startDate: "2024-01-15",
        endDate: "2024-01-16",
        days: 2,
        reason: "Medical appointment",
        status: "pending",
      },
    ]);

    console.log("✅ Leave requests created");

    // Create sample notifications
    const user1Result = await db.select().from(users).where(eq(users.employeeId, emp1Id)).limit(1);
    if (user1Result.length > 0) {
      await db.insert(notifications).values([
        {
          id: crypto.randomUUID(),
          userId: user1Result[0].id,
          title: "Leave Approved",
          message: "Your annual leave request has been approved",
          type: "leave",
          read: false,
        },
        {
          id: crypto.randomUUID(),
          userId: user1Result[0].id,
          title: "Welcome to HRMasterMind",
          message: "Your account has been successfully created",
          type: "system",
          read: false,
        },
      ]);
      console.log("✅ Notifications created");
    }

    console.log("🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✨ Seeding finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
