import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveDevProxyTarget } from './vite.proxyTarget.js';

test('defaults the dev proxy target to the shared local backend port', () => {
  assert.equal(resolveDevProxyTarget({}), 'http://localhost:3001');
});

test('allows overriding the dev proxy target for a dedicated worktree backend', () => {
  assert.equal(resolveDevProxyTarget({ VITE_SERVER_ORIGIN: 'http://127.0.0.1:3101' }), 'http://127.0.0.1:3101');
});
