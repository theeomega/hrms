import { Router, Response } from 'express';
import { SystemSettingsModel } from '../models/SystemSettingsModel.js';
import LeaveBalance from '../models/LeaveBalanceModel.js';
import { verifyToken, AuthRequest } from '../middleware/auth.js';
import User from '../models/UserModel.js';

const router = Router();

// Get settings (Public)
router.get('/', async (req, res) => {
  try {
    let settings = await SystemSettingsModel.findOne();
    if (!settings) {
      settings = await SystemSettingsModel.create({ signupEnabled: true });
    }
    res.json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ message: 'Failed to fetch settings' });
  }
});

// Update settings (Admin only)
router.put('/', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const { signupEnabled, defaultSickLeave, defaultVacationLeave, defaultPersonalLeave } = req.body;
    let settings = await SystemSettingsModel.findOne();
    
    if (!settings) {
      settings = new SystemSettingsModel({ 
        signupEnabled,
        defaultSickLeave,
        defaultVacationLeave,
        defaultPersonalLeave
      });
    } else {
      if (signupEnabled !== undefined) settings.signupEnabled = signupEnabled;
      if (defaultSickLeave !== undefined) settings.defaultSickLeave = defaultSickLeave;
      if (defaultVacationLeave !== undefined) settings.defaultVacationLeave = defaultVacationLeave;
      if (defaultPersonalLeave !== undefined) settings.defaultPersonalLeave = defaultPersonalLeave;
      settings.updatedAt = new Date();
    }
    
    await settings.save();
    res.json(settings);
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Failed to update settings' });
  }
});

// Apply leave defaults to all employees (Admin only)
router.post('/apply-leave-defaults', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const currentUser = await User.findById(userId);
    
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'hr_admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const settings = await SystemSettingsModel.findOne();
    if (!settings) {
      return res.status(404).json({ message: 'Settings not found' });
    }

    const currentYear = new Date().getFullYear();
    
    // Update all leave balances for the current year
    // We only update the 'total' fields, preserving 'used'
    await LeaveBalance.updateMany(
      { year: currentYear },
      {
        $set: {
          'sickLeave.total': settings.defaultSickLeave ?? 12,
          'vacation.total': settings.defaultVacationLeave ?? 15,
          'personalLeave.total': settings.defaultPersonalLeave ?? 5
        }
      }
    );

    res.json({ message: 'Leave defaults applied to all employees for the current year.' });
  } catch (error) {
    console.error('Apply leave defaults error:', error);
    res.status(500).json({ message: 'Failed to apply leave defaults' });
  }
});

export default router;
