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
    <aside className="tactical-rail tactical-rail--event">
      <section className="poker-shell-panel tactical-rail__panel tactical-rail__panel--event rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.eventTitle}</div>
            <div className="tactical-rail__title">Event Console</div>
          </div>
          <span className="tactical-rail__pill">{eventRailView.historyCount} 手牌</span>
        </div>
        <div className="tactical-rail__lead">{roomCopy.eventCaption}</div>

        {eventRailView.latestSummary && (
          <div className="tactical-event-card">
            <div className="tactical-event-card__header">
              <div>
                <div className="tactical-event-card__kicker">{roomCopy.latestHandLabel}</div>
                <div className="tactical-event-card__title">{eventRailView.latestSummary.title}</div>
              </div>
              {eventRailView.latestSummary.reason && (
                <div className="tactical-event-card__reason">{eventRailView.latestSummary.reason}</div>
              )}
            </div>
            {eventRailView.spotlightLine && (
              <div className="tactical-event-card__spotlight">{eventRailView.spotlightLine}</div>
            )}
            {eventRailView.boardLabel && (
              <div className="tactical-event-card__board">
                <span className="tactical-event-card__board-label">Board</span>
                <span>{eventRailView.boardLabel}</span>
              </div>
            )}
            <div className="tactical-event-card__tape">
              {eventRailView.latestSummary.lines
                .slice(eventRailView.spotlightLine ? 1 : 0, summaryLineLimit + (eventRailView.spotlightLine ? 1 : 0))
                .map((line, index) => (
                <div key={`latest-${index}`} className="tactical-event-card__tape-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="tactical-rail__metric-grid">
          {eventRailView.livePotSummary.items.map((item) => (
            <div key={item.label} className="tactical-rail__metric">
              <div className="tactical-rail__metric-label">{item.label}</div>
              <div className="tactical-rail__metric-value">{item.amount}</div>
              {item.detail && <div className="tactical-rail__metric-detail">{item.detail}</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="poker-shell-panel tactical-rail__panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.stacksTitle}</div>
            <div className="tactical-rail__title">Stack Ledger</div>
          </div>
        </div>
        <div className="tactical-rail__lead">
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

      <section className="poker-shell-panel tactical-rail__panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.historyTitle}</div>
            <div className="tactical-rail__title">Hand Tape</div>
          </div>
          <div className="tactical-rail__pill">{eventRailView.historyCount} 手牌</div>
        </div>
        <div className="tactical-history-tape">
          {historyItems.length === 0 ? (
            <div className="tactical-history-card tactical-history-card--empty">暂无牌局记录</div>
          ) : (
            historyItems.map((summary) => (
              <div key={summary.handNumber} className="tactical-history-card">
                <div className="tactical-history-card__header">
                  <div className="tactical-history-card__title">{summary.title}</div>
                  {summary.reason && <div className="tactical-history-card__reason">{summary.reason}</div>}
                </div>
                {summary.boardLabel && (
                  <div className="tactical-history-card__board">Board {summary.boardLabel}</div>
                )}
                <div className="tactical-history-card__lines">
                  {summary.lines.slice(0, historyLineLimit).map((line, index) => (
                    <div key={`${summary.handNumber}-${index}`} className="tactical-history-card__line">
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
