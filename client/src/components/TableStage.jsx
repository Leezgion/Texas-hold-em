import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import CommunityCards from './CommunityCards';
import TableStageChrome from './TableStageChrome';
import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile } from '../utils/tacticalMotion';
import { resolveCommunityCardLayout, resolveTableSurfaceLayout } from '../utils/tableStageLayout';

const TableStage = ({
  shellView,
  tablePotSummary,
  seatRing,
  settlementOverlay = null,
  tableSizeClassName = 'w-[22rem] h-[22rem]',
  effectiveDisplayMode = 'pro',
  roomShellLayout = 'stacked',
  viewportWidth = 1280,
  tableDiameter = 320,
  seatGuides = [],
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const reducedMotion = useReducedMotion();
  const motionProfile = buildTacticalMotionProfile(effectiveDisplayMode, { reducedMotion });
  const roomCopy = theme.room;
  const primaryPotItem = tablePotSummary.items[0] || null;
  const secondaryPotItems = tablePotSummary.items.slice(1, 3);
  const tableSurfaceLayout = resolveTableSurfaceLayout({
    viewportWidth,
    tableDiameter,
  });
  const boardLayout = resolveCommunityCardLayout({
    viewportWidth,
    tableDiameter,
    tableProfile: tableSurfaceLayout.profile,
  });
  const stageLayoutClassName =
    roomShellLayout === 'three-column'
      ? 'table-stage-surface table-stage-surface--three-column'
      : roomShellLayout === 'split-stage'
      ? 'table-stage-surface table-stage-surface--split-stage'
      : 'table-stage-surface';
  const stagePulseClassName = shellView.stagePulseTone
    ? `table-stage-surface--${shellView.stagePulseTone}`
    : 'table-stage-surface--idle';

  return (
    <section className="poker-shell-panel poker-shell-panel--accent relative rounded-[2rem] px-4 py-5 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="poker-shell-kicker">{roomCopy.stageLabel}</div>
          <div className="mt-2 text-lg font-semibold text-white">{shellView.roomStateLabel}</div>
          <div className="mt-2 max-w-xl text-sm leading-6 text-slate-300">{roomCopy.stageCaption}</div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {tablePotSummary.items.map((item, index) => (
            <div
              key={`${item.label}-${index}`}
              className="poker-shell-stat-card rounded-2xl px-3 py-2 text-sm text-slate-100"
            >
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
              <div className="mt-1 font-semibold">{item.amount}</div>
            </div>
          ))}
        </div>
      </div>

      <div
        className={`${stageLayoutClassName} ${stagePulseClassName} table-stage-surface--${theme.mode} relative flex min-h-[34rem] items-center justify-center overflow-visible rounded-[2rem] px-4 py-6`}
        data-table-profile={tableSurfaceLayout.profile}
      >
        <div className="table-stage-atmosphere" aria-hidden="true" />

        <AnimatePresence initial={false} mode="popLayout">
          {primaryPotItem && (
            <motion.div
              key={`${primaryPotItem.label}-${primaryPotItem.amount}-${secondaryPotItems.map((item) => item.amount).join('-')}`}
              className="table-stage-pot-capsule"
              initial={motionProfile.stage.initial}
              animate={motionProfile.stage.animate}
              exit={motionProfile.stage.exit}
              transition={motionProfile.stage.transition}
            >
            <div className="table-stage-pot-capsule__kicker">{primaryPotItem.label}</div>
            <div className="table-stage-pot-capsule__amount">{primaryPotItem.amount}</div>
            {secondaryPotItems.length > 0 && (
              <div className="table-stage-pot-capsule__rail">
                {secondaryPotItems.map((item) => (
                  <span key={item.label} className="table-stage-pot-capsule__rail-item">
                    {item.label} {item.amount}
                  </span>
                ))}
              </div>
            )}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div
          className="table-stage-beacon"
          initial={motionProfile.cue.initial}
          animate={motionProfile.cue.animate}
          exit={motionProfile.cue.exit}
          transition={motionProfile.cue.transition}
        >
          <span className="table-stage-beacon__mode">{shellView.modeLabel}</span>
          <span className="table-stage-beacon__state">{shellView.roomStateLabel}</span>
          {shellView.phaseLabel && <span className="table-stage-beacon__phase">{shellView.phaseLabel}</span>}
          {shellView.currentTurnSeatLabel && <span className="table-stage-beacon__turn-seat">{shellView.currentTurnSeatLabel}</span>}
          <AnimatePresence initial={false} mode="wait">
            {shellView.stageActionLabel && (
              <motion.span
                key={`stage-cue-${shellView.stageActionLabel}`}
                className="table-stage-beacon__cue"
                initial={motionProfile.cue.initial}
                animate={motionProfile.cue.animate}
                exit={motionProfile.cue.exit}
                transition={motionProfile.cue.transition}
              >
                {shellView.stageActionLabel}
              </motion.span>
            )}
          </AnimatePresence>
          <AnimatePresence initial={false} mode="wait">
            {shellView.lastActionLabel && (
              <motion.span
                key={`last-action-${shellView.lastActionLabel}`}
                className="table-stage-beacon__last-action"
                initial={motionProfile.cue.initial}
                animate={motionProfile.cue.animate}
                exit={motionProfile.cue.exit}
                transition={motionProfile.cue.transition}
              >
                {shellView.lastActionLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="table-stage-core" data-table-profile={tableSurfaceLayout.profile}>
          <TableStageChrome
            viewportWidth={viewportWidth}
            tableDiameter={tableDiameter}
            seatGuides={seatGuides}
            tableProfile={tableSurfaceLayout.profile}
          />
          <div
            className={`poker-table table-stage-table-shell relative z-10 ${tableSizeClassName}`}
            data-table-profile={tableSurfaceLayout.profile}
            style={{
              width: `${tableSurfaceLayout.tableWidth}px`,
              height: `${tableSurfaceLayout.tableHeight}px`,
            }}
          >
            <div
              className="table-stage-board-tray absolute inset-0 flex items-center justify-center"
              data-table-profile={tableSurfaceLayout.profile}
              style={{
                width: `${boardLayout.trayWidth}px`,
                height: `${boardLayout.trayHeight}px`,
                borderRadius: tableSurfaceLayout.profile === 'phone-oval' ? '1.5rem' : '999px',
              }}
            >
              <CommunityCards boardLayout={boardLayout} />
            </div>
          </div>
        </div>

        {settlementOverlay}
        {seatRing}
      </div>
    </section>
  );
};

export default TableStage;
