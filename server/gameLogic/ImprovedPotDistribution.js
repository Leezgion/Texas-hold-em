/**
 * GameLogic 改进版 - 修复边池和平局分池逻辑
 * 
 * 主要改进：
 * 1. 集成 PotManager 进行边池计算和分配
 * 2. 实现平局分池逻辑（Split Pot）
 * 3. 余数分配给最接近小盲注的玩家
 * 4. 改进获胜者判定逻辑
 */

const Card = require('./Card');
const Deck = require('./Deck');
const HandEvaluator = require('./HandEvaluator');
const PotManager = require('./managers/PotManager');

/**
 * 改进的底池分配方法
 * 应该替换 GameLogic.js 中的 distributePot 方法
 */
class ImprovedPotDistribution {
  
  /**
   * 分配底池（支持边池和平局分池）
   * @param {Object} gameLogic - GameLogic实例
   * @param {Object} result - 摊牌结果
   */
  static distributePot(gameLogic, result) {
    const { room, io } = gameLogic;
    const players = room.players;
    
    // 创建PotManager实例
    const playerManager = {
      players: players
    };
    const potManager = new PotManager({}, playerManager);
    
    // 计算所有底池（主池和边池）
    const pots = potManager.calculatePots(players);
    
    console.log('\n=== 开始分配底池 ===');
    console.log(`总共 ${pots.length} 个底池`);
    pots.forEach((pot, index) => {
      console.log(`底池${index}: 金额=${pot.amount}, 参与者=${pot.eligiblePlayers.join(', ')}`);
    });
    
    // 获取所有未弃牌玩家的手牌评估
    const playerHands = result.hands || this.evaluateAllPlayers(gameLogic, result.communityCards);
    
    // 存储每个玩家的总赢取金额
    const playerWinnings = new Map();
    players.forEach(p => playerWinnings.set(p.id, 0));
    
    // 从最后一个边池开始分配（最小的参与者池）
    for (let i = pots.length - 1; i >= 0; i--) {
      const pot = pots[i];
      
      // 找出符合该底池资格的获胜者
      const eligibleHands = playerHands.filter(hand => 
        pot.eligiblePlayers.includes(hand.player.id)
      );
      
      if (eligibleHands.length === 0) {
        console.log(`底池${i} 没有符合资格的获胜者，跳过`);
        continue;
      }
      
      // 按牌力排序，找出最强的牌
      eligibleHands.sort((a, b) => {
        if (b.hand.rank !== a.hand.rank) {
          return b.hand.rank - a.hand.rank;
        }
        return HandEvaluator.compareKickers(b.hand, a.hand);
      });
      
      const bestHand = eligibleHands[0];
      
      // 找出所有与最强牌平局的玩家
      const winners = eligibleHands.filter(hand => {
        if (hand.hand.rank !== bestHand.hand.rank) {
          return false;
        }
        const kickerComparison = HandEvaluator.compareKickers(hand.hand, bestHand.hand);
        return kickerComparison === 0;
      });
      
      console.log(`底池${i} 获胜者数量: ${winners.length}`);
      
      // 分配该底池
      this.distributeSinglePot(pot, winners, gameLogic.smallBlindIndex, playerWinnings, room);
    }
    
    // 应用玩家赢取的筹码
    playerWinnings.forEach((winnings, playerId) => {
      const player = players.find(p => p.id === playerId);
      if (player && winnings > 0) {
        player.chips += winnings;
        console.log(`玩家 ${player.nickname} 总共赢得 ${winnings} 筹码`);
      }
    });
    
    // 清空底池
    gameLogic.pot = 0;
    gameLogic.sidePots = [];
    
    // 发送结果给客户端
    this.sendHandResult(gameLogic, result, playerWinnings, pots);
  }
  
  /**
   * 分配单个底池
   * @param {Object} pot - 底池信息
   * @param {Array} winners - 获胜者数组
   * @param {number} smallBlindIndex - 小盲注位置
   * @param {Map} playerWinnings - 玩家赢取金额映射
   * @param {Object} room - 房间对象
   */
  static distributeSinglePot(pot, winners, smallBlindIndex, playerWinnings, room) {
    const winnerCount = winners.length;
    const splitAmount = Math.floor(pot.amount / winnerCount);
    const remainder = pot.amount % winnerCount;
    
    console.log(`分配底池: 金额=${pot.amount}, 获胜者=${winnerCount}人, 每人=${splitAmount}, 余数=${remainder}`);
    
    // 每个获胜者获得平分的金额
    winners.forEach(winner => {
      const currentWinnings = playerWinnings.get(winner.player.id) || 0;
      playerWinnings.set(winner.player.id, currentWinnings + splitAmount);
    });
    
    // 如果有余数，分配给最接近小盲注位置的玩家
    if (remainder > 0) {
      const closestWinner = this.findClosestToSmallBlind(winners, smallBlindIndex, room.players);
      if (closestWinner) {
        const currentWinnings = playerWinnings.get(closestWinner.player.id) || 0;
        playerWinnings.set(closestWinner.player.id, currentWinnings + remainder);
        console.log(`余数 ${remainder} 分配给玩家 ${closestWinner.player.nickname}`);
      }
    }
  }
  
  /**
   * 找到最接近小盲注位置的获胜者
   * @param {Array} winners - 获胜者数组
   * @param {number} smallBlindIndex - 小盲注位置
   * @param {Array} allPlayers - 所有玩家数组
   * @returns {Object} 最接近小盲注的获胜者
   */
  static findClosestToSmallBlind(winners, smallBlindIndex, allPlayers) {
    if (winners.length === 0) return null;
    if (winners.length === 1) return winners[0];
    
    const playerCount = allPlayers.length;
    let minDistance = playerCount;
    let closestWinner = winners[0];
    
    winners.forEach(winner => {
      const playerIndex = allPlayers.findIndex(p => p.id === winner.player.id);
      if (playerIndex === -1) return;
      
      // 计算顺时针距离
      let distance = (playerIndex - smallBlindIndex + playerCount) % playerCount;
      
      if (distance < minDistance) {
        minDistance = distance;
        closestWinner = winner;
      }
    });
    
    return closestWinner;
  }
  
  /**
   * 评估所有未弃牌玩家的手牌
   * @param {Object} gameLogic - GameLogic实例
   * @param {Array} communityCards - 公共牌
   * @returns {Array} 玩家手牌评估结果
   */
  static evaluateAllPlayers(gameLogic, communityCards) {
    const activePlayers = gameLogic.room.players.filter(p => !p.folded);
    
    return activePlayers.map(player => ({
      player: player,
      hand: HandEvaluator.evaluateHand(player.hand, communityCards)
    }));
  }
  
  /**
   * 发送手牌结果给客户端
   * @param {Object} gameLogic - GameLogic实例
   * @param {Object} result - 摊牌结果
   * @param {Map} playerWinnings - 玩家赢取金额
   * @param {Array} pots - 底池数组
   */
  static sendHandResult(gameLogic, result, playerWinnings, pots) {
    const winners = [];
    playerWinnings.forEach((winnings, playerId) => {
      if (winnings > 0) {
        const player = gameLogic.room.players.find(p => p.id === playerId);
        if (player) {
          winners.push({
            playerId: player.id,
            nickname: player.nickname,
            winnings: winnings
          });
        }
      }
    });
    
    gameLogic.io.to(gameLogic.room.id).emit('handResult', {
      winners: winners.map(w => w.nickname),
      winnings: winners,
      hands: result.hands ? result.hands.map(h => ({
        player: h.player.nickname,
        hand: h.hand,
        cards: h.player.showHand ? h.player.hand : []
      })) : [],
      communityCards: result.communityCards,
      pots: pots.map((pot, index) => ({
        id: index,
        amount: pot.amount,
        winners: winners.filter(w => pot.eligiblePlayers.includes(w.playerId))
          .map(w => w.nickname)
      })),
      totalPot: pots.reduce((sum, pot) => sum + pot.amount, 0)
    });
    
    console.log('=== 底池分配完成 ===\n');
  }
}

module.exports = ImprovedPotDistribution;
