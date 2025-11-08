import type { 
  User, 
  Employee, 
  Attendance, 
  LeaveRequest, 
  Notification 
} from "@shared/schema";

const API_BASE = "/api";

// Auth API
export const authAPI = {
  login: async (username: string, password: string): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Login failed");
    return response.json();
  },

  logout: async (): Promise<void> => {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Logout failed");
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await fetch(`${API_BASE}/auth/me`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to get user");
    return response.json();
  },
};

// Employee API
export const employeeAPI = {
  getAll: async (): Promise<Employee[]> => {
    const response = await fetch(`${API_BASE}/employees`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch employees");
    return response.json();
  },

  getById: async (id: string): Promise<Employee> => {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch employee");
    return response.json();
  },

  create: async (employee: Partial<Employee>): Promise<Employee> => {
    const response = await fetch(`${API_BASE}/employees`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(employee),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to create employee");
    return response.json();
  },

  update: async (id: string, data: Partial<Employee>): Promise<Employee> => {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to update employee");
    return response.json();
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/employees/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete employee");
  },
};

// Attendance API
export const attendanceAPI = {
  getByEmployee: async (employeeId: string, limit?: number): Promise<Attendance[]> => {
    const url = limit 
      ? `${API_BASE}/attendance/employee/${employeeId}?limit=${limit}`
      : `${API_BASE}/attendance/employee/${employeeId}`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) throw new Error("Failed to fetch attendance");
    return response.json();
  },

  getToday: async (employeeId: string): Promise<Attendance | null> => {
    const response = await fetch(`${API_BASE}/attendance/today/${employeeId}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch today's attendance");
    return response.json();
  },

  checkIn: async (employeeId: string): Promise<Attendance> => {
    const response = await fetch(`${API_BASE}/attendance/checkin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Check-in failed");
    }
    return response.json();
  },

  checkOut: async (employeeId: string): Promise<Attendance> => {
    const response = await fetch(`${API_BASE}/attendance/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId }),
      credentials: "include",
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Check-out failed");
    }
    return response.json();
  },

  getByDate: async (date: string): Promise<Attendance[]> => {
    const response = await fetch(`${API_BASE}/attendance/date/${date}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch attendance");
    return response.json();
  },
};

// Leave Request API
export const leaveAPI = {
  getAll: async (): Promise<LeaveRequest[]> => {
    const response = await fetch(`${API_BASE}/leaves`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch leave requests");
    return response.json();
  },

  getPending: async (): Promise<LeaveRequest[]> => {
    const response = await fetch(`${API_BASE}/leaves/pending`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch pending leave requests");
    return response.json();
  },

  getByEmployee: async (employeeId: string): Promise<LeaveRequest[]> => {
    const response = await fetch(`${API_BASE}/leaves/employee/${employeeId}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch leave requests");
    return response.json();
  },

  create: async (request: Partial<LeaveRequest>): Promise<LeaveRequest> => {
    const response = await fetch(`${API_BASE}/leaves`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to create leave request");
    return response.json();
  },

  update: async (id: string, status: string, reviewNotes?: string): Promise<LeaveRequest> => {
    const response = await fetch(`${API_BASE}/leaves/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, reviewNotes }),
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to update leave request");
    return response.json();
  },
};

// Notification API
export const notificationAPI = {
  getAll: async (): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE}/notifications`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch notifications");
    return response.json();
  },

  getUnread: async (): Promise<Notification[]> => {
    const response = await fetch(`${API_BASE}/notifications/unread`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to fetch unread notifications");
    return response.json();
  },

  markRead: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to mark notification as read");
  },

  delete: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/notifications/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!response.ok) throw new Error("Failed to delete notification");
  },
};
