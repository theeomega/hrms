import express, { Response } from 'express';
import Department from '../models/DepartmentModel.js';
import Zone from '../models/ZoneModel.js';
import AppRole from '../models/RoleModel.js';
import User from '../models/UserModel.js';
import WorkSchedule from '../models/WorkScheduleModel.js';
import Holiday from '../models/HolidayModel.js';
import SpecialWorkingDay from '../models/SpecialWorkingDayModel.js';
import Notification from '../models/NotificationModel.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

function ensureAdmin(user: any) {
  return user && (user.role === 'admin' || user.role === 'hr_admin');
}

async function notifyAllUsers(title: string, message: string, type: string = 'system') {
  try {
    const users = await User.find({}, '_id');
    const notifications = users.map(u => ({
      userId: u._id,
      type,
      title,
      message,
      read: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Failed to notify all users:', error);
  }
}

// ---------- Work Schedule ----------
router.get('/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    let schedule = await WorkSchedule.findOne();
    if (!schedule) {
      schedule = await WorkSchedule.create({});
    }
    
    res.json({ 
      workDays: schedule.workDays,
      workStartTime: schedule.workStartTime,
      workEndTime: schedule.workEndTime
    });
  } catch (e) {
    console.error('Get schedule error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/schedule', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    const { workDays, workStartTime, workEndTime } = req.body;
    
    let schedule = await WorkSchedule.findOne();
    if (!schedule) {
      schedule = new WorkSchedule();
    }
    
    if (workDays) schedule.workDays = workDays;
    if (workStartTime) schedule.workStartTime = workStartTime;
    if (workEndTime) schedule.workEndTime = workEndTime;
    
    await schedule.save();

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const daysString = schedule.workDays.map((d: number) => dayNames[d]).join(', ');

    // Notify all users about schedule change
    await notifyAllUsers(
      'Work Schedule Updated', 
      `The organization work schedule has been updated. Working days: ${daysString}. New hours: ${schedule.workStartTime} - ${schedule.workEndTime}.`
    );
    
    res.json({ 
      message: 'Schedule updated',
      workDays: schedule.workDays,
      workStartTime: schedule.workStartTime,
      workEndTime: schedule.workEndTime
    });
  } catch (e) {
    console.error('Update schedule error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

import { startOfDay, endOfDay } from 'date-fns';

// ---------- Holidays ----------
router.get('/holidays', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    const holidays = await Holiday.find().sort({ date: 1 }).lean();
    res.json({ 
      holidays: holidays.map(h => ({
        id: (h._id as any).toString(),
        name: h.name,
        date: h.date,
        description: h.description
      }))
    });
  } catch (e) {
    console.error('Get holidays error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/holidays', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    const { name, date, description } = req.body;
    if (!name || !date) return res.status(400).json({ message: 'Name and date are required' });
    
    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Check if date is already a special working day
    const existingSpecialDay = await SpecialWorkingDay.findOne({
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingSpecialDay) {
      return res.status(400).json({ message: 'This date is already marked as a Special Working Day. Please remove it first.' });
    }

    const holiday = await Holiday.create({ name, date: targetDate, description });

    // Notify all users
    await notifyAllUsers(
      'New Holiday Added',
      `A new holiday "${name}" has been added for ${targetDate.toLocaleDateString()}.`
    );
    
    res.status(201).json({
      id: (holiday._id as any).toString(),
      name: holiday.name,
      date: holiday.date,
      description: holiday.description
    });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Holiday for this date already exists' });
    console.error('Create holiday error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/holidays/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ message: 'Holiday deleted' });
  } catch (e) {
    console.error('Delete holiday error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Special Working Days ----------
router.get('/special-days', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    const days = await SpecialWorkingDay.find().sort({ date: 1 }).lean();
    res.json({ 
      specialDays: days.map(d => ({
        id: (d._id as any).toString(),
        date: d.date,
        reason: d.reason
      }))
    });
  } catch (e) {
    console.error('Get special days error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/special-days', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    const { date, reason } = req.body;
    if (!date) return res.status(400).json({ message: 'Date is required' });
    
    const targetDate = new Date(date);
    const dayStart = startOfDay(targetDate);
    const dayEnd = endOfDay(targetDate);

    // Check if date is already a holiday
    const existingHoliday = await Holiday.findOne({
      date: { $gte: dayStart, $lte: dayEnd }
    });

    if (existingHoliday) {
      return res.status(400).json({ message: `This date is already marked as a Holiday (${existingHoliday.name}). Please remove it first.` });
    }

    const day = await SpecialWorkingDay.create({ date: targetDate, reason });

    // Notify all users
    await notifyAllUsers(
      'Special Working Day',
      `A special working day has been scheduled for ${targetDate.toLocaleDateString()}${reason ? ': ' + reason : ''}.`
    );
    
    res.status(201).json({
      id: (day._id as any).toString(),
      date: day.date,
      reason: day.reason
    });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Special working day for this date already exists' });
    console.error('Create special day error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/special-days/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    
    await SpecialWorkingDay.findByIdAndDelete(req.params.id);
    res.json({ message: 'Special working day deleted' });
  } catch (e) {
    console.error('Delete special day error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Departments ----------
router.get('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const items = await Department.find().sort({ name: 1 }).lean();
    res.json({ departments: items.map(d => ({ id: (d._id as any).toString(), name: d.name, description: d.description || '' })) });
  } catch (e) {
    console.error('Departments list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/departments', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const created = await Department.create({ name, description });
    res.status(201).json({ id: (created._id as any).toString(), name: created.name, description: created.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Department name must be unique' });
    console.error('Departments create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/departments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await Department.findByIdAndUpdate(id, { $set: { name, description } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id, name: updated.name, description: updated.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Department name must be unique' });
    console.error('Departments update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/departments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    await Department.findByIdAndDelete(id);
    res.json({ id });
  } catch (e) {
    console.error('Departments delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Zones ----------
router.get('/zones', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const items = await Zone.find().sort({ name: 1 }).lean();
    res.json({ zones: items.map(z => ({ id: (z._id as any).toString(), name: z.name, description: z.description || '' })) });
  } catch (e) {
    console.error('Zones list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/zones', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const created = await Zone.create({ name, description });
    res.status(201).json({ id: (created._id as any).toString(), name: created.name, description: created.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Zone name must be unique' });
    console.error('Zones create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/zones/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await Zone.findByIdAndUpdate(id, { $set: { name, description } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id, name: updated.name, description: updated.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Zone name must be unique' });
    console.error('Zones update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/zones/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    await Zone.findByIdAndDelete(id);
    res.json({ id });
  } catch (e) {
    console.error('Zones delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// ---------- Roles ----------
router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const items = await AppRole.find().sort({ name: 1 }).lean();
    res.json({ roles: items.map(r => ({ id: (r._id as any).toString(), name: r.name, description: r.description || '', protected: (r as any).protected || false })) });
  } catch (e) {
    console.error('Roles list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });
    const created = await AppRole.create({ name, description });
    res.status(201).json({ id: (created._id as any).toString(), name: created.name, description: created.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Role name must be unique' });
    console.error('Roles create error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.patch('/roles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    const { name, description } = req.body;
    const updated = await AppRole.findByIdAndUpdate(id, { $set: { name, description } }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json({ id, name: updated.name, description: updated.description || '' });
  } catch (e: any) {
    if (e?.code === 11000) return res.status(400).json({ message: 'Role name must be unique' });
    console.error('Roles update error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/roles/:id', async (req: AuthRequest, res: Response) => {
  try {
    const me = await User.findById(req.userId);
    if (!ensureAdmin(me)) return res.status(403).json({ message: 'Not authorized' });
    const { id } = req.params;
    const role = await AppRole.findById(id);
    if (!role) return res.status(404).json({ message: 'Not found' });
    if ((role as any).protected) return res.status(400).json({ message: 'Protected roles cannot be deleted' });
    await AppRole.findByIdAndDelete(id);
    res.json({ id });
  } catch (e) {
    console.error('Roles delete error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
