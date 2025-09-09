import Card from './Card';
import React from 'react';
import { useGame } from '../contexts/GameContext';
import Modal from './Modal';

const HandResultModal = () => {
  const { showHandResult, setShowHandResult, handResult } = useGame();

  if (!showHandResult || !handResult) return null;

  const handleClose = () => {
    setShowHandResult(false);
  };

  const getHandName = (hand) => {
    if (!hand || !hand.name) return '未知';
    return hand.name;
  };

  return (
    <Modal
      show={showHandResult && handResult}
      onClose={handleClose}
      title={handResult?.isAllin ? 'All-in 结果' : '手牌结果'}
      maxWidth="max-w-4xl"
    >
      {handResult?.isAllin ? (
        // All-in 多次发牌结果
          <div className="space-y-6">
            {handResult.results?.map((result, index) => (
              <div
                key={index}
                className="bg-gray-700 p-4 rounded-lg border border-gray-600"
              >
                <h3 className="text-lg font-semibold text-poker-gold mb-3">第 {result.round} 轮</h3>

                {/* 公共牌 */}
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">公共牌:</div>
                  <div className="flex space-x-2">
                    {result.communityCards.map((card, cardIndex) => (
                      <Card
                        key={cardIndex}
                        card={card}
                      />
                    ))}
                  </div>
                </div>

                {/* 赢家 */}
                <div className="text-green-400 font-semibold">赢家: {result.winners.join(', ')}</div>
              </div>
            ))}

            {/* 最终分配 */}
            {handResult.finalDistribution && (
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <h3 className="text-lg font-semibold text-poker-gold mb-3">最终分配</h3>
                <div className="space-y-2">
                  {handResult.finalDistribution.map((player, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center"
                    >
                      <span className="text-white">{player.nickname}</span>
                      <span className="text-poker-gold">
                        获胜 {player.wins} 次，赢得 {player.winnings} 筹码
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // 普通手牌结果
          <div className="space-y-6">
            {/* 赢家 */}
            <div className="text-center">
              <div className="text-2xl font-bold text-poker-gold mb-2">🎉 恭喜获胜者 🎉</div>
              <div className="text-xl text-white">{handResult.winners?.join(', ')}</div>
            </div>

            {/* 公共牌 */}
            {handResult.communityCards && (
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-lg font-semibold text-poker-gold mb-3">公共牌</div>
                <div className="flex justify-center space-x-2">
                  {handResult.communityCards.map((card, index) => (
                    <Card
                      key={index}
                      card={card}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 玩家手牌 */}
            {handResult.hands && handResult.hands.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg border border-gray-600">
                <div className="text-lg font-semibold text-poker-gold mb-3">玩家手牌</div>
                <div className="space-y-3">
                  {handResult.hands.map((hand, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-white font-semibold">{hand.player}</span>
                        <span className="text-poker-gold">{getHandName(hand.hand)}</span>
                      </div>

                      {/* 手牌 */}
                      <div className="flex space-x-1">
                        {hand.cards.map((card, cardIndex) => (
                          <Card
                            key={cardIndex}
                            card={card}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 底池信息 */}
            {handResult.pot !== undefined && (
              <div className="text-center text-lg">
                <span className="text-gray-400">底池: </span>
                <span className="text-poker-gold font-bold">{handResult.pot}</span>
              </div>
            )}

            {/* 特殊说明 */}
            {handResult.reason && <div className="text-center text-gray-400">{handResult.reason}</div>}
          </div>
      )}

      {/* 关闭按钮 */}
      <div className="mt-6 text-center">
        <button
          onClick={handleClose}
          className=" primary px-8 py-3"
        >
          关闭
        </button>
      </div>
    </Modal>
  );
};export default HandResultModal;
