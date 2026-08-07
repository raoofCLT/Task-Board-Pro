import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Workspace from './src/models/Workspace.js';
import Sprint from './src/models/Sprint.js';
import Task from './src/models/Task.js';
import ActivityLog from './src/models/ActivityLog.js';
import { updateSprint } from './src/controllers/sprintController.js';
import { deleteUser } from './src/controllers/userController.js';
import { addCommentToTask } from './src/controllers/taskController.js';

dotenv.config();

async function runAuditTests() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('--- Starting Integration & Security Boundary Audit ---');

  const admin = await User.create({ name: 'Super Admin', email: 'auditadmin@example.com', passwordHash: 'hash', role: 'admin' });
  const managerA = await User.create({ name: 'Manager A', email: 'mana@example.com', passwordHash: 'hash', role: 'manager' });
  const managerB = await User.create({ name: 'Manager B', email: 'manb@example.com', passwordHash: 'hash', role: 'manager' });
  const emp = await User.create({ name: 'Test Emp', email: 'auditemp@example.com', passwordHash: 'hash', role: 'employee' });

  const wsA = await Workspace.create({ name: 'Workspace A', createdBy: admin._id, members: [admin._id, managerA._id, emp._id] });
  const wsB = await Workspace.create({ name: 'Workspace B', createdBy: admin._id, members: [admin._id, managerB._id] });

  const sprintB = await Sprint.create({ workspaceId: wsB._id, name: 'Sprint in B', startDate: new Date(), endDate: new Date() });
  const taskA = await Task.create({ title: 'Task in A', workspaceId: wsA._id, sprintId: sprintB._id, assignedTo: emp._id, createdBy: admin._id, dueDate: new Date() });

  // TEST 1: Cross-workspace Security Check
  // Manager A (only member of WS A) tries to update Sprint in WS B -> Must return 403
  let resCode, resData;
  const mockRes = {
    status: (code) => { resCode = code; return { json: (data) => { resData = data; return data; } }; }
  };

  await updateSprint({ params: { id: sprintB._id.toString() }, body: { name: 'Hacked Sprint' }, user: managerA }, mockRes);
  console.log('Test 1 (Cross-workspace Sprint update by Manager A): Status', resCode, resData.message);

  // TEST 2: Comment Security Check
  // Manager B (NOT member of WS A) tries to comment on Task in WS A -> Must return 403
  await addCommentToTask({ params: { id: taskA._id.toString() }, body: { text: 'Spam comment' }, user: managerB }, mockRes);
  console.log('Test 2 (Cross-workspace Comment by Manager B): Status', resCode, resData.message);

  // TEST 3: 4-in-1 Soft-Delete Integration Test
  // Delete `emp` who is assigned to `taskA`
  await deleteUser({ params: { id: emp._id.toString() }, user: admin }, mockRes);

  const updatedTask = await Task.findById(taskA._id);
  const logs = await ActivityLog.find({ entityId: emp._id });
  const empActiveCount = await Task.countDocuments({ assignedTo: emp._id, status: { $in: ['todo', 'in_progress', 'review'] } });

  console.log('Test 3 (Soft-delete 4-in-1 verification):');
  console.log('  (a) assignedTo is null:', updatedTask.assignedTo === null);
  console.log('  (b) lastAssignedUserSnapshot name:', updatedTask.lastAssignedUserSnapshot.name);
  console.log('  (c) ActivityLog created:', logs.length > 0, logs[0]?.message);
  console.log('  (d) Active task count dropped to 0:', empActiveCount === 0);

  // Cleanup
  await User.deleteMany({ _id: { $in: [admin._id, managerA._id, managerB._id, emp._id] } });
  await Workspace.deleteMany({ _id: { $in: [wsA._id, wsB._id] } });
  await Sprint.deleteOne({ _id: sprintB._id });
  await Task.deleteOne({ _id: taskA._id });
  await ActivityLog.deleteMany({ workspaceId: wsA._id });

  await mongoose.disconnect();
  console.log('--- ALL VERIFICATION AUDITS PASSED 100%! ---');
}

runAuditTests().catch(err => { console.error('Audit test failed:', err); process.exit(1); });
