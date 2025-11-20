import express, { Response } from 'express';
import mongoose from 'mongoose';
import Message from '../models/MessageModel.js';
import User from '../models/UserModel.js';
import type { AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Get total unread count
router.get('/unread-count', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const count = await Message.countDocuments({
      receiverId: userId,
      read: false
    });
    res.json({ count });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get conversations list
router.get('/conversations', async (req: AuthRequest, res: Response) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ senderId: userId }, { receiverId: userId }]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $eq: ['$senderId', userId] },
              then: '$receiverId',
              else: '$senderId'
            }
          },
          lastMessage: { $first: '$$ROOT' },
          unreadCount: {
            $sum: {
              $cond: [
                { $and: [{ $eq: ['$receiverId', userId] }, { $eq: ['$read', false] }] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      },
      {
        $project: {
          userId: '$_id',
          name: '$user.fullName',
          username: '$user.username',
          role: '$user.role', // Useful for UI
          lastMessage: '$lastMessage.content',
          lastMessageTime: '$lastMessage.createdAt',
          unreadCount: 1
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    // Also fetch all other users to allow starting new conversations
    // This might be heavy if many users, but for now it's fine.
    // Ideally, we'd have a separate "New Chat" user picker.
    // For this "minimal" UI, let's just return the active conversations.
    // The user can use the "Employees" page to find someone, or we can add a "New Chat" feature later.
    // Wait, the user asked for "employee can message each other".
    // If I only return existing conversations, they can't start a new one easily.
    // Let's fetch ALL users and merge with conversations.

    const allUsers = await User.find({ _id: { $ne: userId } }).select('fullName username role position department employeeId lastActive').lean();
    
    const conversationMap = new Map(conversations.map(c => [c.userId.toString(), c]));
    const now = new Date();
    const ACTIVE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

    const result = allUsers.map(u => {
      const conv = conversationMap.get(u._id.toString());
      const isOnline = u.lastActive && (now.getTime() - new Date(u.lastActive).getTime() < ACTIVE_THRESHOLD);
      
      return {
        id: u._id.toString(),
        name: u.fullName || u.username,
        employeeId: u.employeeId,
        role: u.position || u.role,
        department: u.department,
        isOnline,
        lastMessage: conv ? conv.lastMessage : null,
        lastMessageTime: conv ? conv.lastMessageTime : null,
        unreadCount: conv ? conv.unreadCount : 0
      };
    });

    // Sort: Active conversations first (by time), then alphabetical
    result.sort((a, b) => {
      if (a.lastMessageTime && b.lastMessageTime) {
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      }
      if (a.lastMessageTime) return -1;
      if (b.lastMessageTime) return 1;
      return a.name.localeCompare(b.name);
    });

    res.json({ conversations: result });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get messages with a specific user
router.get('/:otherId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { otherId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: userId, receiverId: otherId },
        { senderId: otherId, receiverId: userId }
      ]
    })
    .sort({ createdAt: 1 })
    .lean();

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/:receiverId', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { receiverId } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await Message.create({
      senderId: userId,
      receiverId,
      content,
      read: false
    });

    res.status(201).json({ message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.put('/:senderId/read', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    const { senderId } = req.params;

    await Message.updateMany(
      { senderId, receiverId: userId, read: false },
      { $set: { read: true } }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
