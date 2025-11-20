import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/UserModel.js';
import LeaveBalance from '../models/LeaveBalanceModel.js';
import Department from '../models/DepartmentModel.js';
import Zone from '../models/ZoneModel.js';
import AppRole from '../models/RoleModel.js';
import { generateToken, verifyToken, type AuthRequest } from '../middleware/auth.js';
import { SystemSettingsModel } from '../models/SystemSettingsModel.js';

const router = express.Router();

// Signup route
router.post('/signup', async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, department, position, phone, location, role } = req.body;

    // Validation
    if (!username || !email || !password || !fullName || !department || !position) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Validate against admin-created values
    const validDept = await Department.findOne({ name: department });
    if (!validDept) {
      return res.status(400).json({ message: 'Invalid department. Please select from the list.' });
    }

    const validPosition = await AppRole.findOne({ name: position });
    if (!validPosition) {
      return res.status(400).json({ message: 'Invalid position. Please select from the list.' });
    }

    if (location) {
      const validZone = await Zone.findOne({ name: location });
      if (!validZone) {
        return res.status(400).json({ message: 'Invalid location. Please select from the list.' });
      }
    }

    // Bootstrap allowance: if signup disabled but no users exist allow first account
    const totalUsers = await User.countDocuments();
    if (totalUsers > 0) {
      const settings = await SystemSettingsModel.findOne();
      if (settings && settings.signupEnabled === false) {
        return res.status(403).json({ message: 'Signup is currently disabled' });
      }
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Generate employee ID with year sequence and overall sequence
    // Format: EMP-YYYY-<yearSeq>-<globalSeq>
    const year = new Date().getFullYear();
    const yearUserCount = await User.countDocuments({ createdAt: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });
    const globalUserCount = await User.countDocuments();
    const yearSeq = String(yearUserCount + 1).padStart(3, '0');
    const globalSeq = String(globalUserCount + 1).padStart(4, '0');
    const employeeId = `EMP-${year}-${yearSeq}-${globalSeq}`;

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with specified role (admin or employee)
    const user = new User({
      username,
      email,
      password: hashedPassword,
      fullName,
      employeeId,
      department,
      position,
      phone: phone || '',
      location: location || '',
      role: role === 'admin' ? 'admin' : 'employee'
    });

    await user.save();

    // Fetch system settings for default leave counts
    const settings = await SystemSettingsModel.findOne();
    const defaultSick = settings?.defaultSickLeave ?? 12;
    const defaultVacation = settings?.defaultVacationLeave ?? 15;
    const defaultPersonal = settings?.defaultPersonalLeave ?? 5;

    // Create initial leave balance
    await LeaveBalance.create({
      userId: user._id,
      year: new Date().getFullYear(),
      sickLeave: { used: 0, total: defaultSick },
      vacation: { used: 0, total: defaultVacation },
      personalLeave: { used: 0, total: defaultPersonal }
    });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login route
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    // Set token in cookie (httpOnly for security)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict'
    });

    res.json({
      message: 'Login successful',
      user: userResponse,
      token // Also send in response body for mobile apps or other clients
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout route
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('token');
  res.json({ message: 'Logout successful' });
});

// Bootstrap info (public) - tells client whether any user exists
router.get('/bootstrap', async (_req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    res.json({ hasUsers: totalUsers > 0 });
  } catch (e) {
    res.status(500).json({ hasUsers: true }); // fail-safe: treat as having users
  }
});

// Get current user
router.get('/me', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password (authenticated user)
router.post('/change-password', verifyToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { currentPassword, newPassword } = req.body as { currentPassword: string; newPassword: string };

    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const matches = await bcrypt.compare(currentPassword, user.password);
    if (!matches) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
