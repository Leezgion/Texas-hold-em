import { Plus } from 'lucide-react';
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { deriveRequestErrorFeedback, deriveSeatTakeFeedback } from '../view-models/gameViewModel';

const EmptySeat = ({
  seatIndex,
  position,
  getPositionLabel,
  seatLabel,
  seatAvailability = 'open',
  emptyText = null,
  seatTone = 'open-seat',
  roomState,
  tableProfile = 'desktop-oval',
  anchorZone = 'table-flank',
  anchorRole = 'ring',
  anchorSlotId = null,
  visualRole = 'embedded-plaque',
  densityTier = 'compact-secondary',
  plaqueDensityModel = 'broadcast-compact',
  plaqueMaterialModel = 'embedded-rail-display',
}) => {
  const { takeSeat, seatRequestPending } = useGame();
  const resolvedSeatLabel =
    seatLabel ||
    (seatAvailability === 'closed'
      ? '保留位'
      : getPositionLabel
      ? getPositionLabel(seatIndex)
      : `座位 ${seatIndex + 1}`);
  const resolvedEmptyText = emptyText || (seatAvailability === 'closed' ? '本桌未开放' : '可入座');

  const handleTakeSeat = async () => {
    if (seatRequestPending) {
      return;
    }

    try {
      const result = await takeSeat(seatIndex);
      const notice = deriveSeatTakeFeedback({ ...result, roomState });
      window.dispatchEvent(
        new CustomEvent(notice.channel, {
          detail: notice.detail,
        })
      );
    } catch (error) {
      const notice = deriveRequestErrorFeedback({
        scope: 'takeSeat',
        fallbackPrefix: '入座失败',
        error,
      });
      window.dispatchEvent(new CustomEvent(notice.channel, { detail: notice.detail }));
    }
  };

  return (
    <div
      className="arena-seat-plaque-anchor"
      data-table-profile={tableProfile}
      data-anchor-zone={anchorZone}
      data-anchor-role={anchorRole}
      data-anchor-slot-id={anchorSlotId}
      data-visual-role={visualRole}
      data-density-tier={densityTier}
      data-plaque-density-model={plaqueDensityModel}
      data-plaque-material-model={plaqueMaterialModel}
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className={`arena-seat-plaque arena-seat-plaque--empty arena-seat-plaque--${plaqueMaterialModel} arena-seat-plaque--${seatTone} arena-seat-plaque--${densityTier}`}
        data-table-profile={tableProfile}
        data-anchor-zone={anchorZone}
        data-anchor-role={anchorRole}
        data-anchor-slot-id={anchorSlotId}
        data-visual-role={visualRole}
        data-density-tier={densityTier}
        data-plaque-density-model={plaqueDensityModel}
        data-plaque-material-model={plaqueMaterialModel}
      >
        {seatAvailability === 'closed' ? (
          <div className="arena-seat-plaque__empty-seal" aria-hidden="true">
            -
          </div>
        ) : (
          <button
            type="button"
            onClick={handleTakeSeat}
            className="arena-seat-plaque__empty-trigger arena-seat-plaque__empty-trigger--compact group"
            disabled={seatRequestPending}
            aria-label={`入座 ${resolvedSeatLabel}`}
            title={`点击入座 (座位 ${seatIndex + 1})`}
          >
            <Plus
              size={18}
              className="text-slate-400 transition-colors group-hover:text-sky-300"
            />
          </button>
        )}
        <div
          className={`arena-seat-plaque__empty-copy${
            seatAvailability === 'closed' ? ' arena-seat-plaque__empty-copy--closed' : ''
          }`}
        >
          <div className="arena-seat-plaque__seat-label">{resolvedSeatLabel}</div>
          <div className="arena-seat-plaque__empty-text">{resolvedEmptyText}</div>
        </div>
      </div>
    </div>
  );
};

export default EmptySeat;
