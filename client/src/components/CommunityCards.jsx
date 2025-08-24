import Card from './Card';
import React from 'react';
import { useGame } from '../contexts/GameContext';

const CommunityCards = () => {
  const { gameState } = useGame();

  if (!gameState || !gameState.communityCards) {
    return (
      <div className="flex space-x-2">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="poker-card back"
          ></div>
        ))}
      </div>
    );
  }

  const { communityCards, phase } = gameState;

  const getPhaseText = () => {
    switch (phase) {
      case 'preflop':
        return '等待翻牌';
      case 'flop':
        return '翻牌';
      case 'turn':
        return '转牌';
      case 'river':
        return '河牌';
      case 'showdown':
        return '摊牌';
      default:
        return '';
    }
  };

  const getVisibleCards = () => {
    switch (phase) {
      case 'preflop':
        return [];
      case 'flop':
        return communityCards.slice(0, 3);
      case 'turn':
        return communityCards.slice(0, 4);
      case 'river':
      case 'showdown':
        return communityCards;
      default:
        return [];
    }
  };

  const visibleCards = getVisibleCards();

  return (
    <div className="text-center">
      {/* 公共牌 */}
      <div className="flex justify-center space-x-3 mb-2">
        {visibleCards.map((card, index) => (
          <Card
            key={index}
            card={card}
            size="community"
          />
        ))}

        {/* 未发出的牌 */}
        {[1, 2, 3, 4, 5].slice(visibleCards.length).map((index) => (
          <div
            key={`back-${index}`}
            className="poker-card community back"
          ></div>
        ))}
      </div>

      {/* 阶段说明 */}
      <div className="text-sm text-gray-300">{getPhaseText()}</div>
    </div>
  );
};

export default CommunityCards;
