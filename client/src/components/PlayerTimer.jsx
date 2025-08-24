import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const PlayerTimer = ({ timeRemaining, isCurrentTurn }) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  // 如果不是当前回合或没有时间，不显示计时器
  if (!isCurrentTurn || timeRemaining <= 0) {
    return null;
  }

  // 计算进度百分比
  const progressPercentage = (displayTime / 60) * 100;
  
  // 根据剩余时间确定颜色
  const getTimerColor = () => {
    if (displayTime > 30) return 'text-green-400 border-green-400';
    if (displayTime > 10) return 'text-yellow-400 border-yellow-400';
    return 'text-red-400 border-red-400';
  };

  const getProgressColor = () => {
    if (displayTime > 30) return 'bg-green-400';
    if (displayTime > 10) return 'bg-yellow-400';
    return 'bg-red-400';
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* 倒计时圆圈 */}
      <div className={`relative w-20 h-20 rounded-full border-4 ${getTimerColor()} bg-gray-800/90 backdrop-blur-sm flex items-center justify-center`}>
        {/* 进度圆圈 */}
        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 80 80">
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="opacity-20"
          />
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={`${2 * Math.PI * 34}`}
            strokeDashoffset={`${2 * Math.PI * 34 * (1 - progressPercentage / 100)}`}
            className={`transition-all duration-1000 ease-linear ${getProgressColor()}`}
          />
        </svg>
        
        {/* 时间数字 */}
        <div className="flex flex-col items-center z-10">
          <Clock size={16} className="mb-1" />
          <span className="text-lg font-bold font-mono">
            {displayTime}
          </span>
        </div>
      </div>
      
      {/* 提示文字 */}
      <div className="text-xs text-center bg-gray-800/90 backdrop-blur-sm px-3 py-1 rounded-lg border border-gray-600">
        <div className="text-white font-semibold">您的回合</div>
        <div className="text-gray-400">请选择行动</div>
      </div>
    </div>
  );
};

export default PlayerTimer;