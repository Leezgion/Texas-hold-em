import assert from 'node:assert/strict';
import test from 'node:test';

import { buildTacticalMotionProfile } from './tacticalMotion.js';

test('builds sharper tactical motion for pro than club or study', () => {
  const pro = buildTacticalMotionProfile('pro');
  const club = buildTacticalMotionProfile('club');
  const study = buildTacticalMotionProfile('study');

  assert.equal(pro.reducedMotion, false);
  assert.ok(pro.durations.enter < club.durations.enter);
  assert.ok(pro.durations.enter < study.durations.enter);
  assert.ok(pro.durations.emphasis < club.durations.emphasis);
  assert.ok(pro.durations.emphasis < study.durations.emphasis);
  assert.ok(pro.settlement.staggerChildren < study.settlement.staggerChildren);
  assert.equal(pro.stage.initial.y, 18);
  assert.equal(club.stage.initial.y, 18);
  assert.equal(study.stage.initial.y, 18);
  assert.equal(pro.cue.initial.y, 10);
  assert.equal(pro.turnChip.animate.scale[1], 1.03);
  assert.equal(pro.eventCard.initial.y, 14);
  assert.equal(pro.handTape.staggerChildren, 0.045);
  assert.ok(pro.handTape.staggerChildren < study.handTape.staggerChildren);
  assert.ok(pro.eventCard.transition.duration < club.eventCard.transition.duration);
});

test('collapses tactical motion transforms when reduced motion is requested', () => {
  const reduced = buildTacticalMotionProfile('pro', { reducedMotion: true });

  assert.equal(reduced.reducedMotion, true);
  assert.equal(reduced.stage.initial.y, 0);
  assert.equal(reduced.stage.initial.scale, 1);
  assert.equal(reduced.cue.initial.y, 0);
  assert.equal(reduced.settlement.staggerChildren, 0);
  assert.equal(reduced.turnChip.animate.scale[1], 1);
  assert.equal(reduced.eventCard.initial.y, 0);
  assert.equal(reduced.handTape.staggerChildren, 0);
  assert.equal(reduced.durations.enter, 0.01);
  assert.equal(reduced.durations.emphasis, 0.01);
});

test('enforces the stricter phone-terminal motion contract', () => {
  const phone = buildTacticalMotionProfile('pro', { viewport: 'phone-terminal' });
  const desktop = buildTacticalMotionProfile('pro', { viewport: 'desktop-terminal' });

  assert.equal(phone.allowBackdropBlurStacks, false);
  assert.equal(phone.pageFloat, 'disabled');
  assert.equal(phone.primaryTransitions, 'transform-opacity-only');
  assert.equal(phone.surfaceBlur, 'minimal');
  assert.equal(phone.ambientMotion, 'reduced');
  assert.equal(desktop.allowBackdropBlurStacks, true);
  assert.equal(desktop.pageFloat, 'enabled');
  assert.equal(desktop.primaryTransitions, 'full-shell');
  assert.ok(phone.stage.initial.y < desktop.stage.initial.y);
  assert.ok(phone.cue.initial.y < desktop.cue.initial.y);
  assert.ok(phone.eventCard.initial.y < desktop.eventCard.initial.y);
  assert.ok(phone.settlement.staggerChildren < desktop.settlement.staggerChildren);
  assert.ok(phone.handTape.staggerChildren < desktop.handTape.staggerChildren);
  assert.equal(phone.turnChip.animate.scale, 1);
  assert.equal(phone.turnChip.transition.scale, undefined);
});

test('phone-terminal collapses glass, pulse, and touch-scroll budgets for room surfaces', () => {
  const phone = buildTacticalMotionProfile('pro', { viewport: 'phone-terminal' });
  const desktop = buildTacticalMotionProfile('pro', { viewport: 'desktop-terminal' });

  assert.equal(phone.touchScrollModel, 'sheet-body-y-only');
  assert.equal(desktop.touchScrollModel, 'multi-surface');
  assert.equal(phone.pulseBudget, 'minimal');
  assert.equal(desktop.pulseBudget, 'full');
  assert.ok(phone.shell.ambientBlurPx < desktop.shell.ambientBlurPx);
  assert.equal(phone.shell.overlayBackdropBlurPx, 0);
  assert.equal(phone.shell.panelBackdropBlurPx, 0);
  assert.equal(phone.shell.headerBackdropBlurPx, 0);
});

test('lowers css timing budgets for phone-terminal shells', () => {
  const phone = buildTacticalMotionProfile('pro', { viewport: 'phone-terminal' });
  const desktop = buildTacticalMotionProfile('pro', { viewport: 'desktop-terminal' });

  assert.equal(typeof phone.shellTiming, 'object');
  assert.equal(typeof desktop.shellTiming, 'object');
  assert.ok(phone.shellTiming.enterMs < desktop.shellTiming.enterMs);
  assert.ok(phone.shellTiming.emphasisMs < desktop.shellTiming.emphasisMs);
  assert.ok(phone.shellTiming.spotlightSeconds <= desktop.shellTiming.spotlightSeconds);
  assert.ok(phone.shellTiming.floatSeconds <= desktop.shellTiming.floatSeconds);
});

test('tightens phone-terminal motion and blur budgets below the existing mobile cap', () => {
  const phone = buildTacticalMotionProfile('pro', { viewport: 'phone-terminal' });

  assert.equal(phone.shellTiming.enterMs, 120);
  assert.equal(phone.shellTiming.emphasisMs, 160);
  assert.equal(phone.shellTiming.ambientSeconds, 8);
  assert.equal(phone.shellTiming.spotlightSeconds, 1.2);
  assert.equal(phone.shellTiming.floatSeconds, 4);
  assert.equal(phone.shell.ambientBlurPx, 12);
  assert.equal(phone.shell.overlayBackdropBlurPx, 0);
  assert.equal(phone.shell.panelBackdropBlurPx, 0);
  assert.equal(phone.shell.historyDrawerBackdropBlurPx, 0);
});
