import express, { Request, Response } from 'express';
import Department from '../models/DepartmentModel.js';
import Zone from '../models/ZoneModel.js';
import AppRole from '../models/RoleModel.js';

const router = express.Router();

router.get('/departments', async (req: Request, res: Response) => {
  try {
    const items = await Department.find().sort({ name: 1 }).lean();
    res.json({ departments: items.map(d => ({ id: (d._id as any).toString(), name: d.name })) });
  } catch (e) {
    console.error('Public departments list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/zones', async (req: Request, res: Response) => {
  try {
    const items = await Zone.find().sort({ name: 1 }).lean();
    res.json({ zones: items.map(z => ({ id: (z._id as any).toString(), name: z.name })) });
  } catch (e) {
    console.error('Public zones list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const items = await AppRole.find().sort({ name: 1 }).lean();
    res.json({ roles: items.map(r => ({ id: (r._id as any).toString(), name: r.name, protected: (r as any).protected || false })) });
  } catch (e) {
    console.error('Public roles list error:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
