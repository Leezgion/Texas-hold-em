import React from 'react';

import Leaderboard from './Leaderboard';
import { getDisplayModeTheme } from '../utils/productMode';
import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

const EventRail = ({
  eventRailView,
  records = [],
  players,
  roomState,
  gameState,
  currentPlayerId,
  effectiveDisplayMode,
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const historyItems = buildHandHistoryView(records).slice(0, roomCopy.historyPreviewCount);
  const summaryLineLimit = effectiveDisplayMode === 'study' ? 6 : effectiveDisplayMode === 'club' ? 2 : 4;
  const historyLineLimit = effectiveDisplayMode === 'study' ? 6 : 4;

  return (
    <aside className="flex flex-col gap-4">
      <section className="poker-shell-panel rounded-[1.75rem] p-4">
        <div className="poker-shell-kicker">{roomCopy.eventTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.eventCaption}</div>

        {eventRailView.latestSummary && (
          <div className="mt-4 rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{roomCopy.latestHandLabel}</div>
                <div className="mt-2 text-lg font-semibold text-white">{eventRailView.latestSummary.title}</div>
              </div>
              {eventRailView.latestSummary.reason && <div className="text-xs text-slate-400">{eventRailView.latestSummary.reason}</div>}
            </div>
            {eventRailView.latestSummary.boardLabel && (
              <div className="mt-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-300">
                Board {eventRailView.latestSummary.boardLabel}
              </div>
            )}
            <div className="mt-3 space-y-2">
              {eventRailView.latestSummary.lines.slice(0, summaryLineLimit).map((line, index) => (
                <div key={`latest-${index}`} className="rounded-xl bg-black/20 px-3 py-2 text-sm text-slate-100">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          {eventRailView.livePotSummary.items.map((item) => (
            <div key={item.label} className="poker-shell-stat-card rounded-2xl px-3 py-3">
              <div className="text-[10px] uppercase tracking-[0.18em] text-slate-400">{item.label}</div>
              <div className="mt-2 text-lg font-semibold text-white">{item.amount}</div>
              {item.detail && <div className="mt-1 text-xs text-slate-400">{item.detail}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="poker-shell-panel rounded-[1.75rem] p-4">
        <div className="poker-shell-kicker">{roomCopy.stacksTitle}</div>
        <div className="mt-2 text-sm leading-6 text-slate-300">
          {effectiveDisplayMode === 'study' ? '净赢亏和剩余筹码一起看，更适合回看。' : '座位、筹码和净额保持同步。'}
        </div>
        <Leaderboard
          players={players}
          roomState={roomState}
          gameState={gameState}
          currentPlayerId={currentPlayerId}
          effectiveDisplayMode={effectiveDisplayMode}
        />
      </section>

      <section className="poker-shell-panel rounded-[1.75rem] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="poker-shell-kicker">{roomCopy.historyTitle}</div>
          <div className="text-xs text-slate-400">{eventRailView.historyCount} 手牌</div>
        </div>
        <div className="max-h-[22rem] space-y-3 overflow-y-auto pr-1">
          {historyItems.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-slate-400">暂无牌局记录</div>
          ) : (
            historyItems.map((summary) => (
              <div key={summary.handNumber} className="rounded-[1.25rem] border border-white/10 bg-white/5 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-semibold text-white">{summary.title}</div>
                  {summary.reason && <div className="text-[11px] text-slate-400">{summary.reason}</div>}
                </div>
                {summary.boardLabel && (
                  <div className="mt-2 text-xs text-slate-400">Board {summary.boardLabel}</div>
                )}
                <div className="mt-3 space-y-2">
                  {summary.lines.slice(0, historyLineLimit).map((line, index) => (
                    <div key={`${summary.handNumber}-${index}`} className="rounded-xl bg-black/20 px-3 py-2 text-sm text-slate-100">
                      {line}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </aside>
  );
};

export default EventRail;
