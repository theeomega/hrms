import express, { Response } from 'express';
import User from '../models/UserModel.js';
import Attendance from '../models/AttendanceModel.js';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all employees (admin only)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const employees = await User.find()
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    const formattedEmployees = employees.map(emp => ({
      id: emp._id.toString(),
      name: emp.fullName,
      username: emp.username,
      email: emp.email,
      role: emp.position || emp.role,
      position: emp.position,
      department: emp.department,
      employeeId: emp.employeeId,
      phone: emp.phone || '',
      location: emp.location || '',
      status: 'active', // You can add a status field to the User model if needed
      joinDate: emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'
    }));

    res.json({ employees: formattedEmployees });
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly attendance summary for all employees (admin only)
// IMPORTANT: Define this BEFORE any dynamic ":id" routes to avoid route shadowing
router.get('/summary', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { startDate, endDate } = req.query as { startDate?: string; endDate?: string };
    const now = new Date();
    const start = startDate ? new Date(startDate) : startOfMonth(now);
    const end = endDate ? new Date(endDate) : endOfMonth(now);

    const employees = await User.find({ role: 'employee' })
      .select('fullName username email department position')
      .lean();
    const empMap = new Map<string, any>();
    employees.forEach(e => {
      empMap.set((e._id as any).toString(), e);
    });

    const records = await Attendance.find({ date: { $gte: start, $lte: end } }).lean();

    const acc = new Map<string, { present: number; late: number; absent: number; leave: number; hours: number }>();
    records.forEach((r: any) => {
      const key = (r.userId as any).toString();
      if (!acc.has(key)) acc.set(key, { present: 0, late: 0, absent: 0, leave: 0, hours: 0 });
      const a = acc.get(key)!;
      if (r.status === 'present') a.present += 1;
      else if (r.status === 'late') a.late += 1;
      else if (r.status === 'absent') a.absent += 1;
      else if (r.status === 'leave') a.leave += 1;
      a.hours += r.hours || 0;
    });

    const summaries = Array.from(empMap.entries()).map(([id, u]) => {
      const s = acc.get(id) || { present: 0, late: 0, absent: 0, leave: 0, hours: 0 };
      return {
        id,
        name: (u as any).fullName || (u as any).username,
        department: (u as any).department || '',
        position: (u as any).position || '',
        present: s.present,
        late: s.late,
        absent: s.absent,
        leave: s.leave,
        hours: Number((s.hours).toFixed(1))
      };
    });

    res.json({ startDate: start.toISOString(), endDate: end.toISOString(), summaries });
  } catch (error) {
    console.error('Employees summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single employee (admin only)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const employee = await User.findById(req.params.id).select('-password').lean();
    
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({
      employee: {
        id: employee._id.toString(),
        name: employee.fullName,
        username: employee.username,
        email: employee.email,
        role: employee.position || employee.role,
        position: employee.position,
        department: employee.department,
        employeeId: employee.employeeId,
        phone: employee.phone || '',
        location: employee.location || '',
        status: 'active',
        joinDate: employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A'
      }
    });
  } catch (error) {
    console.error('Get employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update employee (admin only)
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { fullName, department, position, location, role, phone } = req.body;
    const updateData: any = {};
    if (fullName) updateData.fullName = fullName;
    if (department) updateData.department = department;
    if (position) updateData.position = position;
    if (location) updateData.location = location;
    if (role) updateData.role = role;
    if (phone) updateData.phone = phone;

    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ message: 'Employee updated', employee: updatedEmployee });
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get attendance records for a specific employee (admin only)
router.get('/:id/attendance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { id } = req.params;
    const { startDate, endDate, limit = '50' } = req.query as { startDate?: string; endDate?: string; limit?: string };
    const now = new Date();
    const start = startDate ? new Date(startDate) : startOfMonth(now);
    const end = endDate ? new Date(endDate) : endOfMonth(now);

    const records = await Attendance.find({
      userId: id,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .lean();

    const formatted = records.map((record: any) => ({
      id: (record._id as any).toString(),
      date: new Date(record.date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      checkIn: record.checkIn ? new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      checkOut: record.checkOut ? new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      hours: (record.hours || 0).toFixed(1),
      status: record.status
    }));

    res.json({ records: formatted });
  } catch (error) {
    console.error('Employee attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
