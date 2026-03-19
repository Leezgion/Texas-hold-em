import Card from './Card';
import { useState, useEffect } from 'react';
import { useGame } from '../contexts/GameContext';

const CommunityCards = ({ boardLayout = null }) => {
  const { gameState } = useGame();
  const [animatingCards, setAnimatingCards] = useState(new Set());
  const [previousPhase, setPreviousPhase] = useState('preflop');
  const resolvedBoardLayout = boardLayout || {
    trayWidth: null,
    trayHeight: null,
    cardWidth: 52,
    cardHeight: 72,
    gap: 8,
    cardDensity: 'regular',
    phaseVisible: true,
  };
  const compactBoardLayout = !resolvedBoardLayout.phaseVisible;
  const cardStyle = {
    width: `${resolvedBoardLayout.cardWidth}px`,
    height: `${resolvedBoardLayout.cardHeight}px`,
  };

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
            setAnimatingCards((prev) => new Set([...prev, cardIndex]));

            // TODO: 在这里可以添加翻牌音效
            // playCardFlipSound();

            // 动画完成后移除动画状态
            setTimeout(() => {
              setAnimatingCards((prev) => {
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
      <div
        className="flex justify-center"
        style={{ gap: `${resolvedBoardLayout.gap}px` }}
      >
        {[1, 2, 3, 4, 5].map((index) => (
          <div
            key={index}
            className="poker-card community back"
            style={cardStyle}
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
      {resolvedBoardLayout.phaseVisible && (
        <div className="mb-3">
          <div className="mb-1 text-sm font-bold text-yellow-400 sm:text-lg">{getPhaseText()}</div>
          <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 sm:w-16"></div>
        </div>
      )}

      {/* 公共牌区域 */}
      <div
        className="community-cards-area"
        style={
          compactBoardLayout
            ? {
                padding: 0,
                background: 'transparent',
              }
            : undefined
        }
      >
        <div
          className={`flex justify-center ${resolvedBoardLayout.phaseVisible ? 'mb-4' : 'mb-0'}`}
          style={{ gap: `${resolvedBoardLayout.gap}px` }}
        >
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
                    <div
                      className="poker-card community back"
                      style={cardStyle}
                    ></div>
                  </div>

                  {/* 正面 */}
                  <div className="card-face card-front">
                    {card ? (
                      <Card
                        card={card}
                        size="community"
                        density={resolvedBoardLayout.cardDensity}
                        style={cardStyle}
                      />
                    ) : (
                      <div
                        className="poker-card community back"
                        style={cardStyle}
                      ></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 底池信息 */}
        {gameState.pot > 0 && resolvedBoardLayout.phaseVisible && (
          <div className="bg-gray-800/80 backdrop-blur-xs px-4 py-2 rounded-lg border border-gray-600 inline-block">
            <div className="text-sm text-gray-300">底池</div>
            <div className="text-lg font-bold text-green-400">{gameState.pot}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCards;
