import { useState, useEffect } from 'react';

import Card from './Card';
import { useGame } from '../contexts/GameContext';

const CommunityCards = ({ boardLayout = null, tableProfile = null }) => {
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
  const resolvedTableProfile = tableProfile || resolvedBoardLayout.tableProfile || 'desktop-oval';
  const compactBoardLayout = !resolvedBoardLayout.phaseVisible;
  const cardStyle = {
    width: `${resolvedBoardLayout.cardWidth}px`,
    height: `${resolvedBoardLayout.cardHeight}px`,
  };

  useEffect(() => {
    if (!gameState || !gameState.phase) return;

    const currentPhase = gameState.phase;

    if (currentPhase !== previousPhase) {
      let cardsToAnimate = [];

      switch (currentPhase) {
        case 'flop':
          cardsToAnimate = [0, 1, 2];
          break;
        case 'turn':
          cardsToAnimate = [3];
          break;
        case 'river':
          cardsToAnimate = [4];
          break;
      }

      if (cardsToAnimate.length > 0) {
        cardsToAnimate.forEach((cardIndex, i) => {
          setTimeout(() => {
            setAnimatingCards((prev) => new Set([...prev, cardIndex]));

            setTimeout(() => {
              setAnimatingCards((prev) => {
                const newSet = new Set(prev);
                newSet.delete(cardIndex);
                return newSet;
              });
            }, 600);
          }, i * 200);
        });
      }

      setPreviousPhase(currentPhase);
    }
  }, [gameState?.phase, previousPhase]);

  if (!gameState || !gameState.communityCards) {
    return (
      <div
        className={`community-cards-area community-cards-area--${resolvedTableProfile} ${
          compactBoardLayout ? 'community-cards-area--compact' : 'community-cards-area--spacious'
        }`}
        data-table-profile={resolvedTableProfile}
        data-card-density={resolvedBoardLayout.cardDensity}
      >
        <div className="community-cards-area__tray" data-table-profile={resolvedTableProfile}>
          <div className="community-cards-area__rail" style={{ gap: `${resolvedBoardLayout.gap}px` }}>
            {[1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="poker-card community back" style={cardStyle}></div>
            ))}
          </div>
        </div>
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
  const trayStyle =
    resolvedBoardLayout.trayWidth && resolvedBoardLayout.trayHeight
      ? {
          width: `${resolvedBoardLayout.trayWidth}px`,
          minHeight: `${resolvedBoardLayout.trayHeight}px`,
        }
      : undefined;

  return (
    <div
      className={`community-cards-area community-cards-area--${resolvedTableProfile} ${
        compactBoardLayout ? 'community-cards-area--compact' : 'community-cards-area--spacious'
      }`}
      data-table-profile={resolvedTableProfile}
      data-card-density={resolvedBoardLayout.cardDensity}
    >
      {resolvedBoardLayout.phaseVisible && (
        <div className="community-cards-area__phase">
          <div className="mb-1 text-sm font-bold text-yellow-400 sm:text-lg">{getPhaseText()}</div>
          <div className="mx-auto h-1 w-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 sm:w-16"></div>
        </div>
      )}

      <div
        className="community-cards-area__tray"
        data-table-profile={resolvedTableProfile}
        data-card-density={resolvedBoardLayout.cardDensity}
        style={trayStyle}
      >
        <div className="community-cards-area__rail" style={{ gap: `${resolvedBoardLayout.gap}px` }}>
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
                  <div className="card-face card-back">
                    <div className="poker-card community back" style={cardStyle}></div>
                  </div>

                  <div className="card-face card-front">
                    {card ? (
                      <Card
                        card={card}
                        size="community"
                        density={resolvedBoardLayout.cardDensity}
                        style={cardStyle}
                      />
                    ) : (
                      <div className="poker-card community back" style={cardStyle}></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {gameState.pot > 0 && resolvedBoardLayout.phaseVisible && (
          <div className="community-cards-area__pot">
            <div className="text-sm text-gray-300">底池</div>
            <div className="text-lg font-bold text-green-400">{gameState.pot}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommunityCards;
