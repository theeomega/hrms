import express from 'express';
import User from '../models/UserModel.js';
import Attendance from '../models/AttendanceModel.js';
import WorkSchedule from '../models/WorkScheduleModel.js';
import Holiday from '../models/HolidayModel.js';
import SpecialWorkingDay from '../models/SpecialWorkingDayModel.js';
import Leave from '../models/LeaveModel.js';
import { startOfDay, endOfDay } from 'date-fns';

const router = express.Router();

// This endpoint is designed to be called by a cron job (e.g., Vercel Cron)
// It should be scheduled to run at the end of the day (e.g., 23:55)
router.get('/mark-absent', async (req, res) => {
  try {
    // Optional: Add a secret check here to prevent unauthorized access
    // if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    // 1. Check if today is a working day
    const schedule = await WorkSchedule.findOne();
    const workDays = schedule?.workDays || [1, 2, 3, 4, 5]; // Default Mon-Fri
    const currentDayOfWeek = now.getDay();
    
    const specialDay = await SpecialWorkingDay.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });
    const holiday = await Holiday.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });

    let isWorkingDay = workDays.includes(currentDayOfWeek);

    if (specialDay) {
      isWorkingDay = true; // Explicitly set as working day
    } else if (holiday) {
      isWorkingDay = false; // Holiday means off
    }

    if (!isWorkingDay) {
      return res.json({ 
        message: 'Today is not a working day. No absent records created.',
        isWorkingDay: false
      });
    }

    // 2. Get all active users (excluding maybe admins if they don't track attendance?)
    // For now, we'll check all users. You might want to filter by role or status.
    const users = await User.find({});

    // 3. Find existing attendance records for today
    const attendanceRecords = await Attendance.find({
      date: { $gte: today, $lte: todayEnd }
    });
    
    const checkedInUserIds = new Set(attendanceRecords.map(a => a.userId.toString()));

    // 4. Identify users who haven't checked in
    const usersWithoutAttendance = users.filter(u => !checkedInUserIds.has(u._id.toString()));
    
    if (usersWithoutAttendance.length === 0) {
      return res.json({ 
        message: 'All users have checked in today.',
        markedAbsent: 0,
        markedLeave: 0
      });
    }

    // 5. Check for approved leaves
    const approvedLeaves = await Leave.find({
      status: 'approved',
      startDate: { $lte: todayEnd },
      endDate: { $gte: today }
    });

    const usersOnLeaveIds = new Set(approvedLeaves.map(l => l.userId.toString()));

    // 6. Separate into Absent vs Leave
    const usersToMarkLeave = usersWithoutAttendance.filter(u => usersOnLeaveIds.has(u._id.toString()));
    const usersToMarkAbsent = usersWithoutAttendance.filter(u => !usersOnLeaveIds.has(u._id.toString()));

    const newRecords = [];

    // Create leave records
    usersToMarkLeave.forEach(u => {
      newRecords.push({
        userId: u._id,
        date: now,
        status: 'leave',
        hours: 8,
        notes: 'Auto-marked on leave (Approved Leave)',
        checkIn: null,
        checkOut: null
      });
    });

    // Create absent records
    usersToMarkAbsent.forEach(u => {
      newRecords.push({
        userId: u._id,
        date: now,
        status: 'absent',
        hours: 0,
        notes: 'Auto-marked absent by system',
        checkIn: null,
        checkOut: null
      });
    });

    if (newRecords.length > 0) {
      await Attendance.insertMany(newRecords);
    }

    res.json({ 
      message: 'Attendance check complete', 
      markedAbsent: usersToMarkAbsent.length,
      markedLeave: usersToMarkLeave.length,
      absentUsers: usersToMarkAbsent.map(u => ({ id: u._id, name: u.fullName })),
      leaveUsers: usersToMarkLeave.map(u => ({ id: u._id, name: u.fullName }))
    });

  } catch (error) {
    console.error('Cron mark-absent error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
