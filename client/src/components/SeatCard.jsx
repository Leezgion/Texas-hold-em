import React from 'react';

import EmptySeat from './EmptySeat';
import { getPlayerDisplayName } from '../utils/playerIdentity';

const PHONE_LIVE_PLAQUE_TRANSFORMS = Object.freeze({
  'upper-left': 'translate(calc(-50% + 0.45rem), -50%)',
  'lower-left': 'translate(calc(-50% + 0.45rem), calc(-50% - 8.5rem))',
  'upper-right': 'translate(calc(-50% - 0.45rem), -50%)',
  'lower-right': 'translate(calc(-50% - 0.45rem), calc(-50% - 8.5rem))',
  'near-hero-right': 'translate(calc(-50% + 0.45rem), calc(-50% - 13.75rem))',
});

const TABLET_PORTRAIT_LIVE_PLAQUE_TRANSFORMS = Object.freeze({
  'top-left': 'translate(-50%, calc(-50% + 5.3rem))',
  top: 'translate(-50%, calc(-50% + 5.3rem))',
  'top-right': 'translate(-50%, calc(-50% + 5.3rem))',
  'lower-left': 'translate(-50%, calc(-50% - 3.6rem))',
  'lower-right': 'translate(-50%, calc(-50% - 3.6rem))',
  'near-hero-right': 'translate(calc(-50% + 0.35rem), calc(-50% - 13.25rem))',
});

const SeatCard = ({
  seat,
  tableProfile = null,
  roomState,
  gameState,
  gameStarted,
  viewportModel = null,
}) => {
  const resolvedTableProfile = tableProfile || seat.position?.profile || 'desktop-oval';
  const anchorZone = seat.anchorZone || seat.position?.anchorZone || 'table-flank';
  const anchorRole = seat.anchorRole || seat.position?.anchorRole || 'ring';
  const canonicalSlotIndex = Number.isInteger(seat.canonicalSlotIndex) ? seat.canonicalSlotIndex : null;
  const densityTier = seat.densityTier || 'compact-secondary';
  const visualRole = seat.visualRole || 'embedded-plaque';
  const plaqueDensityModel = seat.plaqueDensityModel || 'broadcast-compact';
  const plaqueMaterialModel = seat.plaqueMaterialModel || 'embedded-rail-display';
  const isPhoneViewport = viewportModel === 'phone-terminal';
  const isTabletPortraitPhoneOval = viewportModel === 'tablet-terminal' && resolvedTableProfile === 'phone-oval';
  const livePhonePlaqueTransform =
    gameStarted && resolvedTableProfile === 'phone-oval'
      ? isPhoneViewport
        ? PHONE_LIVE_PLAQUE_TRANSFORMS[anchorRole] || 'translate(-50%, -50%)'
        : isTabletPortraitPhoneOval
        ? TABLET_PORTRAIT_LIVE_PLAQUE_TRANSFORMS[anchorRole] || 'translate(-50%, -50%)'
        : 'translate(-50%, -50%)'
      : 'translate(-50%, -50%)';

  if (!seat.occupied) {
    return (
      <EmptySeat
        seatIndex={seat.seatIndex}
        position={seat.position}
        seatLabel={seat.seatLabel}
        seatAvailability={seat.seatAvailability}
        emptyText={seat.emptyText}
        seatTone={seat.seatTone}
        roomState={roomState}
        tableProfile={resolvedTableProfile}
        anchorZone={anchorZone}
        anchorRole={anchorRole}
        anchorSlotId={seat.anchorSlotId || null}
        visualRole={visualRole}
        densityTier={densityTier}
        plaqueDensityModel={plaqueDensityModel}
        plaqueMaterialModel={plaqueMaterialModel}
      />
    );
  }

  const player = seat.player || {};
  const displayName = seat.isCurrentPlayer
    ? '我'
    : getPlayerDisplayName(player, {
        fallback: player.isHost ? '房主' : '玩家',
      });
  const showHostBadge = Boolean(player.isHost) && displayName !== '房主';
  const currentBet = Number(player.currentBet) || 0;
  const hasNet = typeof seat.netLabel === 'string' && seat.netLabel !== '0';
  const seatToneClassName = `arena-seat-plaque--${seat.seatTone || 'occupied-live'}`;
  const usesPhoneSeatPresentation = isPhoneViewport && gameStarted && resolvedTableProfile === 'phone-oval';
  const phoneActionLabel = player.folded
    ? '弃牌'
    : player.allIn
    ? '全下'
    : seat.isCurrentTurn
    ? '行动'
    : seat.statusLabel || '在局';
  const phoneAvatarLabel = displayName.trim().slice(0, 1).toUpperCase() || 'P';

  return (
    <div
      className={`arena-seat-plaque-anchor arena-seat-plaque-anchor--broadcast-response ${
        seat.isCurrentTurn ? 'arena-seat-plaque-anchor--current-turn arena-seat-plaque-anchor--broadcast-turn-cue' : ''
      }`}
      data-table-profile={resolvedTableProfile}
      data-anchor-zone={anchorZone}
      data-anchor-role={anchorRole}
      data-anchor-slot-id={seat.anchorSlotId || null}
      data-canonical-slot-index={canonicalSlotIndex}
      data-visual-role={visualRole}
      data-density-tier={densityTier}
      data-plaque-density-model={plaqueDensityModel}
      data-plaque-material-model={plaqueMaterialModel}
      data-is-current-player={seat.isCurrentPlayer ? 'true' : 'false'}
      style={{
        left: `calc(50% + ${seat.position.x}px)`,
        top: `calc(50% + ${seat.position.y}px)`,
        transform: livePhonePlaqueTransform,
      }}
    >
      <div
        className={`arena-seat-plaque arena-seat-plaque--broadcast-response arena-seat-plaque--${plaqueMaterialModel} ${seatToneClassName} arena-seat-plaque--${densityTier} ${
          seat.isCurrentTurn ? 'arena-seat-plaque--current-turn arena-seat-plaque--broadcast-turn-cue' : ''
        } ${seat.isActiveTimer ? 'arena-seat-plaque--active-timer' : ''} ${player.folded ? 'arena-seat-plaque--folded' : ''}`}
        data-table-profile={resolvedTableProfile}
        data-anchor-zone={anchorZone}
        data-anchor-role={anchorRole}
        data-anchor-slot-id={seat.anchorSlotId || null}
        data-canonical-slot-index={canonicalSlotIndex}
        data-visual-role={visualRole}
        data-density-tier={densityTier}
        data-plaque-density-model={plaqueDensityModel}
        data-plaque-material-model={plaqueMaterialModel}
        data-is-current-player={seat.isCurrentPlayer ? 'true' : 'false'}
        data-phone-seat-presentation={usesPhoneSeatPresentation ? 'poker-app-badge' : 'plaque'}
      >
        {usesPhoneSeatPresentation && (
          <>
            <span className="arena-seat-plaque__phone-action-tag">{phoneActionLabel}</span>
            <div className="arena-seat-plaque__phone-avatar" aria-hidden="true">
              {phoneAvatarLabel}
            </div>
            <div className="arena-seat-plaque__phone-name" title={displayName}>
              {displayName}
            </div>
            <div className="arena-seat-plaque__phone-stack">{seat.chipsLabel || '0'}</div>
            {currentBet > 0 && (
              <span className="arena-seat-plaque__phone-bet-chip">下注 {currentBet.toLocaleString()}</span>
            )}
          </>
        )}

        <div className="arena-seat-plaque__header">
          <div className="min-w-0">
            <div className="arena-seat-plaque__meta-row">
              <div className="arena-seat-plaque__seat-label">{seat.seatLabel}</div>
              {seat.positionLabel && <span className="arena-seat-plaque__badge arena-seat-plaque__badge--ghost">{seat.positionLabel}</span>}
            </div>
            <div className="arena-seat-plaque__name" title={displayName}>
              {displayName}
            </div>
          </div>
          <div className="arena-seat-plaque__badge-row">
            {showHostBadge && <span className="arena-seat-plaque__badge">房主</span>}
          </div>
        </div>

        <div className="arena-seat-plaque__stack-row">
          <span className="arena-seat-plaque__stack">{seat.chipsLabel || '0'}</span>
          <div className="arena-seat-plaque__status-strip">
            {currentBet > 0 && <span className="arena-seat-plaque__bet">下注 {currentBet}</span>}
            {hasNet && <span className="arena-seat-plaque__net">{seat.netLabel}</span>}
          </div>
        </div>

        <div className="arena-seat-plaque__status-row">
          <span className="arena-seat-plaque__status">{seat.statusLabel}</span>
        </div>

        {seat.isCurrentTurn && (
          <span
            className="arena-seat-plaque__turn-glow arena-seat-plaque__turn-glow--broadcast-turn-cue"
            aria-hidden="true"
            data-anchor-slot-id={seat.anchorSlotId || null}
            data-canonical-slot-index={canonicalSlotIndex}
            data-anchor-role={anchorRole}
            data-anchor-zone={anchorZone}
          />
        )}
      </div>
    </div>
  );
};

export default SeatCard;
