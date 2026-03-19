import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import test from 'node:test';

import { emitWithResponse } from './socketRequest.js';

class FakeSocket extends EventEmitter {
  constructor() {
    super();
    this.requests = [];
  }

  emit(eventName, ...args) {
    this.requests.push({ eventName, args });
    return super.emit(eventName, ...args);
  }
}

test('resolves when the expected success event arrives and removes listeners', async () => {
  const socket = new FakeSocket();
  const request = emitWithResponse(socket, {
    emitEvent: 'createRoom',
    payload: { maxPlayers: 6 },
    successEvent: 'roomCreated',
    errorEvent: 'createRoomError',
    timeoutMs: 50,
  });

  assert.equal(socket.listenerCount('roomCreated'), 1);
  assert.equal(socket.listenerCount('createRoomError'), 1);
  assert.deepEqual(socket.requests.at(-1), {
    eventName: 'createRoom',
    args: [{ maxPlayers: 6 }],
  });

  socket.emit('roomCreated', { roomId: 'ABC123' });

  await assert.doesNotReject(request);
  assert.deepEqual(await request, { roomId: 'ABC123' });
  assert.equal(socket.listenerCount('roomCreated'), 0);
  assert.equal(socket.listenerCount('createRoomError'), 0);
});

test('rejects when the expected error event arrives and removes listeners', async () => {
  const socket = new FakeSocket();
  const request = emitWithResponse(socket, {
    emitEvent: 'createRoom',
    payload: { maxPlayers: 2 },
    successEvent: 'roomCreated',
    errorEvent: 'createRoomError',
    timeoutMs: 50,
  });

  socket.emit('createRoomError', { message: '房间创建失败' });

  await assert.rejects(request, /房间创建失败/);
  assert.equal(socket.listenerCount('roomCreated'), 0);
  assert.equal(socket.listenerCount('createRoomError'), 0);
});

test('preserves structured error metadata so callers can branch on error codes', async () => {
  const socket = new FakeSocket();
  const request = emitWithResponse(socket, {
    emitEvent: 'startGame',
    payload: 'ROOM01',
    successEvent: 'startGameSuccess',
    errorEvent: 'startGameError',
    timeoutMs: 50,
  });

  socket.emit('startGameError', {
    message: '房间状态异常，需要恢复',
    code: 'ROOM_RECOVERY_REQUIRED',
  });

  await assert.rejects(request, (error) => {
    assert.equal(error.message, '房间状态异常，需要恢复');
    assert.equal(error.code, 'ROOM_RECOVERY_REQUIRED');
    return true;
  });
});

test('rejects with a timeout error when neither success nor error arrives', async () => {
  const socket = new FakeSocket();
  const request = emitWithResponse(socket, {
    emitEvent: 'createRoom',
    payload: { maxPlayers: 4 },
    successEvent: 'roomCreated',
    errorEvent: 'createRoomError',
    timeoutMs: 20,
  });

  await assert.rejects(request, /请求超时/);
  assert.equal(socket.listenerCount('roomCreated'), 0);
  assert.equal(socket.listenerCount('createRoomError'), 0);
});
