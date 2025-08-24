import React from 'react';

const Card = ({ card, size = 'normal', className = '' }) => {
  if (!card) return null;

  const getSuitColor = () => {
    return card.isRed ? 'text-red-600' : 'text-black';
  };

  const getSuitSymbol = () => {
    const symbols = {
      hearts: '♥',
      diamonds: '♦',
      clubs: '♣',
      spades: '♠',
    };
    return symbols[card.suit] || '';
  };

  const getRankDisplay = () => {
    if (card.rank === 14) return 'A';
    if (card.rank === 13) return 'K';
    if (card.rank === 12) return 'Q';
    if (card.rank === 11) return 'J';
    return card.rank.toString();
  };

  const getSizeClass = () => {
    switch (size) {
      case 'small': return 'small';
      case 'community': return 'community';
      case 'large': return 'large';
      default: return '';
    }
  };

  const getTextSizes = () => {
    switch (size) {
      case 'small':
        return {
          corner: 'text-xs',
          center: 'text-sm',
          padding: 'top-0.5 left-0.5 bottom-0.5 right-0.5'
        };
      case 'community':
        return {
          corner: 'text-sm',
          center: 'text-2xl',
          padding: 'top-1 left-1 bottom-1 right-1'
        };
      default:
        return {
          corner: 'text-xs',
          center: 'text-xl',
          padding: 'top-1 left-1 bottom-1 right-1'
        };
    }
  };

  const textSizes = getTextSizes();

  return (
    <div className={`poker-card ${getSizeClass()} ${getSuitColor()} ${className} relative`}>
      {/* 简化设计：只显示中央的点数和花色 */}
      <div className="flex flex-col items-center justify-center h-full">
        {/* 点数 - 大而清晰 */}
        <div className={`font-bold ${
          size === 'small' ? 'text-lg' : 
          size === 'community' ? 'text-4xl' : 
          size === 'large' ? 'text-3xl' :
          'text-2xl'
        }`}>
          {getRankDisplay()}
        </div>
        
        {/* 花色 - 适中大小，清晰可见 */}
        <div className={`${
          size === 'small' ? 'text-base' : 
          size === 'community' ? 'text-3xl' : 
          size === 'large' ? 'text-2xl' :
          'text-xl'
        } -mt-1`}>
          {getSuitSymbol()}
        </div>
      </div>
    </div>
  );
};

export default Card;
