import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveServerOrigin } from './serverOrigin.js';

test('keeps the vite dev server origin so api and socket requests go through the proxy', () => {
  const origin = resolveServerOrigin({
    protocol: 'http:',
    hostname: '127.0.0.1',
    port: '5173',
    origin: 'http://127.0.0.1:5173',
  });

  assert.equal(origin, 'http://127.0.0.1:5173');
});

test('uses the current origin when the app is served by the node server directly', () => {
  const origin = resolveServerOrigin({
    protocol: 'http:',
    hostname: '127.0.0.1',
    port: '3101',
    origin: 'http://127.0.0.1:3101',
  });

  assert.equal(origin, 'http://127.0.0.1:3101');
});

test('keeps localhost direct-server runs on the same origin', () => {
  const origin = resolveServerOrigin({
    protocol: 'http:',
    hostname: 'localhost',
    port: '3001',
    origin: 'http://localhost:3001',
  });

  assert.equal(origin, 'http://localhost:3001');
});
