import { 
  type User, 
  type InsertUser, 
  type Employee, 
  type InsertEmployee,
  type Attendance,
  type InsertAttendance,
  type LeaveRequest,
  type InsertLeaveRequest,
  type Notification,
  type InsertNotification,
  type LeaveBalance,
  type InsertLeaveBalance
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmployeeId(employeeId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Employee methods
  getEmployee(id: string): Promise<Employee | undefined>;
  getEmployeeByEmail(email: string): Promise<Employee | undefined>;
  getAllEmployees(): Promise<Employee[]>;
  createEmployee(employee: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<boolean>;
  
  // Attendance methods
  getAttendance(id: string): Promise<Attendance | undefined>;
  getAttendanceByEmployee(employeeId: string, limit?: number): Promise<Attendance[]>;
  getAttendanceByDate(date: string): Promise<Attendance[]>;
  getTodayAttendance(employeeId: string): Promise<Attendance | undefined>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;
  updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance | undefined>;
  
  // Leave request methods
  getLeaveRequest(id: string): Promise<LeaveRequest | undefined>;
  getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]>;
  getAllLeaveRequests(): Promise<LeaveRequest[]>;
  getPendingLeaveRequests(): Promise<LeaveRequest[]>;
  createLeaveRequest(request: InsertLeaveRequest): Promise<LeaveRequest>;
  updateLeaveRequest(id: string, request: Partial<LeaveRequest>): Promise<LeaveRequest | undefined>;
  
  // Notification methods
  getNotification(id: string): Promise<Notification | undefined>;
  getNotificationsByUser(userId: string): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationRead(id: string): Promise<boolean>;
  deleteNotification(id: string): Promise<boolean>;
  
  // Leave balance methods
  getLeaveBalance(id: string): Promise<LeaveBalance | undefined>;
  getLeaveBalancesByEmployee(employeeId: string): Promise<LeaveBalance[]>;
  createLeaveBalance(balance: InsertLeaveBalance): Promise<LeaveBalance>;
  updateLeaveBalance(id: string, balance: Partial<LeaveBalance>): Promise<LeaveBalance | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private employees: Map<string, Employee>;
  private attendance: Map<string, Attendance>;
  private leaveRequests: Map<string, LeaveRequest>;
  private notifications: Map<string, Notification>;
  private leaveBalances: Map<string, LeaveBalance>;

  constructor() {
    this.users = new Map();
    this.employees = new Map();
    this.attendance = new Map();
    this.leaveRequests = new Map();
    this.notifications = new Map();
    this.leaveBalances = new Map();
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create sample HR admin user
    const adminUser: User = {
      id: randomUUID(),
      username: "admin@company.com",
      password: "admin123",
      role: "hr_admin",
      employeeId: "EMP-2023-001",
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample employee user
    const empUser: User = {
      id: randomUUID(),
      username: "john@company.com",
      password: "john123",
      role: "employee",
      employeeId: "EMP-2023-002",
      createdAt: new Date(),
    };
    this.users.set(empUser.id, empUser);

    // Create sample employees
    const sampleEmployees: Employee[] = [
      {
        id: randomUUID(),
        name: "John Anderson",
        email: "john@company.com",
        phone: "+1 (555) 123-4567",
        role: "Senior Software Engineer",
        department: "Engineering",
        location: "San Francisco, CA",
        employeeId: "EMP-2023-002",
        status: "active",
        joinDate: "2023-01-15",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Sarah Johnson",
        email: "sarah.j@company.com",
        phone: "+1 (555) 123-4567",
        role: "Senior Software Engineer",
        department: "Engineering",
        location: "San Francisco, CA",
        employeeId: "EMP-2023-003",
        status: "active",
        joinDate: "2023-02-10",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: randomUUID(),
        name: "Michael Chen",
        email: "michael.c@company.com",
        phone: "+1 (555) 234-5678",
        role: "Product Manager",
        department: "Product",
        location: "New York, NY",
        employeeId: "EMP-2023-004",
        status: "active",
        joinDate: "2023-03-01",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    sampleEmployees.forEach(emp => this.employees.set(emp.id, emp));
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByEmployeeId(employeeId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.employeeId === employeeId,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      role: insertUser.role || "employee",
      employeeId: null,
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Employee methods
  async getEmployee(id: string): Promise<Employee | undefined> {
    return this.employees.get(id);
  }

  async getEmployeeByEmail(email: string): Promise<Employee | undefined> {
    return Array.from(this.employees.values()).find(
      (emp) => emp.email === email,
    );
  }

  async getAllEmployees(): Promise<Employee[]> {
    return Array.from(this.employees.values());
  }

  async createEmployee(insertEmployee: InsertEmployee): Promise<Employee> {
    const id = randomUUID();
    const employee: Employee = {
      ...insertEmployee,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.employees.set(id, employee);
    return employee;
  }

  async updateEmployee(id: string, update: Partial<Employee>): Promise<Employee | undefined> {
    const employee = this.employees.get(id);
    if (!employee) return undefined;
    
    const updated = { ...employee, ...update, updatedAt: new Date() };
    this.employees.set(id, updated);
    return updated;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    return this.employees.delete(id);
  }

  // Attendance methods
  async getAttendance(id: string): Promise<Attendance | undefined> {
    return this.attendance.get(id);
  }

  async getAttendanceByEmployee(employeeId: string, limit: number = 10): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter(att => att.employeeId === employeeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
  }

  async getAttendanceByDate(date: string): Promise<Attendance[]> {
    return Array.from(this.attendance.values())
      .filter(att => att.date === date);
  }

  async getTodayAttendance(employeeId: string): Promise<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return Array.from(this.attendance.values()).find(
      att => att.employeeId === employeeId && att.date === today
    );
  }

  async createAttendance(insertAttendance: InsertAttendance): Promise<Attendance> {
    const id = randomUUID();
    const attendance: Attendance = {
      ...insertAttendance,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.attendance.set(id, attendance);
    return attendance;
  }

  async updateAttendance(id: string, update: Partial<Attendance>): Promise<Attendance | undefined> {
    const attendance = this.attendance.get(id);
    if (!attendance) return undefined;
    
    const updated = { ...attendance, ...update, updatedAt: new Date() };
    this.attendance.set(id, updated);
    return updated;
  }

  // Leave request methods
  async getLeaveRequest(id: string): Promise<LeaveRequest | undefined> {
    return this.leaveRequests.get(id);
  }

  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(req => req.employeeId === employeeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getAllLeaveRequests(): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPendingLeaveRequests(): Promise<LeaveRequest[]> {
    return Array.from(this.leaveRequests.values())
      .filter(req => req.status === "pending")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createLeaveRequest(insertRequest: InsertLeaveRequest): Promise<LeaveRequest> {
    const id = randomUUID();
    const request: LeaveRequest = {
      ...insertRequest,
      id,
      status: "pending",
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaveRequests.set(id, request);
    return request;
  }

  async updateLeaveRequest(id: string, update: Partial<LeaveRequest>): Promise<LeaveRequest | undefined> {
    const request = this.leaveRequests.get(id);
    if (!request) return undefined;
    
    const updated = { ...request, ...update, updatedAt: new Date() };
    this.leaveRequests.set(id, updated);
    return updated;
  }

  // Notification methods
  async getNotification(id: string): Promise<Notification | undefined> {
    return this.notifications.get(id);
  }

  async getNotificationsByUser(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    return Array.from(this.notifications.values())
      .filter(notif => notif.userId === userId && !notif.read)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createNotification(insertNotif: InsertNotification): Promise<Notification> {
    const id = randomUUID();
    const notification: Notification = {
      ...insertNotif,
      id,
      createdAt: new Date(),
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationRead(id: string): Promise<boolean> {
    const notification = this.notifications.get(id);
    if (!notification) return false;
    
    this.notifications.set(id, { ...notification, read: true });
    return true;
  }

  async deleteNotification(id: string): Promise<boolean> {
    return this.notifications.delete(id);
  }

  // Leave balance methods
  async getLeaveBalance(id: string): Promise<LeaveBalance | undefined> {
    return this.leaveBalances.get(id);
  }

  async getLeaveBalancesByEmployee(employeeId: string): Promise<LeaveBalance[]> {
    return Array.from(this.leaveBalances.values())
      .filter(balance => balance.employeeId === employeeId);
  }

  async createLeaveBalance(insertBalance: InsertLeaveBalance): Promise<LeaveBalance> {
    const id = randomUUID();
    const balance: LeaveBalance = {
      ...insertBalance,
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.leaveBalances.set(id, balance);
    return balance;
  }

  async updateLeaveBalance(id: string, update: Partial<LeaveBalance>): Promise<LeaveBalance | undefined> {
    const balance = this.leaveBalances.get(id);
    if (!balance) return undefined;
    
    const updated = { ...balance, ...update, updatedAt: new Date() };
    this.leaveBalances.set(id, updated);
    return updated;
  }
}

export const storage = new MemStorage();
