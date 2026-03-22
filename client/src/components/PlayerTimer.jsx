import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

const PlayerTimer = ({ timeRemaining, isCurrentTurn }) => {
  const [displayTime, setDisplayTime] = useState(timeRemaining);

  useEffect(() => {
    setDisplayTime(timeRemaining);
  }, [timeRemaining]);

  if (!isCurrentTurn || timeRemaining <= 0) {
    return null;
  }

  const progressPercentage = (displayTime / 60) * 100;

  const tone = (() => {
    if (displayTime > 30) return 'stable';
    if (displayTime > 10) return 'warning';
    return 'danger';
  })();

  return (
    <div className="table-action-timer" data-timer-tone={tone}>
      <div className="table-action-timer__dial" aria-label={`剩余 ${displayTime} 秒`}>
        <svg className="table-action-timer__ring" viewBox="0 0 80 80" aria-hidden="true">
          <circle
            cx="40"
            cy="40"
            r="34"
            stroke="currentColor"
            strokeWidth="4"
            fill="transparent"
            className="table-action-timer__ring-track"
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
            className="table-action-timer__ring-progress"
          />
        </svg>

        <div className="table-action-timer__dial-content">
          <Clock size={16} className="table-action-timer__icon" />
          <span className="table-action-timer__value">{displayTime}</span>
        </div>
      </div>

      <div className="table-action-timer__prompt">
        <div className="table-action-timer__prompt-title">您的回合</div>
        <div className="table-action-timer__prompt-copy">请在时限内完成本手动作</div>
      </div>
    </div>
  );
};

export default PlayerTimer;
