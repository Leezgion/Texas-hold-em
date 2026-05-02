import React from 'react';

const SliderInput = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  className = '',
  density = 'default',
  showLabels = true,
  showSteps = true,
  showValue = true,
  colorScheme = 'gold', // 'gold', 'blue', 'green', 'risk'
  formatValue = (val) => val,
  formatLabel = (val) => val,
  quickButtons = [],
  onQuickSelect = null,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  const isCompact = density === 'compact';
  const rootClassName = isCompact ? 'space-y-2.5' : 'space-y-4';
  const valueClassName = isCompact ? 'text-xl' : 'text-2xl';
  
  const getColorScheme = () => {
    switch (colorScheme) {
      case 'blue':
        return {
          track: '#3b82f6',
          button: 'border-blue-500 bg-blue-500/20 text-blue-400',
          buttonHover: 'hover:border-blue-400 hover:bg-blue-500/30'
        };
      case 'green':
        return {
          track: '#10b981',
          button: 'border-green-500 bg-green-500/20 text-green-400',
          buttonHover: 'hover:border-green-400 hover:bg-green-500/30'
        };
      case 'risk':
        return {
          track: '#ef4444',
          button: 'border-red-500 bg-red-500/20 text-red-300',
          buttonHover: 'hover:border-amber-300 hover:bg-red-500/30'
        };
      default: // gold
        return {
          track: '#f59e0b',
          button: 'border-poker-gold bg-poker-gold/20 text-poker-gold',
          buttonHover: 'hover:border-yellow-400 hover:bg-poker-gold/30'
        };
    }
  };

  const colors = getColorScheme();

  return (
    <div className={`${rootClassName} ${className}`}>
      {/* 滑块 */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value))}
          disabled={disabled}
          className={`w-full rounded-lg appearance-none cursor-pointer slider ${isCompact ? 'h-2.5' : 'h-3'}`}
          style={{
            background: `linear-gradient(to right, ${colors.track} 0%, ${colors.track} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
        
        {/* 刻度标签 */}
        {showLabels && (
          <div className={`flex justify-between text-gray-400 ${isCompact ? 'mt-1.5 text-[11px]' : 'mt-2 text-xs'}`}>
            <span>{formatLabel(min)}</span>
            {showSteps && max > min * 2 && (
              <span>{formatLabel(Math.floor((min + max) / 2))}</span>
            )}
            <span>{formatLabel(max)}</span>
          </div>
        )}
        
        {/* 步进说明 */}
        {showSteps && step > 1 && (
          <div className={`text-center text-gray-500 ${isCompact ? 'mt-1.5 text-[11px]' : 'mt-2 text-xs'}`}>
            步进: {formatLabel(step)}
          </div>
        )}
      </div>

      {/* 当前值显示 */}
      {showValue && (
        <div className="text-center">
          <div className={`${valueClassName} mb-1 font-bold text-poker-gold`}>
            {formatValue(value)}
          </div>
        </div>
      )}

      {/* 快捷按钮 */}
      {quickButtons.length > 0 && onQuickSelect && (
        <div className={`grid gap-2 ${quickButtons.length <= 3 ? 'grid-cols-3' : quickButtons.length <= 5 ? 'grid-cols-5' : 'grid-cols-6'}`}>
          {quickButtons.map((buttonValue, index) => (
            <button
              key={index}
              type="button"
              onClick={() => onQuickSelect(buttonValue)}
              className={`py-2 px-2 rounded-lg border transition-colors duration-200 text-xs font-medium ${
                value === buttonValue 
                  ? colors.button
                  : `border-gray-600 text-gray-300 ${colors.buttonHover}`
              }`}
              disabled={disabled}
            >
              {formatLabel(buttonValue)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SliderInput;
