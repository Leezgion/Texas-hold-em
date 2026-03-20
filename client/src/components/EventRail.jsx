import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import HandHistoryDrawer from './HandHistoryDrawer';
import Leaderboard from './Leaderboard';
import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
import { buildHandHistoryView } from '../view-models/handHistoryViewModel';

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
  const summaryLineLimit = effectiveDisplayMode === 'study' ? 6 : effectiveDisplayMode === 'club' ? 2 : 4;
  const historyLineLimit = effectiveDisplayMode === 'study' ? 6 : 4;
  const ContainerTag = presentation === 'rail' ? 'aside' : 'div';

  return (
    <ContainerTag
      className="room-terminal-support-rail tactical-rail tactical-rail--event"
      data-viewport-model={viewportLayout?.viewportModel}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
      data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
      data-surface-variant={presentation}
    >
      <section className="poker-shell-panel tactical-rail__panel tactical-rail__panel--event rounded-[1.75rem] p-4 sm:p-5">
        <div className="tactical-rail__header">
          <div>
            <div className="poker-shell-kicker">{roomCopy.eventTitle}</div>
            <div className="tactical-rail__title">Event Console</div>
          </div>
          <span className="tactical-rail__pill">{eventRailView.historyCount} 手牌</span>
        </div>
        <div className="tactical-rail__lead">{roomCopy.eventCaption}</div>

        <AnimatePresence initial={false} mode="wait">
          {eventRailView.latestSummary && (
          <motion.div
            key={`latest-hand-${eventRailView.latestSummary.handNumber}`}
            className="tactical-event-card"
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
            {eventRailView.headlineLine && (
              <div className="tactical-event-card__spotlight">{eventRailView.headlineLine}</div>
            )}
            {eventRailView.latestSummary.totalLine && (
              <div className="tactical-event-card__total">{eventRailView.latestSummary.totalLine}</div>
            )}
            {eventRailView.boardLabel && (
              <div className="tactical-event-card__board">
                <span className="tactical-event-card__board-label">Board</span>
                <span>{eventRailView.boardLabel}</span>
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
          surfaceVariant={presentation === 'rail' ? 'rail' : 'panel'}
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
                    <div className="tactical-history-card__board">Board {summary.boardLabel}</div>
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
