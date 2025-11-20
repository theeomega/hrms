import express, { Response } from 'express';
import User from '../models/UserModel.js';
import Attendance from '../models/AttendanceModel.js';
import Leave from '../models/LeaveModel.js';
import AttendanceCorrection from '../models/AttendanceCorrectionModel.js';
import Notification from '../models/NotificationModel.js';
import { startOfMonth, endOfMonth, startOfDay, endOfDay, startOfWeek, endOfWeek } from 'date-fns';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get dashboard stats for employee
router.get('/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Get attendance stats for current month
    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: monthStart, $lte: monthEnd }
    });

    // Get attendance stats for current week
    const weekAttendanceRecords = await Attendance.find({
      userId,
      date: { $gte: weekStart, $lte: weekEnd }
    });

    // Calculate month stats
    const presentDays = attendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const totalDaysInMonth = attendanceRecords.length;
    const totalHours = attendanceRecords.reduce((sum, r) => sum + r.hours, 0);
    const avgHours = totalDaysInMonth > 0 ? totalHours / totalDaysInMonth : 0;
    
    // Calculate actual working days (exclude weekends and count actual days that have passed)
    const today = new Date();
    const daysInMonth = today.getDate(); // Days passed in current month
    const attendanceRate = totalDaysInMonth > 0 
      ? (presentDays / totalDaysInMonth) * 100 
      : 0;

    // Calculate week stats
    const weekPresentDays = weekAttendanceRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const weekTotalHours = weekAttendanceRecords.reduce((sum, r) => sum + r.hours, 0);
    const weekAvgHours = weekAttendanceRecords.length > 0 ? weekTotalHours / weekAttendanceRecords.length : 0;

    // Get last month's stats for comparison
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    
    const lastMonthRecords = await Attendance.find({
      userId,
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });

    const lastMonthTotalHours = lastMonthRecords.reduce((sum, r) => sum + r.hours, 0);
    const lastMonthAvgHours = lastMonthRecords.length > 0 ? lastMonthTotalHours / lastMonthRecords.length : 0;
    const lastMonthPresentDays = lastMonthRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const lastMonthAttendanceRate = lastMonthRecords.length > 0 
      ? (lastMonthPresentDays / lastMonthRecords.length) * 100 
      : 0;

    // Calculate comparisons
    const avgHoursDiff = avgHours - lastMonthAvgHours;
    const attendanceRateDiff = attendanceRate - lastMonthAttendanceRate;

    // Get pending leave count
    const pendingLeaves = await Leave.countDocuments({
      userId,
      status: 'pending'
    });

    res.json({
      // Month stats
      presentDays,
      totalHours: Math.round(totalHours * 10) / 10,
      avgHours: Math.round(avgHours * 10) / 10,
      attendanceRate: Math.round(attendanceRate),
      pendingLeaves,
      // Week stats
      weekPresentDays,
      weekTotalHours: Math.round(weekTotalHours * 10) / 10,
      weekAvgHours: Math.round(weekAvgHours * 10) / 10,
      // Comparison stats
      avgHoursDiff: Math.round(avgHoursDiff * 10) / 10,
      attendanceRateDiff: Math.round(attendanceRateDiff * 10) / 10
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recent activity
router.get('/activity', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    // Get recent attendance records
    const recentAttendance = await Attendance.find({ userId })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Get recent correction requests
    const recentCorrections = await AttendanceCorrection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const activities: any[] = [];
    
    recentAttendance.forEach(record => {
      // Add check-in activity
      if (record.checkIn) {
        activities.push({
          id: `${record._id.toString()}-checkin`,
          user: 'You',
          action: 'Checked in',
          time: new Date(record.checkIn).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: record.status,
          timestamp: new Date(record.checkIn)
        });
      }
      
      // Add check-out activity
      if (record.checkOut) {
        activities.push({
          id: `${record._id.toString()}-checkout`,
          user: 'You',
          action: 'Checked out',
          time: new Date(record.checkOut).toLocaleString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          status: record.status,
          timestamp: new Date(record.checkOut)
        });
      }
    });

    // Add correction request activities (only the submission, not approval/rejection)
    recentCorrections.forEach(correction => {
      // Only add the initial submission activity, not the admin response
      activities.push({
        id: `${correction._id.toString()}-correction`,
        user: 'You',
        action: 'Requested attendance correction',
        time: new Date(correction.createdAt).toLocaleString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        status: correction.status, // Show current status but action remains "requested"
        timestamp: new Date(correction.createdAt)
      });
    });

    // Sort by timestamp (most recent first) and limit to 8
    const sortedActivities = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 8)
      .map(({ timestamp, ...rest }) => ({
        ...rest,
        timestamp: timestamp.toISOString() // Keep timestamp for debugging/verification
      }));

    res.json({ activities: sortedActivities });
  } catch (error) {
    console.error('Activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR Admin: Get all stats
router.get('/admin/stats', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user || (user.role !== 'hr_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);
    const lastMonthStart = startOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));
    const lastMonthEnd = endOfMonth(new Date(now.getFullYear(), now.getMonth() - 1));

    // Total employees
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    // Employees as of end of last month (joined on or before lastMonthEnd)
    const lastMonthEmployees = await User.countDocuments({ role: 'employee', joinDate: { $lte: lastMonthEnd } });

    // New hires this month (joinDate within current month)
    const newHiresThisMonth = await User.countDocuments({
      role: 'employee',
      joinDate: { $gte: monthStart, $lte: now }
    });

    // Present today
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);
    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lte: todayEnd },
      status: { $in: ['present', 'late'] }
    });

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: 'pending' });

    // Employees currently on approved leave today
    const employeesOnLeaveToday = await Leave.countDocuments({
      status: 'approved',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    // Overall attendance rate for the month
    const allAttendance = await Attendance.find({
      date: { $gte: monthStart, $lte: monthEnd }
    });
    
    const presentCount = allAttendance.filter(r => r.status === 'present').length;
    const attendanceRate = allAttendance.length > 0 
      ? (presentCount / allAttendance.length) * 100 
      : 0;

    // Last month attendance rate (for comparison)
    const lastAttendance = await Attendance.find({
      date: { $gte: lastMonthStart, $lte: lastMonthEnd }
    });
    const lastPresent = lastAttendance.filter(r => r.status === 'present').length;
    const lastMonthAttendanceRate = lastAttendance.length > 0
      ? (lastPresent / lastAttendance.length) * 100
      : 0;

    // Average work hours per day (across all employee attendance records this month)
    const monthAttendance = await Attendance.find({
      date: { $gte: monthStart, $lte: monthEnd }
    }).lean();
    const totalHoursMonth = monthAttendance.reduce((sum, r: any) => sum + (r.hours || 0), 0);
    // Count distinct (userId,date) pairs where user checked in (i.e., record with status present/late/leave)
    const workedRecords = monthAttendance.filter((r: any) => ['present','late','leave'].includes(r.status));
    const workedDayCount = workedRecords.length; // Each record represents a user-day
    const avgHoursPerDay = workedDayCount > 0 ? totalHoursMonth / workedDayCount : 0;

    // Employee growth percent vs last month
    const employeesGrowthPct = lastMonthEmployees > 0
      ? ((totalEmployees - lastMonthEmployees) / lastMonthEmployees) * 100
      : 0;

    res.json({
      totalEmployees,
      presentToday,
      pendingLeaves,
      employeesOnLeaveToday,
      newHiresThisMonth,
      avgHoursPerDay: Number(avgHoursPerDay.toFixed(1)),
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      lastMonthAttendanceRate: Math.round(lastMonthAttendanceRate * 10) / 10,
      attendanceRateDiff: Math.round((attendanceRate - lastMonthAttendanceRate) * 10) / 10,
      lastMonthEmployees,
      employeesGrowthPct: Math.round(employeesGrowthPct * 10) / 10
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR Admin: Today breakdown (present/late/absent/not checked in/on leave)
router.get('/admin/today-breakdown', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user || (user.role !== 'hr_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const employees = await User.find({ role: 'employee' }, '_id').lean();
    const employeeIds = employees.map(e => (e._id as any).toString());

    const todaysAttendance = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd }
    }).lean();

    let present = 0, late = 0, absent = 0, leave = 0;
    const checkedInSet = new Set<string>();
    todaysAttendance.forEach((r: any) => {
      const id = (r.userId as any).toString();
      if (r.checkIn) checkedInSet.add(id);
      if (r.status === 'present') present++;
      else if (r.status === 'late') late++;
      else if (r.status === 'absent') absent++;
      else if (r.status === 'leave') leave++;
    });

    // Approved leaves today (some may have status 'leave' already, ensure counted)
    const approvedLeavesToday = await Leave.find({
      status: 'approved',
      startDate: { $lte: todayStart },
      endDate: { $gte: todayStart }
    }).lean();
    // not checked in excludes those with any attendance checkIn or on leave
    const onLeaveIds = new Set(approvedLeavesToday.map(l => (l.userId as any).toString()));
    const notCheckedIn = employeeIds.filter(id => !checkedInSet.has(id) && !onLeaveIds.has(id)).length;

    res.json({ present, late, absent, leave: leave || onLeaveIds.size, notCheckedIn });
  } catch (error) {
    console.error('Today breakdown error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR Admin: Recent admin activities (approvals/rejections)
router.get('/admin/activity', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user || (user.role !== 'hr_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Approved leaves by this admin
    const approvedLeaves = await Leave.find({ approvedBy: userId })
      .populate('userId', 'fullName username')
      .sort({ approvalDate: -1 })
      .limit(20)
      .lean();

    // Rejected leaves via notifications with actor set to this admin
    const rejectedLeaveNotifs = await Notification.find({
      actor: userId,
      type: 'alert',
      title: 'Leave Request Rejected'
    })
      .populate('userId', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    // Notifications created by admin (actor = admin): includes custom notifications and attendance updates
    const adminCreatedNotifs = await Notification.find({ actor: userId })
      .populate('userId', 'fullName username')
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    // Attendance corrections reviewed by this admin
    const reviewedCorrections = await AttendanceCorrection.find({
      reviewedBy: userId,
      status: { $in: ['approved', 'rejected'] }
    })
      .populate('userId', 'fullName username')
      .sort({ reviewedAt: -1 })
      .limit(20)
      .lean();

    const activities: any[] = [];

    approvedLeaves.forEach(l => {
      activities.push({
        id: `leave-approve-${(l._id as any).toString()}`,
        user: (l.userId as any)?.fullName || (l.userId as any)?.username || 'Employee',
        action: 'Approved leave',
        time: l.approvalDate
          ? new Date(l.approvalDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: l.approvalDate ? new Date(l.approvalDate) : new Date()
      });
    });

    rejectedLeaveNotifs.forEach(n => {
      activities.push({
        id: `leave-reject-${(n._id as any).toString()}`,
        user: (n.userId as any)?.fullName || (n.userId as any)?.username || 'Employee',
        action: 'Rejected leave',
        time: new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(n.createdAt)
      });
    });

    reviewedCorrections.forEach(c => {
      activities.push({
        id: `corr-${(c._id as any).toString()}`,
        user: (c.userId as any)?.fullName || (c.userId as any)?.username || 'Employee',
        action: c.status === 'approved' ? 'Approved attendance correction' : 'Rejected attendance correction',
        time: c.reviewedAt
          ? new Date(c.reviewedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: c.reviewedAt ? new Date(c.reviewedAt) : new Date()
      });
    });

    // Admin created notifications mapped to actions
    adminCreatedNotifs.forEach(n => {
      // Skip if already captured as rejected leave above to avoid duplicates
      if (n.title === 'Leave Request Rejected') return;
      const user = (n.userId as any)?.fullName || (n.userId as any)?.username || 'Employee';
      let action = 'Created notification';
      if (n.title === 'Attendance Updated') action = 'Updated attendance';
      activities.push({
        id: `notif-${(n._id as any).toString()}`,
        user,
        action,
        time: new Date(n.createdAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
        timestamp: new Date(n.createdAt)
      });
    });

    const sorted = activities
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20)
      .map(({ timestamp, ...rest }) => ({ ...rest, timestamp: timestamp.toISOString() }));

    res.json({ activities: sorted });
  } catch (error) {
    console.error('Admin activity error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR Admin: List employees who have not checked in today
router.get('/admin/not-checked-in-today', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user || (user.role !== 'hr_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const todayStart = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    const employees = await User.find({ role: 'employee' }, 'fullName username department position')
      .lean();

    const todays = await Attendance.find({
      date: { $gte: todayStart, $lte: todayEnd },
      checkIn: { $ne: null }
    }, 'userId').lean();

    const checkedInSet = new Set((todays as any[]).map(r => (r.userId as any).toString()))
    const notCheckedIn = employees
      .filter(emp => !checkedInSet.has((emp._id as any).toString()))
      .map(emp => ({
        id: (emp._id as any).toString(),
        name: (emp as any).fullName || (emp as any).username,
        department: (emp as any).department,
        position: (emp as any).position
      }));

    res.json({ employees: notCheckedIn });
  } catch (error) {
    console.error('Not checked in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// HR Admin: Top employees (current month)
router.get('/admin/top-employees', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    if (!user || (user.role !== 'hr_admin' && user.role !== 'admin')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const records = await Attendance.find({
      date: { $gte: monthStart, $lte: monthEnd }
    }).lean();

    interface Acc {
      hours: number;
      present: number;
      late: number;
      absent: number;
    }

    const map = new Map<string, Acc>();
    records.forEach((r: any) => {
      const key = (r.userId as any).toString();
      if (!map.has(key)) map.set(key, { hours: 0, present: 0, late: 0, absent: 0 });
      const acc = map.get(key)!;
      acc.hours += r.hours || 0;
      if (r.status === 'present') acc.present += 1;
      else if (r.status === 'late') acc.late += 1;
      else if (r.status === 'absent') acc.absent += 1;
    });

    const entries = Array.from(map.entries());
    // Compute winners
    const mostWorked = entries.sort((a, b) => b[1].hours - a[1].hours)[0];
    const mostRegular = entries.sort((a, b) => (b[1].present + b[1].late) - (a[1].present + a[1].late))[0];
    const mostPunctual = entries.sort((a, b) => a[1].late - b[1].late)[0];
    const mostAbsent = entries.sort((a, b) => b[1].absent - a[1].absent)[0];

    const winnerIds = [mostWorked, mostRegular, mostPunctual, mostAbsent]
      .filter(Boolean)
      .map(w => w[0]);
    const users = await User.find({ _id: { $in: winnerIds } }, 'fullName username').lean();
    const userMap = new Map(users.map(u => [(u._id as any).toString(), u]));

    const formatWinner = (e?: [string, Acc]) => {
      if (!e) return null;
      const u = userMap.get(e[0]);
      return {
        id: e[0],
        name: (u as any)?.fullName || (u as any)?.username || 'Employee',
        metrics: e[1]
      };
    };

    res.json({
      mostWorked: formatWinner(mostWorked),
      mostRegular: formatWinner(mostRegular),
      mostPunctual: formatWinner(mostPunctual),
      mostAbsent: formatWinner(mostAbsent)
    });
  } catch (error) {
    console.error('Top employees error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
