import React, { useEffect, useState } from 'react';

import { getLatestHandSummary } from '../view-models/handHistoryViewModel';

const SettlementOverlay = ({ roomState, gameState, currentPlayer, currentPlayerId, onReveal }) => {
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
  const canReveal =
    gameState?.revealPolicy === 'free_reveal_after_hand'
      ? Boolean(currentPlayer?.inHand)
      : gameState?.eligibleRevealPlayerIds?.includes(currentPlayerId);

  return (
    <div className="absolute left-1/2 top-24 z-20 w-[min(32rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-poker-gold/40 bg-black/70 px-4 py-3 text-white shadow-2xl backdrop-blur-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm uppercase tracking-[0.2em] text-poker-gold">结算中</div>
          <div className="mt-1 text-lg font-semibold">{latestSummary?.title || '本手已结束'}</div>
        </div>
        <div className="rounded-full border border-white/20 px-3 py-1 text-sm text-gray-200">{remainingSeconds}s</div>
      </div>

      {latestSummary?.lines?.[0] && (
        <div className="mt-3 rounded-xl border border-poker-gold/30 bg-poker-gold/10 px-3 py-2 text-sm font-semibold text-poker-gold">
          {latestSummary.lines[0]}
        </div>
      )}

      {latestSummary?.lines?.length > 0 && (
        <div className="mt-3 space-y-1 text-sm text-gray-200">
          {latestSummary.lines.slice(1, 5).map((line, index) => (
            <div
              key={`${latestSummary.handNumber}-${index}`}
              className="rounded-lg bg-white/5 px-3 py-2"
            >
              {line}
            </div>
          ))}
        </div>
      )}

      {canReveal && (
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => onReveal('hide')}
            className="rounded-lg border border-gray-500 bg-gray-800 px-3 py-2 text-sm text-gray-100 transition-colors hover:bg-gray-700"
          >
            不亮牌
          </button>
          <button
            onClick={() => onReveal('show_one', 0)}
            className="rounded-lg border border-blue-500 bg-blue-600/20 px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-blue-600/30"
          >
            亮左牌
          </button>
          <button
            onClick={() => onReveal('show_one', 1)}
            className="rounded-lg border border-blue-500 bg-blue-600/20 px-3 py-2 text-sm text-blue-100 transition-colors hover:bg-blue-600/30"
          >
            亮右牌
          </button>
          <button
            onClick={() => onReveal('show_all')}
            className="rounded-lg border border-green-500 bg-green-600/20 px-3 py-2 text-sm text-green-100 transition-colors hover:bg-green-600/30"
          >
            全亮
          </button>
        </div>
      )}
    </div>
  );
};

export default SettlementOverlay;
