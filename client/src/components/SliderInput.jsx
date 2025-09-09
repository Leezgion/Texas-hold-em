import React from 'react';

const SliderInput = ({
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled = false,
  className = '',
  showLabels = true,
  showSteps = true,
  showValue = true,
  colorScheme = 'gold', // 'gold', 'blue', 'green'
  formatValue = (val) => val,
  formatLabel = (val) => val,
  quickButtons = [],
  onQuickSelect = null,
}) => {
  const percentage = ((value - min) / (max - min)) * 100;
  
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
      case 'purple':
        return {
          track: '#a855f7',
          button: 'border-purple-500 bg-purple-500/20 text-purple-400',
          buttonHover: 'hover:border-purple-400 hover:bg-purple-500/30'
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
    <div className={`space-y-4 ${className}`}>
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
          className="w-full h-3 rounded-lg appearance-none cursor-pointer slider"
          style={{
            background: `linear-gradient(to right, ${colors.track} 0%, ${colors.track} ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
        />
        
        {/* 刻度标签 */}
        {showLabels && (
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{formatLabel(min)}</span>
            {showSteps && max > min * 2 && (
              <span>{formatLabel(Math.floor((min + max) / 2))}</span>
            )}
            <span>{formatLabel(max)}</span>
          </div>
        )}
        
        {/* 步进说明 */}
        {showSteps && step > 1 && (
          <div className="text-center text-xs text-gray-500 mt-2">
            步进: {formatLabel(step)}
          </div>
        )}
      </div>

      {/* 当前值显示 */}
      {showValue && (
        <div className="text-center">
          <div className="text-2xl font-bold text-poker-gold mb-1">
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
