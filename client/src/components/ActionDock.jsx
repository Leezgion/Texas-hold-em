import React from 'react';

import ActionButtons from './ActionButtons';
import Card from './Card';
import { getDisplayModeTheme } from '../utils/productMode';
import { deriveActionDockView } from '../view-models/gameViewModel';

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

  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const roomCopy = theme.room;
  const dockView = deriveActionDockView({
    currentPlayer,
    currentPlayerView,
    gameStarted,
    canStartGame,
    gameState,
    players,
    roomState,
  });
  const handCards = dockView?.handCards || [];

  return (
    <section className="poker-shell-panel poker-shell-panel--accent tactical-dock rounded-[1.75rem] px-4 py-4">
      <div className="tactical-dock__grid">
        <div className="min-w-0">
          <div className="poker-shell-kicker">{roomCopy.actionTitle}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.actionCaption}</div>

          <div className="tactical-dock__hero-panel">
            <div className="tactical-dock__hero-header">
              <div className="min-w-0">
                <div className="tactical-dock__hero-kicker">Hero Seat</div>
                <div className="truncate text-xl font-semibold text-white">{dockView.heroName}</div>
              </div>
              <div className="flex items-center gap-2">
                {dockView.positionLabel && <span className="tactical-dock__chip">{dockView.positionLabel}</span>}
                {dockView.isHost && <span className="tactical-dock__chip tactical-dock__chip--accent">HOST</span>}
              </div>
            </div>

            <div className="tactical-dock__hero-stats">
              {dockView.seatLabel && (
                <div className="tactical-dock__stat">
                  <span className="tactical-dock__stat-label">Seat</span>
                  <span className="tactical-dock__stat-value">{dockView.seatLabel}</span>
                </div>
              )}
              <div className="tactical-dock__stat">
                <span className="tactical-dock__stat-label">Chips</span>
                <span className="tactical-dock__stat-value">{dockView.chipsLabel}</span>
              </div>
              <div className="tactical-dock__stat">
                <span className="tactical-dock__stat-label">Bet</span>
                <span className="tactical-dock__stat-value">{dockView.betLabel}</span>
              </div>
              <div className="tactical-dock__stat">
                <span className="tactical-dock__stat-label">Net</span>
                <span className="tactical-dock__stat-value">{dockView.netLabel}</span>
              </div>
            </div>

            <div className="tactical-dock__status-row">
              <span className="tactical-dock__status">{dockView.statusLabel}</span>
              {dockView.actionSummary && (
                <span className="tactical-dock__status-meta">
                  TO CALL {dockView.actionSummary.toCall} · POT {dockView.actionSummary.pot}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="tactical-dock__center">
          {gameStarted && handCards.length > 0 && (
            <div className="tactical-dock__cards">
              {handCards.map((card, index) => (
                <Card key={index} card={card} size="large" />
              ))}
            </div>
          )}

          {dockView.startButtonLabel && (
            <button
              type="button"
              onClick={onStartGame}
              className="mode-primary-button w-auto min-w-[14rem] px-8 py-4 text-lg"
            >
              {roomCopy.startButtonLabel || dockView.startButtonLabel}
            </button>
          )}

          {gameStarted && (
            <div className="tactical-dock__action-frame">
              <ActionButtons
                player={currentPlayer}
                gameState={gameState}
                currentPlayerId={currentPlayerId}
                players={players}
                effectiveDisplayMode={effectiveDisplayMode}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ActionDock;
