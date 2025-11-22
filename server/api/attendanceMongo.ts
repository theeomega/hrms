import express, { Response } from 'express';
import Attendance from '../models/AttendanceModel.js';
import AttendanceCorrection from '../models/AttendanceCorrectionModel.js';
import Notification from '../models/NotificationModel.js';
import User from '../models/UserModel.js';
import WorkSchedule from '../models/WorkScheduleModel.js';
import Holiday from '../models/HolidayModel.js';
import SpecialWorkingDay from '../models/SpecialWorkingDayModel.js';
import { startOfDay, endOfDay, differenceInMinutes } from 'date-fns';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get attendance records
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { startDate, endDate, limit = 50 } = req.query;

    const query: any = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate as string),
        $lte: new Date(endDate as string)
      };
    }

    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .limit(parseInt(limit as string))
      .lean();

    const formattedRecords = records.map(record => ({
      id: record._id.toString(),
      date: record.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      checkIn: record.checkIn ? record.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      checkOut: record.checkOut ? record.checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
      hours: record.hours.toFixed(1),
      status: record.status,
      notes: record.notes || '',
      month: record.date.toLocaleDateString('en-US', { month: 'short' })
    }));

    res.json({ records: formattedRecords });
  } catch (error) {
    console.error('Get attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check in
router.post('/checkin', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    // Check if already checked in today
    const existing = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: todayEnd }
    });

    if (existing && existing.checkIn) {
      return res.status(400).json({ message: 'Already checked in today' });
    }

    // Get work schedule and check if today is a working day
    const schedule = await WorkSchedule.findOne();
    const workDays = schedule?.workDays || [1, 2, 3, 4, 5]; // Default Mon-Fri
    const currentDayOfWeek = now.getDay(); // 0=Sun, 1=Mon...

    // Check for Special Working Day (Overrides everything)
    const specialDay = await SpecialWorkingDay.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });

    // Check for Holiday
    const holiday = await Holiday.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });

    let isWorkingDay = workDays.includes(currentDayOfWeek);
    let nonWorkingReason = null;

    if (specialDay) {
      isWorkingDay = true; // Explicitly set as working day
    } else if (holiday) {
      isWorkingDay = false; // Holiday means off
      nonWorkingReason = `Holiday: ${holiday.name}`;
    } else if (!isWorkingDay) {
      nonWorkingReason = 'Weekend / Off Day';
    }

    if (!isWorkingDay) {
      return res.status(400).json({ message: `Cannot check in today. ${nonWorkingReason}` });
    }

    const startTime = schedule?.workStartTime || '09:00';
    const [startHour, startMinute] = startTime.split(':').map(Number);

    // Determine status (late if after start time)
    const hour = now.getHours();
    const minute = now.getMinutes();
    const isLate = hour > startHour || (hour === startHour && minute > startMinute);

    let attendance;
    if (existing) {
      existing.checkIn = now;
      existing.status = isLate ? 'late' : 'present';
      attendance = await existing.save();
    } else {
      attendance = await Attendance.create({
        userId,
        date: today,
        checkIn: now,
        status: isLate ? 'late' : 'present'
      });
    }

    // Create notification if late
    if (isLate) {
      await Notification.create({
        userId,
        type: 'attendance',
        title: 'Late Check-in',
        message: `You checked in late today at ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      });
    }

    res.json({
      message: 'Checked in successfully',
      attendance: {
        checkIn: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check out
router.post('/checkout', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const now = new Date();
    const today = startOfDay(now);
    const todayEnd = endOfDay(now);

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: todayEnd }
    });

    if (!attendance) {
      return res.status(400).json({ message: 'No check-in found for today' });
    }

    if (attendance.checkOut) {
      return res.status(400).json({ message: 'Already checked out today' });
    }

    if (!attendance.checkIn) {
      return res.status(400).json({ message: 'Must check in before checking out' });
    }

  attendance.checkOut = now;
  // Calculate fractional hours using minutes to support partial hours (e.g., 1.5 hrs)
  const minutes = differenceInMinutes(now, attendance.checkIn);
  const hours = Number((minutes / 60).toFixed(1));
  attendance.hours = hours;
    await attendance.save();

    res.json({
      message: 'Checked out successfully',
      attendance: {
        checkOut: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        hours: attendance.hours.toFixed(1)
      }
    });
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get today's status
router.get('/today', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const today = startOfDay(new Date());
    const todayEnd = endOfDay(new Date());

    // Check working day status
    const schedule = await WorkSchedule.findOne();
    const workDays = schedule?.workDays || [1, 2, 3, 4, 5];
    const currentDayOfWeek = today.getDay();

    const specialDay = await SpecialWorkingDay.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });
    const holiday = await Holiday.findOne({ 
      date: { $gte: today, $lte: todayEnd } 
    });

    let isWorkingDay = workDays.includes(currentDayOfWeek);
    let nonWorkingReason = null;

    if (specialDay) {
      isWorkingDay = true;
    } else if (holiday) {
      isWorkingDay = false;
      nonWorkingReason = `Holiday: ${holiday.name}`;
    } else if (!isWorkingDay) {
      nonWorkingReason = 'Weekend / Off Day';
    }

    const attendance = await Attendance.findOne({
      userId,
      date: { $gte: today, $lte: todayEnd }
    }).lean();

    if (!attendance) {
      return res.json({ 
        checkedIn: false, 
        checkedOut: false,
        isWorkingDay,
        nonWorkingReason
      });
    }

    res.json({
      checkedIn: !!attendance.checkIn,
      checkedOut: !!attendance.checkOut,
      checkIn: attendance.checkIn ? attendance.checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
      checkInISO: attendance.checkIn ? attendance.checkIn.toISOString() : null,
      checkOut: attendance.checkOut ? attendance.checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
      hours: attendance.hours.toFixed(1),
      status: attendance.status,
      isWorkingDay,
      nonWorkingReason
    });
  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add note to attendance record
router.post('/:id/note', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { note } = req.body;

    if (!note || !note.trim()) {
      return res.status(400).json({ message: 'Note is required' });
    }

    const attendance = await Attendance.findOne({ _id: id, userId });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    attendance.notes = note.trim();
    await attendance.save();

    res.json({ 
      message: 'Note saved successfully',
      attendance: {
        id: (attendance._id as any).toString(),
        notes: attendance.notes
      }
    });
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Request attendance correction
router.post('/:id/request-correction', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ message: 'Reason is required' });
    }

    const attendance = await Attendance.findOne({ _id: id, userId });

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Check if there's already a pending correction request
    const existingRequest = await AttendanceCorrection.findOne({
      attendanceId: id,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ message: 'A correction request for this record is already pending' });
    }

    // Create correction request
    const correctionRequest = await AttendanceCorrection.create({
      userId,
      attendanceId: id,
      reason: reason.trim()
    });

    // Notify HR admins
    const hrAdmins = await User.find({ role: { $in: ['admin', 'hr_admin'] } });
    
    for (const admin of hrAdmins) {
      await Notification.create({
        userId: admin._id,
        title: 'New Attendance Correction Request',
        message: `An attendance correction request has been submitted for review.`,
        type: 'attendance',
        relatedId: (correctionRequest._id as any).toString()
      });
    }

    res.json({ 
      message: 'Correction request submitted successfully',
      request: {
        id: (correctionRequest._id as any).toString(),
        status: correctionRequest.status
      }
    });
  } catch (error) {
    console.error('Request correction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get correction requests (for admins)
router.get('/corrections/pending', async (req: AuthRequest, res: Response) => {
  try {
    // Get all corrections (pending, approved, rejected) for admin view
    const corrections = await AttendanceCorrection.find({})
      .populate('userId', 'fullName username email employeeId position department')
      .populate('reviewedBy', 'fullName username')
      .populate('attendanceId')
      .sort({ createdAt: -1 })
      .lean();

    const formattedCorrections = corrections.map(correction => {
      const attendance = correction.attendanceId as any;
      const reviewedBy = correction.reviewedBy as any;
      return {
        id: correction._id.toString(),
        user: {
          name: (correction.userId as any).fullName || (correction.userId as any).username || '',
          fullName: (correction.userId as any).fullName,
          username: (correction.userId as any).username,
          email: (correction.userId as any).email,
          employeeId: (correction.userId as any).employeeId,
          position: (correction.userId as any).position,
          department: (correction.userId as any).department
        },
        attendance: {
          id: (attendance?._id as any)?.toString(),
          date: attendance?.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
          checkIn: attendance?.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          checkOut: attendance?.checkOut ? new Date(attendance.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-',
          hours: attendance?.hours?.toFixed(1) || '0.0',
          status: attendance?.status
        },
        reason: correction.reason,
        status: correction.status,
        createdAt: correction.createdAt,
        reviewedAt: correction.reviewedAt,
        reviewNotes: correction.reviewNotes,
        reviewedBy: reviewedBy ? {
          name: reviewedBy.fullName || reviewedBy.username
        } : null
      };
    });

    res.json({ corrections: formattedCorrections });
  } catch (error) {
    console.error('Get corrections error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/Reject correction request (for admins)
router.post('/corrections/:id/review', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const correction = await AttendanceCorrection.findById(id).populate('userId');

    if (!correction) {
      return res.status(404).json({ message: 'Correction request not found' });
    }

    if (correction.status !== 'pending') {
      return res.status(400).json({ message: 'This request has already been reviewed' });
    }

    correction.status = status as 'approved' | 'rejected';
    correction.reviewedBy = userId as any;
    correction.reviewedAt = new Date();
    correction.reviewNotes = reviewNotes || '';
    await correction.save();

    // Notify the employee
    await Notification.create({
      userId: correction.userId,
      title: `Correction Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      message: `Your attendance correction request has been ${status}.${reviewNotes ? ` Note: ${reviewNotes}` : ''}`,
      type: 'attendance',
      relatedId: (correction._id as any).toString()
    });

    res.json({ 
      message: `Correction request ${status} successfully`,
      correction: {
        id: (correction._id as any).toString(),
        status: correction.status
      }
    });
  } catch (error) {
    console.error('Review correction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update attendance record (Admin only - for corrections)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { checkIn, checkOut, status, date } = req.body;

    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    // Update status first to handle special cases
    if (status !== undefined) {
      if (!['present', 'late', 'absent', 'leave'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      attendance.status = status;
    }

    // Handle absent or leave status - set check-in/out to null
    if (attendance.status === 'absent' || attendance.status === 'leave') {
      attendance.checkIn = null;
      attendance.checkOut = null;
      // Leave gets 8 hours, absent gets 0
      attendance.hours = attendance.status === 'leave' ? 8 : 0;
    } else {
      // For present/late status, update check-in/out times
      if (checkIn !== undefined) {
        attendance.checkIn = checkIn ? new Date(checkIn) : null;
      }
      
      if (checkOut !== undefined) {
        attendance.checkOut = checkOut ? new Date(checkOut) : null;
      }

      // Recalculate hours if both checkIn and checkOut are present
      if (attendance.checkIn && attendance.checkOut) {
        const diffMinutes = differenceInMinutes(attendance.checkOut, attendance.checkIn);
        attendance.hours = Math.max(0, diffMinutes / 60);
      } else {
        attendance.hours = 0;
      }
    }

    if (date !== undefined) {
      attendance.date = new Date(date);
    }

    await attendance.save();

    // Notify the employee about the update and track admin actor
    try {
      await Notification.create({
        userId: attendance.userId,
        type: 'attendance',
        title: 'Attendance Updated',
        message: `Your attendance record for ${attendance.date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })} was updated by admin.`,
        actor: userId
      });
    } catch (e) {
      console.error('Create attendance update notification error:', e);
    }

    res.json({ 
      message: 'Attendance updated successfully',
      attendance: {
        id: (attendance._id as any).toString(),
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        hours: attendance.hours,
        status: attendance.status,
        date: attendance.date
      }
    });
  } catch (error) {
    console.error('Update attendance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
