import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRoomViewportLayout } from '../utils/roomViewportLayout.js';

test('room viewport layouts keep the single-screen scroll contract across supported viewports', () => {
  const cases = [
    { width: 390, height: 844, expectedHeightClass: 'regular-height' },
    { width: 844, height: 390, expectedHeightClass: 'short-height' },
    { width: 1280, height: 900, expectedHeightClass: 'regular-height' },
    { width: 1720, height: 1000, expectedHeightClass: 'regular-height' },
  ];

  for (const viewport of cases) {
    const layout = resolveRoomViewportLayout(viewport);

    assert.equal(layout.pageScroll, 'locked');
    assert.equal(layout.roomScrollContract, 'single-screen');
    assert.equal(layout.heroDockPlacement, 'fixed-bottom');
    assert.equal(layout.heightClass, viewport.expectedHeightClass);
  }
});
