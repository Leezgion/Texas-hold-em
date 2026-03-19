import React from 'react';

import ActionButtons from './ActionButtons';
import Card from './Card';
import { getDisplayModeTheme } from '../utils/productMode';
import { deriveProPlayerSummary } from '../view-models/gameViewModel';

const ActionDock = ({
  currentPlayer,
  currentPlayerView,
  gameStarted,
  canStartGame,
  onStartGame,
  gameState,
  currentPlayerId,
  players,
  effectiveDisplayMode,
  roomState,
}) => {
  if (!currentPlayer) {
    return null;
  }

  const handCards = Array.isArray(currentPlayer.hand) ? currentPlayer.hand : [];
  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const heroSummary = deriveProPlayerSummary(currentPlayer, {
    roomState,
    players,
    gameState,
  });

  return (
    <section className="poker-shell-panel poker-shell-panel--accent rounded-[1.75rem] px-4 py-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0 xl:w-72">
          <div className="poker-shell-kicker">{roomCopy.actionTitle}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.actionCaption}</div>
          <div className="mt-2 flex items-center gap-2">
            <div className="truncate text-xl font-semibold text-white">{currentPlayer.nickname || currentPlayer.id || '玩家'}</div>
            {currentPlayer.isHost && <span className="text-amber-300">👑</span>}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm">
            {heroSummary.seatLabel && (
              <span className="poker-shell-chip">
                {heroSummary.seatLabel}
                {heroSummary.positionLabel ? ` · ${heroSummary.positionLabel}` : ''}
              </span>
            )}
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-100">
              筹码 {Number(currentPlayer.chips) || 0}
            </span>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-slate-100">
              {currentPlayerView?.statusLabel || '等待中'}
            </span>
            {(Number(currentPlayer.currentBet) || 0) > 0 && (
              <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-3 py-1 text-sky-100">
                当前下注 {Number(currentPlayer.currentBet) || 0}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center gap-4">
          {gameStarted && handCards.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-4">
              {handCards.map((card, index) => (
                <Card key={index} card={card} size="large" />
              ))}
            </div>
          )}

          {!gameStarted && canStartGame && (
            <button
              type="button"
              onClick={onStartGame}
              className="mode-primary-button w-auto min-w-[14rem] px-8 py-4 text-lg"
            >
              {roomCopy.startButtonLabel}
            </button>
          )}

          {gameStarted && (
            <ActionButtons
              player={currentPlayer}
              gameState={gameState}
              currentPlayerId={currentPlayerId}
              players={players}
              effectiveDisplayMode={effectiveDisplayMode}
            />
          )}
        </div>
      </div>
    </section>
  );
};

export default ActionDock;
