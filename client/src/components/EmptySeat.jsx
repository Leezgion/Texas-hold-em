import { Plus } from 'lucide-react';
import React from 'react';
import { useGame } from '../contexts/GameContext';

const EmptySeat = ({ seatIndex, position, getPositionLabel }) => {
  const { takeSeat, gameStarted } = useGame();

  const handleTakeSeat = () => {
    if (gameStarted) {
      // 游戏进行中，提示等待下轮
      const confirmed = window.confirm('游戏正在进行中，入座后需要等待本轮结束才能参与游戏。是否确认入座？');
      if (confirmed) {
        takeSeat(seatIndex);
      }
    } else {
      // 游戏未开始，直接入座
      takeSeat(seatIndex);
    }
  };

  return (
    <div
      className="player-seat empty-seat compact"
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
        <div className="text-xs text-gray-500 mt-1">{getPositionLabel ? getPositionLabel(seatIndex) : `座位 ${seatIndex + 1}`}</div>
      </div>
    </div>
  );
};

export default EmptySeat;
