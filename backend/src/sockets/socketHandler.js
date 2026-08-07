import { Server } from 'socket.io';

let io;

/**
 * Initializes Socket.io instance attached to HTTP Server
 */
export const initSocket = (server) => {
  const clientUrl = process.env.CLIENT_URL || '*';
  io = new Server(server, {
    cors: {
      origin: clientUrl,
      methods: ['GET', 'POST', 'PATCH', 'DELETE']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Client joins a workspace room to receive real-time task board updates
    socket.on('joinWorkspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(workspaceId.toString());
        console.log(`Socket ${socket.id} joined workspace room: ${workspaceId}`);
      }
    });

    socket.on('leaveWorkspace', (workspaceId) => {
      if (workspaceId) {
        socket.leave(workspaceId.toString());
        console.log(`Socket ${socket.id} left workspace room: ${workspaceId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Helper to get active Socket.io instance for emitting events
 */
export const getIO = () => {
  if (!io) {
    // Safe fallback to prevent crashes if socket is uninitialized
    return {
      to: () => ({
        emit: () => {}
      })
    };
  }
  return io;
};

/**
 * Utility to emit task updates to a workspace room
 */
export const emitWorkspaceEvent = (workspaceId, eventName, data) => {
  try {
    const socketServer = getIO();
    socketServer.to(workspaceId.toString()).emit(eventName, data);
  } catch (error) {
    console.error('Socket emit error:', error.message);
  }
};
