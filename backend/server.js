import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import workspaceRoutes from './src/routes/workspaceRoutes.js';
import sprintRoutes from './src/routes/sprintRoutes.js';
import taskRoutes from './src/routes/taskRoutes.js';
import dashboardRoutes from './src/routes/dashboardRoutes.js';
import activityLogRoutes from './src/routes/activityLogRoutes.js';
import { errorHandler } from './src/middleware/errorHandler.js';
import { initSocket } from './src/sockets/socketHandler.js';

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io real-time engine
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api', sprintRoutes);
app.use('/api', taskRoutes);

// Health Check Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Task Board API is running with Socket.io real-time engine',
    timestamp: new Date().toISOString()
  });
});

// Centralized Global Error Handler (Must be registered after all routes)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
