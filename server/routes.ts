import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import session from "express-session";
import { storage } from "./storage";
import { 
  insertEmployeeSchema, 
  insertAttendanceSchema, 
  insertLeaveRequestSchema,
  insertNotificationSchema,
  type User 
} from "@shared/schema";

// Extend Express session type
declare module "express-session" {
  interface SessionData {
    userId: string;
    user: User;
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "hr-management-secret-key-change-in-production",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    })
  );

  // Auth middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  const requireHRAdmin = (req: Request, res: Response, next: Function) => {
    if (!req.session.user || req.session.user.role !== "hr_admin") {
      return res.status(403).json({ message: "Forbidden: HR Admin access required" });
    }
    next();
  };

  // ============ Authentication Routes ============
  
  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.user = user;

      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // Get current user
  app.get("/api/auth/me", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  // ============ Employee Routes ============
  
  // Get all employees (HR Admin only)
  app.get("/api/employees", requireAuth, requireHRAdmin, async (_req: Request, res: Response) => {
    try {
      const employees = await storage.getAllEmployees();
      res.json(employees);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get single employee
  app.get("/api/employees/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const employee = await storage.getEmployee(req.params.id);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch employee" });
    }
  });

  // Create employee (HR Admin only)
  app.post("/api/employees", requireAuth, requireHRAdmin, async (req: Request, res: Response) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      const employee = await storage.createEmployee(validatedData);
      res.status(201).json(employee);
    } catch (error) {
      res.status(400).json({ message: "Invalid employee data" });
    }
  });

  // Update employee (HR Admin only)
  app.patch("/api/employees/:id", requireAuth, requireHRAdmin, async (req: Request, res: Response) => {
    try {
      const employee = await storage.updateEmployee(req.params.id, req.body);
      if (!employee) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      res.status(500).json({ message: "Failed to update employee" });
    }
  });

  // Delete employee (HR Admin only)
  app.delete("/api/employees/:id", requireAuth, requireHRAdmin, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteEmployee(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Employee not found" });
      }
      res.json({ message: "Employee deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete employee" });
    }
  });

  // ============ Attendance Routes ============
  
  // Get attendance records for an employee
  app.get("/api/attendance/employee/:employeeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const records = await storage.getAttendanceByEmployee(req.params.employeeId, limit);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Get today's attendance for an employee
  app.get("/api/attendance/today/:employeeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const record = await storage.getTodayAttendance(req.params.employeeId);
      res.json(record || null);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });

  // Check-in/Check-out
  app.post("/api/attendance/checkin", requireAuth, async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.body;
      const today = new Date().toISOString().split('T')[0];
      
      const existing = await storage.getTodayAttendance(employeeId);
      if (existing) {
        return res.status(400).json({ message: "Already checked in today" });
      }

      const attendance = await storage.createAttendance({
        employeeId,
        date: today,
        checkIn: new Date(),
        checkOut: null,
        hoursWorked: null,
        status: "present",
        notes: null,
      });

      res.status(201).json(attendance);
    } catch (error) {
      res.status(500).json({ message: "Check-in failed" });
    }
  });

  app.post("/api/attendance/checkout", requireAuth, async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.body;
      
      const existing = await storage.getTodayAttendance(employeeId);
      if (!existing) {
        return res.status(400).json({ message: "No check-in found for today" });
      }

      if (existing.checkOut) {
        return res.status(400).json({ message: "Already checked out" });
      }

      const checkOut = new Date();
      const checkIn = new Date(existing.checkIn!);
      const hours = ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)).toFixed(1);

      const updated = await storage.updateAttendance(existing.id, {
        checkOut,
        hoursWorked: hours,
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Check-out failed" });
    }
  });

  // Get attendance by date (HR Admin only)
  app.get("/api/attendance/date/:date", requireAuth, requireHRAdmin, async (req: Request, res: Response) => {
    try {
      const records = await storage.getAttendanceByDate(req.params.date);
      res.json(records);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // ============ Leave Request Routes ============
  
  // Get all leave requests (HR Admin only)
  app.get("/api/leaves", requireAuth, requireHRAdmin, async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getAllLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  // Get pending leave requests (HR Admin only)
  app.get("/api/leaves/pending", requireAuth, requireHRAdmin, async (_req: Request, res: Response) => {
    try {
      const requests = await storage.getPendingLeaveRequests();
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending leave requests" });
    }
  });

  // Get leave requests for an employee
  app.get("/api/leaves/employee/:employeeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const requests = await storage.getLeaveRequestsByEmployee(req.params.employeeId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave requests" });
    }
  });

  // Create leave request
  app.post("/api/leaves", requireAuth, async (req: Request, res: Response) => {
    try {
      const validatedData = insertLeaveRequestSchema.parse(req.body);
      const request = await storage.createLeaveRequest(validatedData);
      
      // Create notification for HR admins
      await storage.createNotification({
        userId: req.session.userId!,
        type: "leave",
        title: "New Leave Request",
        message: `Leave request submitted for ${validatedData.leaveType}`,
        read: false,
        relatedId: request.id,
      });

      res.status(201).json(request);
    } catch (error) {
      res.status(400).json({ message: "Invalid leave request data" });
    }
  });

  // Approve/Reject leave request (HR Admin only)
  app.patch("/api/leaves/:id", requireAuth, requireHRAdmin, async (req: Request, res: Response) => {
    try {
      const { status, reviewNotes } = req.body;
      
      if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const updated = await storage.updateLeaveRequest(req.params.id, {
        status,
        reviewNotes,
        reviewedBy: req.session.userId,
        reviewedAt: new Date(),
      });

      if (!updated) {
        return res.status(404).json({ message: "Leave request not found" });
      }

      // Notify employee
      const employee = await storage.getEmployee(updated.employeeId);
      if (employee) {
        const user = await storage.getUserByEmployeeId(employee.employeeId);
        if (user) {
          await storage.createNotification({
            userId: user.id,
            type: "approval",
            title: `Leave Request ${status}`,
            message: `Your leave request has been ${status}`,
            read: false,
            relatedId: updated.id,
          });
        }
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update leave request" });
    }
  });

  // ============ Notification Routes ============
  
  // Get user notifications
  app.get("/api/notifications", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getNotificationsByUser(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notifications
  app.get("/api/notifications/unread", requireAuth, async (req: Request, res: Response) => {
    try {
      const notifications = await storage.getUnreadNotifications(req.session.userId!);
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unread notifications" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.markNotificationRead(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification marked as read" });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Delete notification
  app.delete("/api/notifications/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const success = await storage.deleteNotification(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Notification not found" });
      }
      res.json({ message: "Notification deleted" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete notification" });
    }
  });

  // ============ Leave Balance Routes ============
  
  // Get leave balances for an employee
  app.get("/api/leave-balances/:employeeId", requireAuth, async (req: Request, res: Response) => {
    try {
      const balances = await storage.getLeaveBalancesByEmployee(req.params.employeeId);
      res.json(balances);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch leave balances" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
