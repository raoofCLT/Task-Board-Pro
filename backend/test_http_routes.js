import dotenv from 'dotenv';
import mongoose from 'mongoose';
import express from 'express';
import http from 'http';
import jwt from 'jsonwebtoken';
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Sprint from './src/models/Sprint.js';
import Task from './src/models/Task.js';

import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import sprintRoutes from './src/routes/sprintRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import activityLogRoutes from './src/routes/activityLogRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

/**
 * Strict Assertion Helper
 */
function assertEqual(actual, expected, testName) {
  if (actual !== expected) {
    throw new Error(`[ASSERTION FAILED] ${testName}: Expected ${expected}, but got ${actual}`);
  }
}

async function runHTTPTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- Starting Strict HTTP-Level Route & Middleware Integration Test ---');

  // Start real Express server instance on port 5055
  const app = express();
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/activity-logs', activityLogRoutes);
  app.use('/api', sprintRoutes);
  app.use('/api', taskRoutes);
  app.use(errorHandler);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5055, resolve));

  // Create test data
  const admin = await User.create({ name: 'HTTP Admin', email: 'httpadmin@example.com', passwordHash: 'hash', role: 'admin' });
  const managerA = await User.create({ name: 'HTTP Manager A', email: 'httpmana@example.com', passwordHash: 'hash', role: 'manager' });
  const managerB = await User.create({ name: 'HTTP Manager B', email: 'httpmanb@example.com', passwordHash: 'hash', role: 'manager' });

  const wsA = await Workspace.create({ name: 'HTTP Workspace A', createdBy: admin._id, members: [admin._id, managerA._id] });
  const wsB = await Workspace.create({ name: 'HTTP Workspace B', createdBy: admin._id, members: [admin._id, managerB._id] });

  const sprintB = await Sprint.create({ workspaceId: wsB._id, name: 'Sprint in B', startDate: new Date(), endDate: new Date() });
  const taskB = await Task.create({ title: 'Secret Task in B', workspaceId: wsB._id, sprintId: sprintB._id, createdBy: admin._id, dueDate: new Date() });

  // Issue real JWT tokens
  const tokenManagerA = jwt.sign({ id: managerA._id, role: managerA.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  try {
    // TEST 1: Manager A tries GET /api/tasks?workspaceId=<WorkspaceB> over real HTTP
    const res1 = await fetch(`http://localhost:5055/api/tasks?workspaceId=${wsB._id.toString()}`, {
      headers: { Authorization: `Bearer ${tokenManagerA}` }
    });
    const data1 = await res1.json();
    assertEqual(res1.status, 403, 'Test 1 (Manager A GET tasks in Workspace B via ?workspaceId)');
    assertEqual(data1.success, false, 'Test 1 JSON success flag');
    console.log('✔ Test 1 PASSED: GET /api/tasks?workspaceId=WorkspaceB returned 403 Forbidden');

    // TEST 2: Manager A tries GET /api/tasks/:id for task in Workspace B over real HTTP
    const res2 = await fetch(`http://localhost:5055/api/tasks/${taskB._id.toString()}`, {
      headers: { Authorization: `Bearer ${tokenManagerA}` }
    });
    const data2 = await res2.json();
    assertEqual(res2.status, 403, 'Test 2 (Manager A GET task details in Workspace B)');
    assertEqual(data2.success, false, 'Test 2 JSON success flag');
    console.log('✔ Test 2 PASSED: GET /api/tasks/:id for Workspace B task returned 403 Forbidden');

    // TEST 3: Manager A tries POST /api/tasks/:id/comments for task in Workspace B over real HTTP
    const res3 = await fetch(`http://localhost:5055/api/tasks/${taskB._id.toString()}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenManagerA}` },
      body: JSON.stringify({ text: 'Unauthorized comment' })
    });
    const data3 = await res3.json();
    assertEqual(res3.status, 403, 'Test 3 (Manager A POST comment to task in Workspace B)');
    assertEqual(data3.success, false, 'Test 3 JSON success flag');
    console.log('✔ Test 3 PASSED: POST /api/tasks/:id/comments for Workspace B task returned 403 Forbidden');

    // TEST 4: Manager A tries PATCH /api/sprints/:id for Sprint in Workspace B over real HTTP (Router-level middleware check)
    const res4 = await fetch(`http://localhost:5055/api/sprints/${sprintB._id.toString()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenManagerA}` },
      body: JSON.stringify({ name: 'Hacked Sprint Name' })
    });
    const data4 = await res4.json();
    assertEqual(res4.status, 403, 'Test 4 (Manager A PATCH Sprint in Workspace B)');
    assertEqual(data4.success, false, 'Test 4 JSON success flag');
    console.log('✔ Test 4 PASSED: PATCH /api/sprints/:id for Workspace B sprint returned 403 Forbidden');

  } finally {
    // Cleanup
    await User.deleteMany({ _id: { $in: [admin._id, managerA._id, managerB._id] } });
    await Workspace.deleteMany({ _id: { $in: [wsA._id, wsB._id] } });
    await Sprint.deleteOne({ _id: sprintB._id });
    await Task.deleteOne({ _id: taskB._id });

    server.close();
    await mongoose.disconnect();
  }

  console.log('--- ALL STRICT PROGRAMMATIC HTTP TESTS PASSED 100%! ---');
}

runHTTPTests().catch(err => {
  console.error('HTTP Test Assertion Error:', err.message);
  process.exit(1);
});
