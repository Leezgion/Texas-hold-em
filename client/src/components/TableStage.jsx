import React from 'react';

import CommunityCards from './CommunityCards';
import { getDisplayModeTheme } from '../utils/productMode';

const TableStage = ({
  shellView,
  tablePotSummary,
  seatRing,
  settlementOverlay = null,
  tableSizeClassName = 'w-[22rem] h-[22rem]',
  effectiveDisplayMode = 'pro',
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;

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

      <div className={`table-stage-surface table-stage-surface--${theme.mode} relative flex min-h-[34rem] items-center justify-center overflow-visible rounded-[2rem] px-4 py-6`}>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_55%)]" />
        <div className={`poker-table relative z-10 ${tableSizeClassName}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <CommunityCards />
          </div>
        </div>

        {settlementOverlay}
        {seatRing}
      </div>
    </section>
  );
};

export default TableStage;
