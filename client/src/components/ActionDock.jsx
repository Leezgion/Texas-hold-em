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
  canLeaveSeat = false,
  canRequestRebuy = false,
  onOpenRebuy = null,
  onLeaveSeat = null,
  onShare = null,
  onLeaveRoom = null,
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
  const isWaitingDockState = !gameStarted;
  const showsDecisionCenter = Boolean(
    dockView.startButtonLabel || handCards.length > 0 || gameStarted
  );
  const supportsSecondaryPanels =
    typeof onToggleSupportPanel === 'function' &&
    viewportLayout?.supportSurfacePolicyKey &&
    viewportLayout.supportSurfacePolicyKey !== 'ultrawide';
  const showsPrimaryQuickActions = supportsSecondaryPanels && viewportLayout?.headerActionModel !== 'toolbar';
  const showsInlineQuickActions =
    showsPrimaryQuickActions && !(gameStarted && viewportLayout?.viewportModel === 'phone-terminal');
  const showsApronRail = showsPrimaryQuickActions || supportsSecondaryPanels;
  const dockLayout = !showsDecisionCenter && showsApronRail ? 'waiting-apron' : showsApronRail ? 'decision-apron' : 'core-only';
  const heroPanelLayout = isWaitingDockState ? 'waiting-strip' : 'live-ribbon';
  const handCardSize = viewportLayout?.viewportModel === 'phone-terminal' ? 'small' : 'large';
  const quickActions = [
    canRequestRebuy && typeof onOpenRebuy === 'function'
      ? { key: 'rebuy', label: '补码', tone: 'success', onClick: onOpenRebuy }
      : null,
    canLeaveSeat && typeof onLeaveSeat === 'function'
      ? { key: 'leave-seat', label: '离座', tone: 'warning', onClick: onLeaveSeat }
      : null,
    typeof onShare === 'function' ? { key: 'share', label: '分享', tone: 'default', onClick: onShare } : null,
    typeof onLeaveRoom === 'function' ? { key: 'leave-room', label: '退出', tone: 'danger', onClick: onLeaveRoom } : null,
  ].filter(Boolean);

  return (
    <section
      className="room-terminal-dock-panel poker-shell-panel poker-shell-panel--accent tactical-dock tactical-dock--broadcast-cue tactical-dock--table-apron rounded-[1.45rem] px-3 py-3"
      data-viewport-model={viewportLayout?.viewportModel}
      data-height-class={viewportLayout?.heightClass}
      data-stage-density={viewportLayout?.stageDensity}
      data-support-surface-model={viewportLayout?.supportSurfaceModel}
      data-support-surface-policy={viewportLayout?.supportSurfacePolicyValue}
      data-support-surface-policy-key={viewportLayout?.supportSurfacePolicyKey}
      data-hero-dock-placement={viewportLayout?.heroDockPlacement}
      data-hero-dock-priority={shellView?.heroDockPriority}
      data-hero-dock-style={shellView?.heroDockStyle}
      data-hero-dock-density={shellView?.heroDockDensity}
      data-support-launcher-density={shellView?.supportLauncherDensity}
      data-stage-spacing={shellView?.stageSpacing}
      data-dock-presentation={viewportLayout?.dockPresentation}
      data-header-density={viewportLayout?.headerDensity}
      data-dock-state={isWaitingDockState ? 'waiting' : 'live'}
      data-dock-layout={dockLayout}
      data-hero-panel-layout={heroPanelLayout}
      data-has-center-stage={showsDecisionCenter ? 'true' : 'false'}
    >
      <div className="tactical-dock__grid">
        <div className="min-w-0 tactical-dock__hero-column">
          {isWaitingDockState ? <div className="poker-shell-kicker">{roomCopy.actionTitle}</div> : null}

          <motion.div
            className={`tactical-dock__hero-panel tactical-dock__hero-panel--broadcast-cue tactical-dock__hero-panel--${heroPanelLayout}`}
            initial={motionProfile.stage.initial}
            animate={motionProfile.stage.animate}
            transition={motionProfile.stage.transition}
          >
            <div className="tactical-dock__hero-header">
              <div className="min-w-0">
                <div className="tactical-dock__hero-name">{dockView.heroName}</div>
              </div>
              <div className="tactical-dock__hero-badges">
                {dockView.seatLabel && <span className="tactical-dock__chip">{dockView.seatLabel}</span>}
                {dockView.positionLabel && <span className="tactical-dock__chip">{dockView.positionLabel}</span>}
                {dockView.isHost && <span className="tactical-dock__chip tactical-dock__chip--accent">房主</span>}
              </div>
            </div>

            {isWaitingDockState ? (
              <div className="tactical-dock__waiting-strip">
                <div className="tactical-dock__waiting-metric">
                  <span className="tactical-dock__waiting-metric-label">筹码</span>
                  <span className="tactical-dock__waiting-metric-value">{dockView.chipsLabel}</span>
                </div>
                <div className="tactical-dock__waiting-metric">
                  <span className="tactical-dock__waiting-metric-label">下注</span>
                  <span className="tactical-dock__waiting-metric-value">{dockView.betLabel}</span>
                </div>
                <div className="tactical-dock__waiting-metric">
                  <span className="tactical-dock__waiting-metric-label">净额</span>
                  <span className="tactical-dock__waiting-metric-value">{dockView.netLabel}</span>
                </div>
              </div>
            ) : (
              <>
                <div className="tactical-dock__hero-ribbon">
                  <div className="tactical-dock__hero-metric-chip">
                    <span className="tactical-dock__hero-metric-label">筹码</span>
                    <span className="tactical-dock__hero-metric-value">{dockView.chipsLabel}</span>
                  </div>
                  <div className="tactical-dock__hero-metric-chip">
                    <span className="tactical-dock__hero-metric-label">下注</span>
                    <span className="tactical-dock__hero-metric-value">{dockView.betLabel}</span>
                  </div>
                  <div className="tactical-dock__hero-metric-chip">
                    <span className="tactical-dock__hero-metric-label">净额</span>
                    <span className="tactical-dock__hero-metric-value">{dockView.netLabel}</span>
                  </div>
                  <div className="tactical-dock__hero-metric-chip tactical-dock__hero-metric-chip--status">
                    <span className="tactical-dock__hero-metric-value">{dockView.statusLabel}</span>
                  </div>
                  <AnimatePresence initial={false} mode="wait">
                    {dockView.turnContextLabel && (
                      <motion.span
                        key={dockView.turnContextLabel}
                        className="tactical-dock__chip tactical-dock__turn-chip tactical-dock__turn-chip--broadcast-cue"
                        initial={motionProfile.turnChip.initial}
                        animate={motionProfile.turnChip.animate}
                        exit={motionProfile.turnChip.exit}
                        transition={motionProfile.turnChip.transition}
                      >
                        {dockView.turnContextLabel}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>

                {dockView.actionSummary && (
                  <div className="tactical-dock__hero-meta-strip">
                    <span>需跟注 {dockView.actionSummary.toCall.toLocaleString()}</span>
                    <span>底池 {dockView.actionSummary.pot.toLocaleString()}</span>
                  </div>
                )}
              </>
            )}
          </motion.div>
        </div>

        {showsDecisionCenter ? (
          <div className="tactical-dock__center">
            {gameStarted && handCards.length > 0 && (
              <div className="tactical-dock__cards">
                {handCards.map((card, index) => (
                  <Card key={index} card={card} size={handCardSize} />
                ))}
              </div>
            )}

            {dockView.startButtonLabel && (
              <button
                type="button"
                onClick={onStartGame}
                className="mode-primary-button w-auto min-w-[12rem] px-6 py-3 text-base"
              >
                {roomCopy.startButtonLabel || dockView.startButtonLabel}
              </button>
            )}

            {gameStarted && (
              <motion.div
                className="tactical-dock__action-frame tactical-dock__action-frame--table-console"
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
        ) : null}

        {showsApronRail ? (
          <div className="tactical-dock__apron-rail">
            {showsInlineQuickActions && quickActions.length > 0 ? (
              <div className="tactical-dock__quick-actions-block">
                <div className="poker-shell-kicker">快速操作</div>
                <div className="tactical-dock__quick-actions">
                  {quickActions.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      className={`tactical-dock__quick-action tactical-dock__quick-action--${item.tone}`}
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {supportsSecondaryPanels ? (
              <div className="room-support-launcher">
                {[
                  { key: 'players', label: supportLabels.players || '成员' },
                  { key: 'history', label: supportLabels.history || '牌局' },
                  { key: 'room', label: supportLabels.room || '房间' },
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
        ) : null}
      </div>
    </section>
  );
};

export default ActionDock;
