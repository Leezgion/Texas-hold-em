const fs = require('fs');
const path = require('path');

const {
  listSocketDeviceMappings,
  registerSocketDevice,
  unregisterSocketDevice,
} = require('../utils/socketDeviceRegistry');

describe('socketDeviceRegistry', () => {
  test('removes all stale mappings for the same device before registering the current socket', () => {
    const socketDeviceMap = new Map([
      ['socket-old-1', 'device-hero'],
      ['socket-old-2', 'device-hero'],
      ['socket-villain', 'device-villain'],
    ]);

    registerSocketDevice(socketDeviceMap, 'socket-current', 'device-hero');

    expect(socketDeviceMap.has('socket-old-1')).toBe(false);
    expect(socketDeviceMap.has('socket-old-2')).toBe(false);
    expect(socketDeviceMap.get('socket-villain')).toBe('device-villain');
    expect(socketDeviceMap.get('socket-current')).toBe('device-hero');
  });

  test('unregisters the disconnected socket without removing the reconnecting device from other sockets', () => {
    const socketDeviceMap = new Map([
      ['socket-old', 'device-hero'],
      ['socket-current', 'device-hero'],
      ['socket-villain', 'device-villain'],
    ]);

    const deviceId = unregisterSocketDevice(socketDeviceMap, 'socket-old');

    expect(deviceId).toBe('device-hero');
    expect(socketDeviceMap.has('socket-old')).toBe(false);
    expect(socketDeviceMap.get('socket-current')).toBe('device-hero');
    expect(socketDeviceMap.get('socket-villain')).toBe('device-villain');
  });

  test('lists active mappings from the registry map only', () => {
    const socketDeviceMap = new Map([
      ['socket-a', 'device-a'],
      ['socket-b', 'device-b'],
    ]);

    expect(listSocketDeviceMappings(socketDeviceMap)).toEqual([
      { socketId: 'socket-a', deviceId: 'device-a' },
      { socketId: 'socket-b', deviceId: 'device-b' },
    ]);
  });

  test('server disconnect handler unregisters stale socket mappings', () => {
    const serverSource = fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8');

    expect(serverSource).toMatch(/unregisterSocketDevice\(socketDeviceMap,\s*socket\.id\)/);
  });
});
