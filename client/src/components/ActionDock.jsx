import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';

import ActionButtons from './ActionButtons';
import Card from './Card';
import { getDisplayModeTheme } from '../utils/productMode';
import { buildTacticalMotionProfile, resolveTacticalMotionViewport } from '../utils/tacticalMotion';
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
  viewportLayout,
  shellView,
  activeSupportPanel = null,
  onToggleSupportPanel = null,
}) => {
  if (!currentPlayer) {
    return null;
  }

  const theme = getDisplayModeTheme(effectiveDisplayMode);
  const reducedMotion = useReducedMotion();
  const motionProfile = buildTacticalMotionProfile(effectiveDisplayMode, {
    reducedMotion,
    viewport: resolveTacticalMotionViewport({ viewportModel: viewportLayout?.viewportModel }),
  });
  const roomCopy = theme.room;
  const supportLabels = theme.sheetLabels || {};
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
  const supportsSecondaryPanels =
    typeof onToggleSupportPanel === 'function' &&
    viewportLayout?.supportSurfaceModel &&
    viewportLayout.supportSurfaceModel !== 'rails-and-overlays';

  return (
    <section
      className="room-terminal-dock-panel poker-shell-panel poker-shell-panel--accent tactical-dock rounded-[1.75rem] px-4 py-4"
      data-viewport-model={viewportLayout?.viewportModel}
      data-height-class={viewportLayout?.heightClass}
      data-stage-density={viewportLayout?.stageDensity}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-hero-dock-placement={viewportLayout?.heroDockPlacement}
      data-hero-dock-priority={shellView?.heroDockPriority}
    >
      <div className="tactical-dock__grid">
        <div className="min-w-0">
          <div className="poker-shell-kicker">{roomCopy.actionTitle}</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">{roomCopy.actionCaption}</div>

          <motion.div
            className="tactical-dock__hero-panel"
            initial={motionProfile.stage.initial}
            animate={motionProfile.stage.animate}
            transition={motionProfile.stage.transition}
          >
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
              <AnimatePresence initial={false} mode="wait">
                {dockView.turnContextLabel && (
                  <motion.span
                    key={dockView.turnContextLabel}
                    className="tactical-dock__chip"
                    initial={motionProfile.turnChip.initial}
                    animate={motionProfile.turnChip.animate}
                    exit={motionProfile.turnChip.exit}
                    transition={motionProfile.turnChip.transition}
                  >
                    {dockView.turnContextLabel}
                  </motion.span>
                )}
              </AnimatePresence>
              {dockView.actionSummary && (
                <span className="tactical-dock__status-meta">
                  TO CALL {dockView.actionSummary.toCall} · POT {dockView.actionSummary.pot}
                </span>
              )}
            </div>
          </motion.div>

          {supportsSecondaryPanels ? (
            <div className="room-support-launcher">
              {[
                { key: 'players', label: supportLabels.players || 'Players' },
                { key: 'history', label: supportLabels.history || 'History' },
                { key: 'room', label: supportLabels.room || 'Room' },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  className={`room-support-launcher__button ${
                    activeSupportPanel === item.key ? 'room-support-launcher__button--active' : ''
                  }`}
                  onClick={() => onToggleSupportPanel(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
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
            <motion.div
              className="tactical-dock__action-frame"
              initial={motionProfile.stage.initial}
              animate={motionProfile.stage.animate}
              transition={motionProfile.stage.transition}
            >
              <ActionButtons
                player={currentPlayer}
                gameState={gameState}
                currentPlayerId={currentPlayerId}
                players={players}
                effectiveDisplayMode={effectiveDisplayMode}
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ActionDock;
