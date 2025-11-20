import express, { Response } from 'express';
import Leave from '../models/LeaveModel.js';
import LeaveBalance from '../models/LeaveBalanceModel.js';
import Notification from '../models/NotificationModel.js';
import User from '../models/UserModel.js';
import { SystemSettingsModel } from '../models/SystemSettingsModel.js';
import { differenceInDays } from 'date-fns';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get leave requests
router.get('/requests', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let query: any = {};
    
    if (user.role === 'employee') {
      query.userId = userId;
    }

    const leaves = await Leave.find(query)
      // Include more user fields so the client can render employee info without showing N/A
      .populate('userId', 'fullName employeeId email department position')
      .populate('approvedBy', 'fullName')
      .sort({ appliedOn: -1 })
      .lean();

    const formattedLeaves = leaves.map(leave => ({
      id: (leave as any)._id.toString(),
      employeeName: (leave.userId as any).fullName,
      employeeId: (leave.userId as any).employeeId,
      // Add commonly requested employee fields for detail view
      email: (leave.userId as any).email ?? null,
      department: (leave.userId as any).department ?? null,
      position: (leave.userId as any).position ?? null,
      type: leave.type,
      startDate: leave.startDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      endDate: leave.endDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      days: leave.days,
      reason: leave.reason,
      status: leave.status,
      // Keep existing formatted fields for backward compatibility in list views
      appliedOn: leave.appliedOn.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      approvedBy: leave.approvedBy ? (leave.approvedBy as any).fullName : null,
      approvalDate: leave.approvalDate ? leave.approvalDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : null,
      rejectionReason: leave.rejectionReason,
      // Add ISO timestamps so detail views can show precise date/time
      appliedOnISO: leave.appliedOn?.toISOString?.() ?? null,
      approvalDateISO: leave.approvalDate ? leave.approvalDate.toISOString() : null,
      updatedAtISO: (leave as any).updatedAt?.toISOString?.() ?? null
    }));

    res.json({ leaves: formattedLeaves });
  } catch (error) {
    console.error('Get leave requests error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leave balance
router.get('/balance', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentYear = new Date().getFullYear();

    let balance = await LeaveBalance.findOne({ userId, year: currentYear });

    if (!balance) {
      // Fetch system settings for default leave counts
      const settings = await SystemSettingsModel.findOne();
      const defaultSick = settings?.defaultSickLeave ?? 12;
      const defaultVacation = settings?.defaultVacationLeave ?? 15;
      const defaultPersonal = settings?.defaultPersonalLeave ?? 5;

      // Create initial balance for the year
      balance = await LeaveBalance.create({
        userId,
        year: currentYear,
        sickLeave: { used: 0, total: defaultSick },
        vacation: { used: 0, total: defaultVacation },
        personalLeave: { used: 0, total: defaultPersonal }
      });
    }

    res.json({
      balance: {
        sickLeave: balance.sickLeave,
        vacation: balance.vacation,
        personalLeave: balance.personalLeave
      }
    });
  } catch (error) {
    console.error('Get leave balance error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create leave request
router.post('/request', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { type, startDate, endDate, reason } = req.body;

    if (!type || !startDate || !endDate || !reason) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = differenceInDays(end, start) + 1;

    if (days <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    // Check leave balance
    const currentYear = new Date().getFullYear();
    let balance = await LeaveBalance.findOne({ userId, year: currentYear });

    if (!balance) {
      // Fetch system settings for default leave counts
      const settings = await SystemSettingsModel.findOne();
      const defaultSick = settings?.defaultSickLeave ?? 12;
      const defaultVacation = settings?.defaultVacationLeave ?? 15;
      const defaultPersonal = settings?.defaultPersonalLeave ?? 5;

      balance = await LeaveBalance.create({ 
        userId, 
        year: currentYear,
        sickLeave: { used: 0, total: defaultSick },
        vacation: { used: 0, total: defaultVacation },
        personalLeave: { used: 0, total: defaultPersonal }
      });
    }

    let leaveTypeKey: 'sickLeave' | 'vacation' | 'personalLeave';
    if (type === 'Sick Leave') leaveTypeKey = 'sickLeave';
    else if (type === 'Vacation') leaveTypeKey = 'vacation';
    else if (type === 'Personal Leave') leaveTypeKey = 'personalLeave';
    else return res.status(400).json({ message: 'Invalid leave type' });

    const available = balance[leaveTypeKey].total - balance[leaveTypeKey].used;
    if (days > available) {
      return res.status(400).json({ message: `Insufficient leave balance. You have ${available} days available.` });
    }

    // Create leave request
    const leave = await Leave.create({
      userId,
      type,
      startDate: start,
      endDate: end,
      days,
      reason
    });

    // Create notification for HR admins
    const hrAdmins = await User.find({ $or: [{ role: 'admin' }, { role: 'hr_admin' }] });
    const user = await User.findById(userId);
    
    for (const admin of hrAdmins) {
      await Notification.create({
        userId: admin._id,
        type: 'leave',
        title: 'New Leave Request',
        message: `${user?.fullName} has requested ${days} day(s) of ${type}`,
        relatedUser: userId
      });
    }

    res.json({
      message: 'Leave request submitted successfully',
      leave: {
        id: (leave as any)._id.toString(),
        type: leave.type,
        days: leave.days,
        status: leave.status
      }
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve leave request (HR admin only)
router.post('/approve/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

  leave.status = 'approved';
  // Cast to any to satisfy TS typing for ObjectId
  leave.approvedBy = userId as any;
    leave.approvalDate = new Date();
    await leave.save();

    // Update leave balance
    const currentYear = new Date().getFullYear();
    const balance = await LeaveBalance.findOne({ userId: leave.userId, year: currentYear });
    
    if (balance) {
      let leaveTypeKey: 'sickLeave' | 'vacation' | 'personalLeave';
      if (leave.type === 'Sick Leave') leaveTypeKey = 'sickLeave';
      else if (leave.type === 'Vacation') leaveTypeKey = 'vacation';
      else leaveTypeKey = 'personalLeave';

      balance[leaveTypeKey].used += leave.days;
      await balance.save();
    }

    // Notify employee
    await Notification.create({
      userId: leave.userId,
      type: 'approval',
      title: 'Leave Request Approved',
      message: `Your ${leave.type} request for ${leave.days} day(s) has been approved`,
      relatedUser: userId,
      actor: userId
    });

    res.json({ message: 'Leave request approved successfully' });
  } catch (error) {
    console.error('Approve leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject leave request (HR admin only)
router.post('/reject/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { reason } = req.body;

    const user = await User.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    if (leave.status !== 'pending') {
      return res.status(400).json({ message: 'Leave request already processed' });
    }

    leave.status = 'rejected';
    leave.rejectionReason = reason || 'No reason provided';
    await leave.save();

    // Notify employee
    await Notification.create({
      userId: leave.userId,
      type: 'alert',
      title: 'Leave Request Rejected',
      message: `Your ${leave.type} request for ${leave.days} day(s) has been rejected. Reason: ${leave.rejectionReason}`,
      relatedUser: userId,
      actor: userId
    });

    res.json({ message: 'Leave request rejected successfully' });
  } catch (error) {
    console.error('Reject leave error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
