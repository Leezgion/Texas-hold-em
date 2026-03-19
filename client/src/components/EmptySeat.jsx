import { Plus } from 'lucide-react';
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { deriveRequestErrorFeedback, deriveSeatTakeFeedback } from '../view-models/gameViewModel';

const EmptySeat = ({ seatIndex, position, getPositionLabel, seatLabel, seatTone = 'open-seat', roomState }) => {
  const { takeSeat } = useGame();

  const handleTakeSeat = async () => {
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
      className="arena-seat-anchor"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className={`arena-seat-card arena-seat-card--empty arena-seat-card--${seatTone}`}>
        <div
          onClick={handleTakeSeat}
          className="arena-seat-empty-trigger group"
          title={`点击入座 (座位 ${seatIndex + 1})`}
        >
          <Plus
            size={18}
            className="text-slate-400 transition-colors group-hover:text-sky-300"
          />
        </div>
        <div className="arena-seat-card__seat-label mt-3">{seatLabel || (getPositionLabel ? getPositionLabel(seatIndex) : `座位 ${seatIndex + 1}`)}</div>
        <div className="arena-seat-card__empty-text">Open Seat</div>
      </div>
    </div>
  );
};

export default EmptySeat;
