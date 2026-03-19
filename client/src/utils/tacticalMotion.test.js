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
