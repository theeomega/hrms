import express, { Response } from 'express';
import User from '../models/UserModel.js';
import Zone from '../models/ZoneModel.js';
import bcrypt from 'bcryptjs';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get profile
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Resolve zone details (optional)
    let zoneDetails: any = null;
    if (user.location) {
      const zone = await Zone.findOne({ name: user.location }).lean();
      if (zone) {
        zoneDetails = {
          id: (zone._id as any).toString(),
          name: zone.name,
          description: zone.description || ''
        };
      }
    }

    res.json({
      profile: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        phone: user.phone,
        location: user.location,
        zone: zoneDetails,
        joinDate: user.joinDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { fullName, email, phone, location, department, position } = req.body;

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if email is already taken by another user
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      user.email = email.toLowerCase();
    }

    // Update fields
    if (fullName) user.fullName = fullName;
    if (phone) user.phone = phone;
    if (location) user.location = location;
    if (department) user.department = department;
    if (position) user.position = position;

    await user.save();

    let zoneDetails: any = null;
    if (user.location) {
      const zone = await Zone.findOne({ name: user.location }).lean();
      if (zone) {
        zoneDetails = {
          id: (zone._id as any).toString(),
          name: zone.name,
          description: zone.description || ''
        };
      }
    }
    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        position: user.position,
        phone: user.phone,
        location: user.location,
        zone: zoneDetails,
        joinDate: user.joinDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.post('/change-password', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
