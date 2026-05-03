import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import HandHistoryDrawer from './HandHistoryDrawer';
import Leaderboard from './Leaderboard';
import { getDisplayModeTheme } from '../utils/productMode';
import { sanitizeDisplayName } from '../utils/playerIdentity';
import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

function formatReplayAction(action = {}, players = []) {
  const actor = players.find((player) => player?.id === action.playerId) || null;
  const actorName = sanitizeDisplayName(actor?.nickname || action.playerId, {
    fallback: '玩家',
    isHost: Boolean(actor?.isHost),
  });
  const amount = Number(action.totalBet ?? action.amount) || 0;

  switch (action.action) {
    case 'fold':
      return `${actorName} 弃牌`;
    case 'check':
      return `${actorName} 过牌`;
    case 'call':
      return `${actorName} 跟注 ${amount.toLocaleString()}`;
    case 'raise':
      return `${actorName} 加注到 ${amount.toLocaleString()}`;
    case 'allin':
      return `${actorName} All-in ${amount.toLocaleString()}`;
    case 'small_blind':
      return `${actorName} 小盲 ${amount.toLocaleString()}`;
    case 'big_blind':
      return `${actorName} 大盲 ${amount.toLocaleString()}`;
    default:
      return `${actorName} ${action.action || '行动'}${amount ? ` ${amount.toLocaleString()}` : ''}`;
  }
}

function buildReplayActionRows(record = {}, summary = null, players = []) {
  const streetEntries = Object.entries(record.actionsByStreet || {});
  const actionRows = streetEntries.flatMap(([street, actions]) =>
    (Array.isArray(actions) ? actions : []).map((action, index) => ({
      key: `${street}-${index}`,
      tone: action.action === 'fold' ? 'muted' : action.action === 'allin' || action.action === 'raise' ? 'risk' : 'neutral',
      street: street.toUpperCase(),
      text: formatReplayAction(action, players),
    }))
  );

  if (actionRows.length > 0) {
    return actionRows;
  }

  return [summary?.headlineLine, ...(summary?.scoreboardLines || []), ...(summary?.detailLines || [])]
    .filter(Boolean)
    .slice(0, 8)
    .map((line, index) => ({
      key: `summary-${index}`,
      tone: line.includes('+') ? 'win' : line.includes('-') ? 'loss' : 'neutral',
      street: index === 0 ? '结果' : '明细',
      text: line,
    }));
}

const HandReplayPanel = ({
  records = [],
  summaries = [],
  players = [],
  motionProfile,
  lineLimit,
}) => {
  const [activeSummaryIndex, setActiveSummaryIndex] = useState(0);
  const recordsByHand = useMemo(
    () => new Map(records.map((record) => [record.handNumber, record])),
    [records]
  );

  useEffect(() => {
    setActiveSummaryIndex((currentValue) => {
      if (summaries.length === 0) {
        return 0;
      }

      return Math.min(currentValue, summaries.length - 1);
    });
  }, [summaries.length]);

  const activeSummary = summaries[activeSummaryIndex] || null;
  const activeRecord = activeSummary ? recordsByHand.get(activeSummary.handNumber) || null : null;
  const replayRows = buildReplayActionRows(activeRecord || {}, activeSummary, players).slice(0, lineLimit);
  const canMovePrevious = activeSummaryIndex > 0;
  const canMoveNext = activeSummaryIndex < summaries.length - 1;

  return (
    <section className="poker-shell-panel tactical-rail__panel event-rail__replay rounded-[1.35rem] p-3">
      <div className="event-rail__replay-header">
        <div>
          <div className="poker-shell-kicker">牌局回放</div>
          <div className="tactical-rail__title">{activeSummary?.title || '暂无手牌'}</div>
        </div>
        <span className="tactical-rail__pill">
          {summaries.length > 0 ? `${activeSummaryIndex + 1}/${summaries.length}` : '0'}
        </span>
      </div>

      <div className="event-rail__replay-controls">
        <button type="button" disabled={!canMovePrevious} onClick={() => setActiveSummaryIndex((value) => Math.max(0, value - 1))}>
          上一手
        </button>
        <button type="button" disabled={!canMoveNext} onClick={() => setActiveSummaryIndex((value) => Math.min(summaries.length - 1, value + 1))}>
          下一手
        </button>
      </div>

      {activeSummary?.boardLabel && (
        <div className="event-rail__board-line">
          <span>公牌</span>
          <strong>{activeSummary.boardLabel}</strong>
        </div>
      )}

      <div className="event-rail__action-list">
        {replayRows.length === 0 ? (
          <div className="event-rail__action-row event-rail__action-row--empty">暂无动作记录</div>
        ) : (
          replayRows.map((row, index) => (
            <motion.div
              key={row.key}
              className="event-rail__action-row"
              data-action-tone={row.tone}
              initial={motionProfile.handTape.initial}
              animate={motionProfile.handTape.animate}
              transition={{
                ...motionProfile.handTape.transition,
                delay: motionProfile.handTape.staggerChildren * index,
              }}
            >
              <span className="event-rail__action-street">{row.street}</span>
              <span className="event-rail__action-copy">{row.text}</span>
            </motion.div>
          ))
        )}
      </div>
    </section>
  );
};

const EventRail = ({
  eventRailView,
  records = [],
  players,
  roomState,
  gameState,
  currentPlayerId,
  effectiveDisplayMode,
  viewportLayout,
  presentation = 'rail',
}) => {
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const reducedMotion = useReducedMotion();
  const motionProfile = buildTacticalMotionProfile(effectiveDisplayMode, {
    reducedMotion,
    viewport: resolveTacticalMotionViewport({ viewportModel: viewportLayout?.viewportModel }),
  });
  const roomCopy = theme.room;
  const historyItems = buildHandHistoryView(records).slice(0, roomCopy.historyPreviewCount);
  const replaySummaries = buildHandHistoryView(records);
  const summaryLineLimit = effectiveDisplayMode === 'study' ? 5 : effectiveDisplayMode === 'club' ? 2 : 3;
  const historyLineLimit = effectiveDisplayMode === 'study' ? 6 : 4;
  const centerPriority = eventRailView.livePotSummary?.centerPriority || 'board-pot-street';
  const ContainerTag = presentation === 'rail' ? 'aside' : 'div';
  const supportLauncherDensity = viewportLayout?.supportLauncherDensity || 'regular';

  if (presentation === 'side-replay-drawer') {
    return (
      <ContainerTag
        className="room-terminal-support-rail tactical-rail tactical-rail--event"
        data-viewport-model={viewportLayout?.viewportModel}
        data-support-surface-model={viewportLayout?.supportSurfaceModel}
        data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
        data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
        data-surface-variant={presentation}
        data-event-presentation={presentation === 'side-replay-drawer' ? 'hand-replay' : presentation}
        data-support-launcher-density={supportLauncherDensity}
      >
        <HandReplayPanel
          records={records}
          summaries={replaySummaries}
          players={players}
          motionProfile={motionProfile}
          lineLimit={effectiveDisplayMode === 'study' ? 14 : 10}
        />
      </ContainerTag>
    );
  }

  return (
    <ContainerTag
      className="room-terminal-support-rail tactical-rail tactical-rail--event"
      data-viewport-model={viewportLayout?.viewportModel}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
      data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
      data-surface-variant={presentation}
      data-event-presentation={presentation === 'side-replay-drawer' ? 'hand-replay' : presentation}
      data-support-launcher-density={supportLauncherDensity}
    >
      <section className="poker-shell-panel tactical-rail__panel tactical-rail__panel--event rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.eventTitle}</div>
            <div className="tactical-rail__title">最近结果</div>
          </div>
          <span className="tactical-rail__pill">{eventRailView.historyCount} 手牌</span>
        </div>
        <div className="tactical-rail__lead">{roomCopy.eventCaption}</div>

        <AnimatePresence initial={false} mode="wait">
          {eventRailView.latestSummary && (
          <motion.div
            key={`latest-hand-${eventRailView.latestSummary.handNumber}`}
            className="tactical-event-card tactical-event-card--supportive"
            data-center-priority={centerPriority}
            initial={motionProfile.eventCard.initial}
            animate={motionProfile.eventCard.animate}
            exit={motionProfile.eventCard.exit}
            transition={motionProfile.eventCard.transition}
          >
            <div className="tactical-event-card__header">
              <div>
                <div className="tactical-event-card__kicker">{roomCopy.latestHandLabel}</div>
                <div className="tactical-event-card__title">{eventRailView.latestSummary.title}</div>
              </div>
              {eventRailView.latestSummary.reason && (
                <div className="tactical-event-card__reason">{eventRailView.latestSummary.reason}</div>
              )}
            </div>
            {eventRailView.boardLabel && (
              <div className="tactical-event-card__board">
                <span className="tactical-event-card__board-label">公牌</span>
                <span>{eventRailView.boardLabel}</span>
              </div>
            )}
            {eventRailView.latestSummary.totalLine && (
              <div className="tactical-event-card__total">{eventRailView.latestSummary.totalLine}</div>
            )}
            {eventRailView.headlineLine && (
              <div className="tactical-event-card__spotlight tactical-event-card__spotlight--subtle">
                {eventRailView.headlineLine}
              </div>
            )}
            <div className="tactical-event-card__tape">
              {eventRailView.scoreboardLines
                .slice(1, summaryLineLimit + 1)
                .map((line, index) => (
                  <motion.div
                    key={`latest-${index}`}
                    className="tactical-event-card__tape-line"
                    initial={motionProfile.handTape.initial}
                    animate={motionProfile.handTape.animate}
                    transition={{
                      ...motionProfile.handTape.transition,
                      delay: motionProfile.handTape.staggerChildren * (index + 1),
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
              {eventRailView.latestSummary.detailLines
                .slice(0, Math.max(0, summaryLineLimit - 1))
                .map((line, index) => (
                  <motion.div
                    key={`latest-detail-${index}`}
                    className="tactical-event-card__detail-line"
                    initial={motionProfile.handTape.initial}
                    animate={motionProfile.handTape.animate}
                    transition={{
                      ...motionProfile.handTape.transition,
                      delay: motionProfile.handTape.staggerChildren * (index + summaryLineLimit + 1),
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
        </AnimatePresence>

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
            <div className="tactical-rail__title">筹码与净额</div>
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
          surfaceVariant={presentation === 'rail' ? 'rail' : 'panel'}
        />
      </section>

      <section className="poker-shell-panel tactical-rail__panel rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.historyTitle}</div>
            <div className="tactical-rail__title">时间线</div>
          </div>
          <div className="tactical-rail__pill">{eventRailView.historyCount} 手牌</div>
        </div>
        {presentation === 'rail' ? (
          <div className="tactical-history-tape">
            {historyItems.length === 0 ? (
              <div className="tactical-history-card tactical-history-card--empty">暂无牌局记录</div>
            ) : (
              historyItems.map((summary, summaryIndex) => (
                <motion.div
                  key={summary.handNumber}
                  className="tactical-history-card"
                  initial={motionProfile.eventCard.initial}
                  animate={motionProfile.eventCard.animate}
                  transition={{
                    ...motionProfile.eventCard.transition,
                    delay: motionProfile.handTape.staggerChildren * summaryIndex,
                  }}
                >
                  <div className="tactical-history-card__header">
                    <div className="tactical-history-card__title">{summary.title}</div>
                    {summary.reason && <div className="tactical-history-card__reason">{summary.reason}</div>}
                  </div>
                  {summary.boardLabel && (
                    <div className="tactical-history-card__board">公牌 {summary.boardLabel}</div>
                  )}
                  {summary.headlineLine && (
                    <div className="tactical-history-card__headline">{summary.headlineLine}</div>
                  )}
                  <div className="tactical-history-card__lines">
                    {[summary.totalLine, ...summary.scoreboardLines.slice(1), ...summary.detailLines]
                      .filter(Boolean)
                      .slice(0, historyLineLimit)
                      .map((line, index) => (
                        <motion.div
                          key={`${summary.handNumber}-${index}`}
                          className="tactical-history-card__line"
                          initial={motionProfile.handTape.initial}
                          animate={motionProfile.handTape.animate}
                          transition={{
                            ...motionProfile.handTape.transition,
                            delay: motionProfile.handTape.staggerChildren * (index + 1),
                          }}
                        >
                          {line}
                        </motion.div>
                      ))}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <HandHistoryDrawer
            records={records}
            effectiveDisplayMode={effectiveDisplayMode}
            surfaceVariant="embedded"
            defaultOpen
            viewportModel={viewportLayout?.viewportModel}
          />
        )}
      </section>
    </ContainerTag>
  );
};

export default EventRail;
