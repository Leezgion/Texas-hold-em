import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const emptySeatSource = readFileSync(new URL('./EmptySeat.jsx', import.meta.url), 'utf8');
const seatCardSource = readFileSync(new URL('./SeatCard.jsx', import.meta.url), 'utf8');
const leaderboardSource = readFileSync(new URL('./Leaderboard.jsx', import.meta.url), 'utf8');
const modeShellSource = readFileSync(new URL('./ModeShell.jsx', import.meta.url), 'utf8');
const actionDockSource = readFileSync(new URL('./ActionDock.jsx', import.meta.url), 'utf8');
const actionButtonsSource = readFileSync(new URL('./ActionButtons.jsx', import.meta.url), 'utf8');
const playerTimerSource = readFileSync(new URL('./PlayerTimer.jsx', import.meta.url), 'utf8');
const settlementOverlaySource = readFileSync(new URL('./SettlementOverlay.jsx', import.meta.url), 'utf8');
const tableStageSource = readFileSync(new URL('./TableStage.jsx', import.meta.url), 'utf8');
const cssSource = readFileSync(new URL('../index.css', import.meta.url), 'utf8');

test('EmptySeat exposes a real button trigger with disabled semantics and an accessible label', () => {
  assert.match(emptySeatSource, /<button/);
  assert.match(emptySeatSource, /type="button"/);
  assert.match(emptySeatSource, /disabled=\{seatRequestPending\}/);
  assert.match(emptySeatSource, /aria-label=/);
  assert.match(emptySeatSource, /seatAvailability === 'closed'/);
});

test('SettlementOverlay routes reveal actions through an async pending-aware handler', () => {
  assert.match(settlementOverlaySource, /deriveRequestErrorFeedback/);
  assert.match(settlementOverlaySource, /const handleRevealSelection = async/);
  assert.match(settlementOverlaySource, /disabled=\{revealRequestPending\}/);
});

test('room support surfaces use product-facing Chinese framing instead of internal English kickers', () => {
  const roomPanelSheetSource = readFileSync(new URL('./RoomPanelSheet.jsx', import.meta.url), 'utf8');
  assert.match(roomPanelSheetSource, /辅助面板/);
  assert.doesNotMatch(roomPanelSheetSource, /Support Surface/);
});

test('SeatCard renders embedded plaque class names instead of floating card classes', () => {
  assert.match(seatCardSource, /arena-seat-plaque/);
  assert.match(seatCardSource, /arena-seat-plaque--current-turn/);
  assert.match(seatCardSource, /arena-seat-plaque--broadcast-response/);
  assert.match(seatCardSource, /arena-seat-plaque__meta-row/);
  assert.match(seatCardSource, /data-plaque-density-model/);
  assert.match(seatCardSource, /arena-seat-plaque__turn-glow--broadcast-turn-cue/);
  assert.doesNotMatch(seatCardSource, /arena-seat-card/);
});

test('host fallback names do not duplicate a second textual host badge', () => {
  assert.match(seatCardSource, /const showHostBadge = Boolean\(player\.isHost\) && displayName !== '房主'/);
  assert.match(leaderboardSource, /const showHostPill = Boolean\(player\.isHost\) && displayName !== '房主'/);
});

test('EmptySeat uses embedded plaque trigger classes', () => {
  assert.match(emptySeatSource, /arena-seat-plaque__empty-trigger/);
  assert.match(emptySeatSource, /arena-seat-plaque__empty-trigger--compact/);
  assert.match(emptySeatSource, /arena-seat-plaque__empty-copy/);
  assert.match(emptySeatSource, /arena-seat-plaque__empty-seal/);
  assert.doesNotMatch(emptySeatSource, /arena-seat-empty-trigger/);
});

test('ActionDock includes restrained broadcast cue hooks', () => {
  assert.match(actionDockSource, /tactical-dock--broadcast-cue/);
  assert.match(actionDockSource, /tactical-dock__action-frame tactical-dock__action-frame--table-console/);
  assert.match(actionDockSource, /tactical-dock__turn-chip--broadcast-cue/);
  assert.doesNotMatch(actionDockSource, /tactical-dock__action-frame--broadcast-confirmation/);
});

test('ActionButtons exposes a table-integrated action console instead of utility-only button rows', () => {
  assert.match(actionButtonsSource, /table-action-console/);
  assert.match(actionButtonsSource, /table-action-console--watch/);
  assert.match(actionButtonsSource, /table-action-console__command-row/);
  assert.match(actionButtonsSource, /buildActionCommandClass\('fold'\)/);
  assert.match(actionButtonsSource, /buildActionCommandClass\('check'\)/);
  assert.match(actionButtonsSource, /buildActionCommandClass\('call'\)/);
  assert.match(actionButtonsSource, /buildActionCommandClass\('raise'/);
  assert.match(actionButtonsSource, /buildActionCommandClass\('allin'\)/);
  assert.match(actionButtonsSource, /table-action-console__raise-surface/);
  assert.match(actionButtonsSource, /table-action-console__quick-grid/);
  assert.match(actionButtonsSource, /table-action-console__raise-actions/);
  assert.match(actionButtonsSource, /data-action-console-state=\{actionConsoleState\}/);
  assert.match(actionButtonsSource, /table-action-console__watch-state/);
});

test('PlayerTimer shares the table-action console language', () => {
  assert.match(playerTimerSource, /table-action-timer/);
  assert.match(playerTimerSource, /table-action-timer__dial/);
  assert.match(playerTimerSource, /table-action-timer__prompt/);
});

test('TableStage includes restrained broadcast cue hooks for turn and settlement surfaces', () => {
  assert.match(tableStageSource, /table-stage-pot-capsule--broadcast-confirmation/);
  assert.match(tableStageSource, /table-stage-beacon__cue--broadcast-turn/);
  assert.doesNotMatch(tableStageSource, /table-stage-beacon__last-action--broadcast-confirmation/);
});

test('ModeShell routes reduced-motion state into tactical cue css controls', () => {
  assert.match(modeShellSource, /useReducedMotion/);
  assert.match(modeShellSource, /reducedMotion,\s*viewport: motionViewport/);
  assert.match(modeShellSource, /--arena-shell-cue-play-state/);
  assert.match(modeShellSource, /data-shell-reduced-motion/);
});

test('broadcast tactical css stays aligned with scoped cue usage and phone confirmation timing', () => {
  assert.doesNotMatch(cssSource, /\.table-stage-beacon__last-action--broadcast-confirmation/);
  assert.doesNotMatch(cssSource, /\.tactical-dock__action-frame--broadcast-confirmation/);
  assert.match(
    cssSource,
    /mode-shell\[data-shell-motion-viewport="phone-terminal"\]\s+\.table-stage-pot-capsule--broadcast-confirmation\s*\{[\s\S]*animation-duration:\s*var\(--arena-motion-settlement-confirm\);/
  );
  assert.match(
    cssSource,
    /mode-shell\[data-shell-reduced-motion="true"\][\s\S]*tactical-dock__turn-chip--broadcast-cue[\s\S]*animation:\s*none/
  );
  assert.match(cssSource, /\.arena-seat-plaque--compact-secondary\s*\{/);
  assert.match(cssSource, /\.arena-seat-plaque__empty-trigger--compact\s*\{/);
  assert.match(cssSource, /\.table-action-console\s*\{/);
  assert.match(cssSource, /\.table-action-console--watch\s*\{/);
  assert.match(cssSource, /\.table-action-command--fold\s*\{/);
  assert.match(cssSource, /\.table-action-console__raise-surface\s*\{/);
  assert.match(cssSource, /\.table-action-timer__dial\s*\{/);
});
