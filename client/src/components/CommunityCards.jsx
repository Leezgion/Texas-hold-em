import Card from './Card';
import React, { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const CommunityCards = () => {
  const { gameState } = useGame();
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const [previousPhase, setPreviousPhase] = useState('preflop');

  // 监听游戏阶段变化，触发翻牌动画
  useEffect(() => {
    if (!gameState || !gameState.phase) return;

    const currentPhase = gameState.phase;
    
    // 检测阶段变化
    if (currentPhase !== previousPhase) {
      let cardsToAnimate = [];
      
      // 根据新阶段确定要翻转的牌
      switch (currentPhase) {
        case 'flop':
          cardsToAnimate = [0, 1, 2]; // 翻牌：翻转前3张
          break;
        case 'turn':
          cardsToAnimate = [3]; // 转牌：翻转第4张
          break;
        case 'river':
          cardsToAnimate = [4]; // 河牌：翻转第5张
          break;
      }

      // 逐张翻牌动画
      if (cardsToAnimate.length > 0) {
        cardsToAnimate.forEach((cardIndex, i) => {
          setTimeout(() => {
            setAnimatingCards(prev => new Set([...prev, cardIndex]));
            
            // TODO: 在这里可以添加翻牌音效
            // playCardFlipSound();
            
            // 动画完成后移除动画状态
            setTimeout(() => {
              setAnimatingCards(prev => {
                const newSet = new Set(prev);
                newSet.delete(cardIndex);
                return newSet;
              });
            }, 600); // 翻牌动画持续时间
          }, i * 200); // 每张牌间隔200ms
        });
      }

      setPreviousPhase(currentPhase);
    }
  }, [gameState?.phase, previousPhase]);

  if (!gameState || !gameState.communityCards) {
    return (
      <div className="flex justify-center space-x-3">
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="poker-card community back"
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
        return '翻牌圈';
      case 'turn':
        return '转牌圈';
      case 'river':
        return '河牌圈';
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
      {/* 阶段标题 */}
      <div className="mb-4">
        <div className="text-lg font-bold text-yellow-400 mb-1">{getPhaseText()}</div>
        <div className="w-16 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 mx-auto rounded-full"></div>
      </div>

      {/* 公共牌区域 */}
      <div className="community-cards-area">
        <div className="flex justify-center space-x-3 mb-4">
          {[0, 1, 2, 3, 4].map((cardIndex) => {
            const card = communityCards[cardIndex];
            const isVisible = cardIndex < visibleCards.length;
            const isAnimating = animatingCards.has(cardIndex);
            
            return (
              <div
                key={cardIndex}
                className={`card-container ${isAnimating ? 'flip-animation' : ''}`}
                style={{
                  perspective: '1000px',
                }}
              >
                <div className={`card-flipper ${isVisible && !isAnimating ? 'flipped' : ''}`}>
                  {/* 背面 */}
                  <div className="card-face card-back">
                    <div className="poker-card community back"></div>
                  </div>
                  
                  {/* 正面 */}
                  <div className="card-face card-front">
                    {card ? (
                      <Card card={card} size="community" />
                    ) : (
                      <div className="poker-card community back"></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底池信息 */}
        {gameState.pot > 0 && (
          <div className="bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-lg border border-gray-600 inline-block">
            <div className="text-sm text-gray-300">底池</div>
            <div className="text-lg font-bold text-green-400">{gameState.pot}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCards;
