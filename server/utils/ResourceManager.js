class ResourceManager {
  constructor() {
    this.sockets = new Map();
  }

  registerSocket(socketId, socket, metadata = {}) {
    this.sockets.set(socketId, {
      socket,
      metadata,
      connectedAt: Date.now(),
      lastActivity: Date.now(),
    });
  }

  unregisterSocket(socketId) {
    this.sockets.delete(socketId);
  }

  updateSocketActivity(socketId) {
    const entry = this.sockets.get(socketId);
    if (entry) {
      entry.lastActivity = Date.now();
    }
  }

  getSocket(socketId) {
    return this.sockets.get(socketId)?.socket || null;
  }

  getStats() {
    return {
      socketCount: this.sockets.size,
      sockets: Array.from(this.sockets.entries()).map(([socketId, entry]) => ({
        socketId,
        connectedAt: entry.connectedAt,
        lastActivity: entry.lastActivity,
        metadata: entry.metadata,
      })),
    };
  }
}

const resourceManager = new ResourceManager();

module.exports = {
  ResourceManager,
  resourceManager,
};
