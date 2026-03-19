import React, { useEffect, useState } from 'react';

import { getDisplayModeTheme } from '../utils/productMode';
import { getLatestHandSummary } from '../view-models/handHistoryViewModel';

const SettlementOverlay = ({ roomState, gameState, currentPlayer, currentPlayerId, onReveal, effectiveDisplayMode = 'pro' }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(0);

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

  if (roomState !== 'settling') {
    return null;
  }

  const latestSummary = getLatestHandSummary(gameState?.handHistory || []);
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const isProMode = effectiveDisplayMode === 'pro';
  const canReveal =
    gameState?.revealPolicy === 'free_reveal_after_hand'
      ? Boolean(currentPlayer?.inHand)
      : gameState?.eligibleRevealPlayerIds?.includes(currentPlayerId);

  return (
    <div className="settlement-sheet">
      <div className="settlement-sheet__header">
        <div>
          <div className="settlement-sheet__kicker">{roomCopy.latestHandLabel}</div>
          <div className="settlement-sheet__title">{latestSummary?.title || '本手已结束'}</div>
        </div>
        <div className="settlement-sheet__countdown">{remainingSeconds}s</div>
      </div>

      {latestSummary?.lines?.[0] && (
        <div className="settlement-sheet__spotlight">
          {latestSummary.lines[0]}
        </div>
      )}

      {(isProMode || effectiveDisplayMode === 'study') && latestSummary?.boardLabel && (
        <div className="settlement-sheet__board">
          <span className="settlement-sheet__board-label">Board</span>
          <span>{latestSummary.boardLabel}</span>
        </div>
      )}

      {latestSummary?.lines?.length > 0 && (
        <div className="settlement-sheet__lines">
          {latestSummary.lines.slice(1, 5).map((line, index) => (
            <div key={`${latestSummary.handNumber}-${index}`} className="settlement-sheet__line">
              {line}
            </div>
          ))}
        </div>
      )}

      {canReveal && (
        <div className="settlement-sheet__actions">
          <button
            type="button"
            onClick={() => onReveal('hide')}
            className="settlement-sheet__button settlement-sheet__button--ghost"
          >
            不亮牌
          </button>
          <button
            type="button"
            onClick={() => onReveal('show_one', 0)}
            className="settlement-sheet__button settlement-sheet__button--info"
          >
            亮左牌
          </button>
          <button
            type="button"
            onClick={() => onReveal('show_one', 1)}
            className="settlement-sheet__button settlement-sheet__button--info"
          >
            亮右牌
          </button>
          <button
            type="button"
            onClick={() => onReveal('show_all')}
            className="settlement-sheet__button settlement-sheet__button--success"
          >
            全亮
          </button>
        </div>
      )}
    </div>
  );
};

export default SettlementOverlay;
