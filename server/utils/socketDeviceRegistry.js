function registerSocketDevice(socketDeviceMap, socketId, deviceId) {
  for (const [oldSocketId, mappedDeviceId] of socketDeviceMap.entries()) {
    if (mappedDeviceId === deviceId && oldSocketId !== socketId) {
      socketDeviceMap.delete(oldSocketId);
    }
  }

  socketDeviceMap.set(socketId, deviceId);
}

function unregisterSocketDevice(socketDeviceMap, socketId) {
  const deviceId = socketDeviceMap.get(socketId);
  socketDeviceMap.delete(socketId);
  return deviceId;
}

function listSocketDeviceMappings(socketDeviceMap) {
  return Array.from(socketDeviceMap.entries()).map(([socketId, deviceId]) => ({
    socketId,
    deviceId,
  }));
}

module.exports = {
  listSocketDeviceMappings,
  registerSocketDevice,
  unregisterSocketDevice,
};
