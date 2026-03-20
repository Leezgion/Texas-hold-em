import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
import { deriveRequestErrorFeedback } from '../view-models/gameViewModel';
import { getLatestHandSummary } from '../view-models/handHistoryViewModel';

const SettlementOverlay = ({
  roomState,
  gameState,
  currentPlayer,
  currentPlayerId,
  onReveal,
  effectiveDisplayMode = 'pro',
  revealRequestPending = false,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(() => window.innerWidth);
  const reducedMotion = useReducedMotion();
  const motionProfile = buildTacticalMotionProfile(effectiveDisplayMode, {
    reducedMotion,
    viewport: resolveTacticalMotionViewport({ viewportWidth }),
  });

  useEffect(() => {
    const handleResize = () => setViewportWidth(window.innerWidth);

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (roomState !== 'settling' || !gameState?.settlementWindowEndsAt) {
      setRemainingSeconds(0);
      return undefined;
    }

    const updateCountdown = () => {
      const remainingMs = Math.max(0, gameState.settlementWindowEndsAt - Date.now());
      setRemainingSeconds(Math.ceil(remainingMs / 1000));
    };

    updateCountdown();
    const timer = window.setInterval(updateCountdown, 250);
    return () => window.clearInterval(timer);
  }, [roomState, gameState?.settlementWindowEndsAt]);

  const latestSummary = getLatestHandSummary(gameState?.handHistory || []);
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const isProMode = effectiveDisplayMode === 'pro';
  const canReveal =
    gameState?.revealPolicy === 'free_reveal_after_hand'
      ? Boolean(currentPlayer?.inHand)
      : gameState?.eligibleRevealPlayerIds?.includes(currentPlayerId);

  const handleRevealSelection = async (mode, cardIndex = null) => {
    if (revealRequestPending) {
      return;
    }

    try {
      await onReveal(mode, cardIndex);
    } catch (error) {
      if (typeof window === 'undefined') {
        return;
      }

      const notice = deriveRequestErrorFeedback({
        scope: 'revealHand',
        fallbackPrefix: '亮牌失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    }
  };

  return (
    <AnimatePresence initial={false}>
      {roomState === 'settling' ? (
        <motion.div
          key={`settlement-${latestSummary?.handNumber || 'latest'}`}
          className="settlement-sheet"
          initial={motionProfile.settlement.initial}
          animate={motionProfile.settlement.animate}
          exit={motionProfile.settlement.exit}
          transition={motionProfile.settlement.transition}
        >
          <div className="settlement-sheet__header">
            <div>
              <div className="settlement-sheet__kicker">{roomCopy.latestHandLabel}</div>
              <div className="settlement-sheet__title">{latestSummary?.title || '本手已结束'}</div>
            </div>
            <motion.div
              className="settlement-sheet__countdown"
              key={`countdown-${remainingSeconds}`}
              initial={motionProfile.cue.initial}
              animate={motionProfile.cue.animate}
              exit={motionProfile.cue.exit}
              transition={motionProfile.cue.transition}
            >
              {remainingSeconds}s
            </motion.div>
          </div>

          {latestSummary?.headlineLine && (
            <motion.div
              className="settlement-sheet__spotlight"
              initial={motionProfile.cue.initial}
              animate={motionProfile.cue.animate}
              transition={motionProfile.cue.transition}
            >
              {latestSummary.headlineLine}
            </motion.div>
          )}

          {latestSummary?.totalLine && (
            <motion.div
              className="settlement-sheet__total"
              initial={motionProfile.cue.initial}
              animate={motionProfile.cue.animate}
              transition={{ ...motionProfile.cue.transition, delay: motionProfile.settlement.staggerChildren }}
            >
              {latestSummary.totalLine}
            </motion.div>
          )}

          {(isProMode || effectiveDisplayMode === 'study') && latestSummary?.boardLabel && (
            <motion.div
              className="settlement-sheet__board"
              initial={motionProfile.cue.initial}
              animate={motionProfile.cue.animate}
              transition={{ ...motionProfile.cue.transition, delay: motionProfile.settlement.staggerChildren * 2 }}
            >
              <span className="settlement-sheet__board-label">Board</span>
              <span>{latestSummary.boardLabel}</span>
            </motion.div>
          )}

          {latestSummary?.lines?.length > 0 && (
            <div className="settlement-sheet__lines">
              {[...latestSummary.scoreboardLines.slice(1, 5), ...latestSummary.detailLines.slice(0, 2)].map((line, index) => (
                <motion.div
                  key={`${latestSummary.handNumber}-${index}`}
                  className="settlement-sheet__line"
                  initial={motionProfile.cue.initial}
                  animate={motionProfile.cue.animate}
                  transition={{
                    ...motionProfile.settlement.lineTransition,
                    delay: motionProfile.settlement.staggerChildren * (index + 2),
                  }}
                >
                  {line}
                </motion.div>
              ))}
            </div>
          )}

          {canReveal && (
            <div className="settlement-sheet__actions">
              <button
                type="button"
                onClick={() => handleRevealSelection('hide')}
                disabled={revealRequestPending}
                className="settlement-sheet__button settlement-sheet__button--ghost"
              >
                不亮牌
              </button>
              <button
                type="button"
                onClick={() => handleRevealSelection('show_one', 0)}
                disabled={revealRequestPending}
                className="settlement-sheet__button settlement-sheet__button--info"
              >
                亮左牌
              </button>
              <button
                type="button"
                onClick={() => handleRevealSelection('show_one', 1)}
                disabled={revealRequestPending}
                className="settlement-sheet__button settlement-sheet__button--info"
              >
                亮右牌
              </button>
              <button
                type="button"
                onClick={() => handleRevealSelection('show_all')}
                disabled={revealRequestPending}
                className="settlement-sheet__button settlement-sheet__button--success"
              >
                全亮
              </button>
            </div>
          )}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default SettlementOverlay;
