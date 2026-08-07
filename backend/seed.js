import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Sprint from './src/models/Sprint.js';
import Task from './src/models/Task.js';
import ActivityLog from './src/models/ActivityLog.js';

dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas for seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Workspace.deleteMany({});
    await Sprint.deleteMany({});
    await Task.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('Cleared existing database collections.');

    // Password hash for test accounts
    const passwordHash = await bcrypt.hash('Password123!', 10);

    // 1. Create Users
    const admin = await User.create({
      name: 'Alice Admin',
      email: 'admin@example.com',
      passwordHash,
      role: 'admin'
    });

    const manager = await User.create({
      name: 'Mark Manager',
      email: 'manager@example.com',
      passwordHash,
      role: 'manager'
    });

    const emp1 = await User.create({
      name: 'Emma Employee (Max Capacity)',
      email: 'employee1@example.com',
      passwordHash,
      role: 'employee'
    });

    const emp2 = await User.create({
      name: 'Eric Employee',
      email: 'employee2@example.com',
      passwordHash,
      role: 'employee'
    });

    console.log('Created Users:');
    console.log(`  Admin: ${admin.email} (Password: Password123!)`);
    console.log(`  Manager: ${manager.email} (Password: Password123!)`);
    console.log(`  Employee 1 (Max 8 Tasks): ${emp1.email} (Password: Password123!)`);
    console.log(`  Employee 2: ${emp2.email} (Password: Password123!)`);

    // 2. Create 3 Workspaces
    const ws1 = await Workspace.create({
      name: 'Engineering Workspace',
      description: 'Core product backend engineering and API architecture team workspace',
      createdBy: admin._id,
      members: [admin._id, manager._id, emp1._id, emp2._id]
    });

    const ws2 = await Workspace.create({
      name: 'Mobile App Workspace',
      description: 'iOS and Android client application development workspace',
      createdBy: admin._id,
      members: [admin._id, manager._id, emp1._id, emp2._id]
    });

    const ws3 = await Workspace.create({
      name: 'Design & Marketing Workspace',
      description: 'Brand identity, UI design system, and marketing campaigns workspace',
      createdBy: admin._id,
      members: [admin._id, manager._id, emp2._id]
    });

    console.log('Created 3 Workspaces:');
    console.log(`  1. '${ws1.name}'`);
    console.log(`  2. '${ws2.name}'`);
    console.log(`  3. '${ws3.name}'`);

    // 3. Create Sprints
    const now = new Date();
    const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
    const fourWeeksLater = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);

    const sprint1 = await Sprint.create({
      workspaceId: ws1._id,
      name: 'Sprint 1 - Core Backend & Auth',
      startDate: now,
      endDate: twoWeeksLater,
      isActive: true
    });

    const sprint2 = await Sprint.create({
      workspaceId: ws1._id,
      name: 'Sprint 2 - Sockets & Realtime',
      startDate: twoWeeksLater,
      endDate: fourWeeksLater,
      isActive: false
    });

    const sprintMobile = await Sprint.create({
      workspaceId: ws2._id,
      name: 'Mobile Sprint 1 - UI & API Sync',
      startDate: now,
      endDate: twoWeeksLater,
      isActive: true
    });

    console.log('Created Sprints across workspaces.');

    // 4. Create Tasks
    const pastDueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const futureDueDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);

    const tasks = [
      // --- 8 ACTIVE TASKS ASSIGNED TO emp1 (Emma Employee) to reach MAX 8 TASK CAPACITY ---
      {
        title: 'Task 1: Database Schema & Validation Indexes',
        description: 'Design Mongoose schemas with validation and compound indexes',
        priority: 'high',
        status: 'in_progress',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['backend', 'database'],
        comments: [{ text: 'Schema models created cleanly.', author: manager._id, authorName: 'Mark Manager' }]
      },
      {
        title: 'Task 2: Implement JWT Auth & Role Authorization Guard',
        description: 'Role-gated API endpoints with bcrypt password hashing',
        priority: 'high',
        status: 'in_progress',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['security', 'backend']
      },
      {
        title: 'Task 3: Build Task State Transition Machine',
        description: 'Enforce transition lookup table and 8-active-task limit',
        priority: 'high',
        status: 'review',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['business-rules']
      },
      {
        title: 'Task 4: Setup Activity Audit Logger Service',
        description: 'Centralized logging service for all workspace mutations',
        priority: 'medium',
        status: 'in_progress',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['audit']
      },
      {
        title: 'Task 5: Configure Socket.io Workspace Event Rooms',
        description: 'Broadcast task updates to workspace rooms live',
        priority: 'medium',
        status: 'todo',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['realtime', 'sockets']
      },
      {
        title: 'Task 6: Build Executive Analytics Aggregation Pipeline',
        description: 'MongoDB $facet aggregation pipeline for dashboard metrics',
        priority: 'high',
        status: 'todo',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['analytics']
      },
      {
        title: 'Task 7: Setup Docker & Compose Environment',
        description: 'Multi-container orchestration setup for Node API and MongoDB',
        priority: 'low',
        status: 'todo',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['devops', 'docker']
      },
      {
        title: 'Task 8: Implement Workspace Archive Active Sprint Guard',
        description: 'Block archiving if active sprint exists in workspace',
        priority: 'medium',
        status: 'review',
        dueDate: futureDueDate,
        assignedTo: emp1._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['security', 'validation']
      },

      // --- TASKS ASSIGNED TO emp2 (Eric Employee) & OTHER WORKSPACES ---
      {
        title: 'Mobile UI Navigation & Dark Mode Integration',
        description: 'Responsive mobile drawer navigation and theme switcher',
        priority: 'medium',
        status: 'in_progress',
        dueDate: pastDueDate, // Overdue task!
        assignedTo: emp2._id,
        sprintId: sprintMobile._id,
        workspaceId: ws2._id,
        createdBy: manager._id,
        labels: ['mobile', 'ui', 'overdue']
      },
      {
        title: 'Task Comments & Thread Discussion API',
        description: 'Subdocument comments array with real-time socket events',
        priority: 'medium',
        status: 'done', // Completed task
        dueDate: pastDueDate,
        assignedTo: emp2._id,
        sprintId: sprint1._id,
        workspaceId: ws1._id,
        createdBy: manager._id,
        labels: ['comments', 'completed']
      },
      {
        title: 'Design System & Component Tokens Specs',
        description: 'Figma tokens and color contrast specifications',
        priority: 'low',
        status: 'todo',
        dueDate: futureDueDate,
        assignedTo: emp2._id,
        sprintId: sprintMobile._id,
        workspaceId: ws2._id,
        createdBy: manager._id,
        labels: ['design']
      }
    ];

    await Task.insertMany(tasks);
    console.log(`Created ${tasks.length} initial Tasks across 3 workspaces.`);
    console.log(`  NOTE: Emma Employee (employee1@example.com) currently has MAX 8 ACTIVE TASKS assigned!`);

    // 5. Seed Activity Logs
    await ActivityLog.create({
      workspaceId: ws1._id,
      entityType: 'workspace',
      entityId: ws1._id,
      action: 'created',
      performedBy: admin._id,
      performedByName: admin.name,
      message: `Workspace '${ws1.name}' created by Admin '${admin.name}'`
    });

    await ActivityLog.create({
      workspaceId: ws2._id,
      entityType: 'workspace',
      entityId: ws2._id,
      action: 'created',
      performedBy: admin._id,
      performedByName: admin.name,
      message: `Workspace '${ws2.name}' created by Admin '${admin.name}'`
    });

    await ActivityLog.create({
      workspaceId: ws3._id,
      entityType: 'workspace',
      entityId: ws3._id,
      action: 'created',
      performedBy: admin._id,
      performedByName: admin.name,
      message: `Workspace '${ws3.name}' created by Admin '${admin.name}'`
    });

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding error:', error);
    process.exit(1);
  }
};

seedData();
