import express, { Response } from 'express';
import Notification from '../models/NotificationModel.js';
import User from '../models/UserModel.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get all notifications
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50 } = req.query;

    const notifications = await Notification.find({ userId })
      .populate('relatedUser', 'fullName')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string))
      .lean();

    const formattedNotifications = notifications.map(notif => ({
      id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read,
      time: formatTimeAgo(notif.createdAt),
      timestamp: notif.createdAt,
      relatedUser: notif.relatedUser ? (notif.relatedUser as any).fullName : null
    }));

    res.json({ notifications: formattedNotifications });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const count = await Notification.countDocuments({ userId, read: false });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark notification as read
router.patch('/:id/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.post('/mark-all-read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;

    await Notification.updateMany(
      { userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create notification (internal use or admin)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const currentUserId = req.userId;
    const { userId, type, title, message, relatedUser } = req.body;

    // Check if user is admin for creating notifications for others
    const currentUser = await User.findById(currentUserId);
    if (!currentUser || (userId && userId !== currentUserId && currentUser.role !== 'hr_admin' && currentUser.role !== 'admin')) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const targetUserId = userId || currentUserId;

    const notification = await Notification.create({
      userId: targetUserId,
      type: type || 'system',
      title,
      message,
      relatedUser: relatedUser || null,
      actor: currentUserId
    });

    res.json({
      message: 'Notification created successfully',
      notification: {
        id: ((notification as any)._id).toString(),
        type: notification.type,
        title: notification.title,
        message: notification.message
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete notification
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    await notification.deleteOne();

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to format time ago
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  
  const intervals = [
    { label: 'year', seconds: 31536000 },
    { label: 'month', seconds: 2592000 },
    { label: 'week', seconds: 604800 },
    { label: 'day', seconds: 86400 },
    { label: 'hour', seconds: 3600 },
    { label: 'minute', seconds: 60 },
    { label: 'second', seconds: 1 }
  ];

  for (const interval of intervals) {
    const count = Math.floor(seconds / interval.seconds);
    if (count >= 1) {
      return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
    }
  }
  
  return 'just now';
}

export default router;
