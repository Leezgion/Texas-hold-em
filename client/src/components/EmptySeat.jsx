import { Plus } from 'lucide-react';
import React from 'react';
import { useGame } from '../contexts/GameContext';
import { deriveRequestErrorFeedback, deriveSeatTakeFeedback } from '../view-models/gameViewModel';

const EmptySeat = ({ seatIndex, position, getPositionLabel, seatLabel, roomState }) => {
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
      className="player-seat player-seat--compact empty-seat"
      style={{
        left: `calc(50% + ${position.x}px)`,
        top: `calc(50% + ${position.y}px)`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="text-center relative">
        {/* 空座位显示 */}
        <div
          onClick={handleTakeSeat}
          className="w-12 h-12 bg-gray-700/50 backdrop-blur-sm rounded-lg border-2 border-dashed border-gray-500 hover:border-blue-400 hover:bg-gray-600/50 transition-all duration-200 cursor-pointer flex items-center justify-center group"
          title={`点击入座 (座位 ${seatIndex + 1})`}
        >
          <Plus
            size={18}
            className="text-gray-400 group-hover:text-blue-400 transition-colors"
          />
        </div>

        {/* 座位号/位置标记 */}
        <div className="text-xs text-gray-500 mt-1">{seatLabel || (getPositionLabel ? getPositionLabel(seatIndex) : `座位 ${seatIndex + 1}`)}</div>
      </div>
    </div>
  );
};

export default EmptySeat;
