import mongoose from 'mongoose';
import { connectDB } from './config/mongodb';
import Department from './models/DepartmentModel';
import Zone from './models/ZoneModel';
import Role from './models/RoleModel';

const seedOrgData = async () => {
  await connectDB();

  try {
    // Departments
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany([
        { name: 'Engineering', description: 'Software Development and IT' },
        { name: 'Human Resources', description: 'Employee management and recruiting' },
        { name: 'Sales', description: 'Sales and business development' },
        { name: 'Marketing', description: 'Marketing and advertising' },
        { name: 'Finance', description: 'Accounting and finance' },
      ]);
      console.log('Departments seeded');
    }

    // Zones
    const zoneCount = await Zone.countDocuments();
    if (zoneCount === 0) {
      await Zone.insertMany([
        { name: 'New York Office', description: 'Headquarters' },
        { name: 'London Office', description: 'European Branch' },
        { name: 'Remote (US)', description: 'US Remote Employees' },
        { name: 'Remote (Global)', description: 'International Remote Employees' },
      ]);
      console.log('Zones seeded');
    }

    // Roles
    const roles = [
      { name: 'Admin', description: 'System Administrator', protected: true },
      { name: 'HR', description: 'Human Resources', protected: true },
      { name: 'Employee', description: 'General Employee', protected: true },
      { name: 'Software Engineer', description: 'Full stack developer' },
      { name: 'Senior Software Engineer', description: 'Lead developer' },
      { name: 'Product Manager', description: 'Product strategy and roadmap' },
      { name: 'HR Manager', description: 'HR operations lead' },
      { name: 'Sales Representative', description: 'Client acquisition' },
      { name: 'Designer', description: 'UI/UX Designer' },
    ];

    for (const role of roles) {
      await Role.findOneAndUpdate(
        { name: role.name },
        role,
        { upsert: true, new: true }
      );
    }
    console.log('Roles seeded');

    console.log('Seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedOrgData();
