/**
 * 奖池管理器 - 负责主池和边池的计算与分配
 * 处理复杂的All-in场景和多人游戏的奖池分割
 */

class PotManager {
  /**
   * 创建奖池管理器实例
   * @param {Object} gameState - 游戏状态引用
   * @param {PlayerManager} playerManager - 玩家管理器实例
   */
  constructor(gameState, playerManager) {
    this.gameState = gameState;
    this.playerManager = playerManager;
  }

  /**
   * 计算所有奖池（主池和边池）
   * @param {Array} players - 所有玩家列表
   * @returns {Array} 奖池信息数组
   */
  calculatePots(players) {
    if (!players || players.length === 0) {
      return [];
    }

    // 获取所有有下注的玩家
    const playersWithBets = players.filter(player => player.totalBet > 0);
    
    if (playersWithBets.length === 0) {
      return [];
    }

    // 按下注金额排序（从小到大）
    const sortedPlayers = [...playersWithBets].sort((a, b) => a.totalBet - b.totalBet);
    
    const pots = [];
    let remainingPlayers = [...sortedPlayers];
    let currentLevel = 0;

    while (remainingPlayers.length > 0) {
      const minBet = remainingPlayers[0].totalBet;
      const potAmount = (minBet - currentLevel) * remainingPlayers.length;
      
      if (potAmount > 0) {
        pots.push({
          id: pots.length,
          amount: potAmount,
          eligiblePlayers: remainingPlayers.filter(player => !player.folded).map(p => p.id),
          level: currentLevel,
          maxBet: minBet
        });
      }

      currentLevel = minBet;
      remainingPlayers = remainingPlayers.filter(player => player.totalBet > minBet);
    }

    return pots;
  }

  /**
   * 计算简化的奖池分配（用于游戏中显示）
   * @returns {Object} 简化的奖池信息
   */
  calculateSimplePot() {
    const players = this.playerManager.players;
    const totalPot = players.reduce((sum, player) => sum + player.totalBet, 0);
    const activePlayers = players.filter(player => !player.folded);

    return {
      main: totalPot,
      side: 0, // 简化版本暂不显示边池
      total: totalPot,
      eligiblePlayers: activePlayers.length
    };
  }

  /**
   * 分配奖池给获胜者
   * @param {Array} winners - 获胜者列表，按手牌强度排序
   * @param {Array} allPlayers - 所有玩家列表
   * @returns {Array} 分配结果
   */
  distributePots(winners, allPlayers) {
    const pots = this.calculatePots(allPlayers);
    const distributions = [];
    
    for (const pot of pots) {
      const eligibleWinners = winners.filter(winner => 
        pot.eligiblePlayers.includes(winner.id)
      );

      if (eligibleWinners.length === 0) {
        // 没有符合条件的获胜者，分给最后折牌的玩家
        const lastFoldedPlayer = this.findLastActivePotPlayer(pot, allPlayers);
        if (lastFoldedPlayer) {
          distributions.push({
            potId: pot.id,
            amount: pot.amount,
            winners: [lastFoldedPlayer],
            reason: 'no_eligible_winners'
          });
        }
        continue;
      }

      // 按手牌强度分组
      const winnerGroups = this.groupWinnersByHandStrength(eligibleWinners);
      let remainingAmount = pot.amount;
      
      for (const group of winnerGroups) {
        if (remainingAmount <= 0) break;
        
        const sharePerWinner = Math.floor(remainingAmount / group.length);
        const remainder = remainingAmount % group.length;
        
        // 分配给这一组的获胜者
        group.forEach((winner, index) => {
          const winAmount = sharePerWinner + (index < remainder ? 1 : 0);
          winner.chips += winAmount;
          
          distributions.push({
            potId: pot.id,
            amount: winAmount,
            winner: winner,
            handRank: winner.handRank,
            reason: group.length > 1 ? 'split_pot' : 'single_winner'
          });
        });
        
        remainingAmount = 0; // 最强手牌组获得所有奖池
      }
    }

    return distributions;
  }

  /**
   * 查找最后一个在该奖池中活跃的玩家
   * @param {Object} pot - 奖池信息
   * @param {Array} allPlayers - 所有玩家列表
   * @returns {Object|null} 最后活跃的玩家
   */
  findLastActivePotPlayer(pot, allPlayers) {
    const eligiblePlayers = allPlayers.filter(player => 
      pot.eligiblePlayers.includes(player.id)
    );
    
    // 按折牌顺序返回最后一个
    return eligiblePlayers.length > 0 ? eligiblePlayers[eligiblePlayers.length - 1] : null;
  }

  /**
   * 按手牌强度将获胜者分组
   * @param {Array} winners - 获胜者列表
   * @returns {Array} 分组后的获胜者数组
   */
  groupWinnersByHandStrength(winners) {
    const groups = new Map();
    
    winners.forEach(winner => {
      const key = `${winner.handRank.rank}-${winner.handRank.value}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(winner);
    });
    
    // 按手牌强度排序（最强的在前）
    return Array.from(groups.values()).sort((a, b) => {
      const aRank = a[0].handRank;
      const bRank = b[0].handRank;
      
      if (aRank.rank !== bRank.rank) {
        return bRank.rank - aRank.rank; // 排名高的在前
      }
      
      return bRank.value - aRank.value; // 数值大的在前
    });
  }

  /**
   * 计算玩家的有效投入（用于边池计算）
   * @param {Object} player - 玩家对象
   * @param {number} maxLevel - 最大下注水平
   * @returns {number} 有效投入金额
   */
  calculateEffectiveContribution(player, maxLevel) {
    return Math.min(player.totalBet, maxLevel);
  }

  /**
   * 获取奖池详细信息（用于调试和显示）
   * @returns {Object} 奖池详细信息
   */
  getPotDetails() {
    const players = this.playerManager.players;
    const pots = this.calculatePots(players);
    const simplePot = this.calculateSimplePot();
    
    return {
      simple: simplePot,
      detailed: pots,
      totalAmount: pots.reduce((sum, pot) => sum + pot.amount, 0),
      potCount: pots.length,
      playersInvolved: players.filter(p => p.totalBet > 0).length
    };
  }

  /**
   * 验证奖池计算的正确性
   * @returns {Object} 验证结果
   */
  validatePotCalculation() {
    const players = this.playerManager.players;
    const pots = this.calculatePots(players);
    
    // 计算总投入
    const totalBets = players.reduce((sum, player) => sum + player.totalBet, 0);
    
    // 计算奖池总额
    const totalPotAmount = pots.reduce((sum, pot) => sum + pot.amount, 0);
    
    const isValid = totalBets === totalPotAmount;
    
    return {
      valid: isValid,
      totalBets,
      totalPotAmount,
      difference: totalBets - totalPotAmount,
      potCount: pots.length,
      details: isValid ? 'Pot calculation is correct' : 'Pot calculation has errors'
    };
  }

  /**
   * 重置奖池状态（新手牌开始时）
   */
  resetPots() {
    this.gameState.pot = 0;
    this.gameState.sidePots = [];
    
    // 重置玩家的总下注
    this.playerManager.players.forEach(player => {
      player.totalBet = 0;
    });
  }

  /**
   * 添加金额到主奖池
   * @param {number} amount - 添加的金额
   */
  addToPot(amount) {
    if (typeof amount !== 'number' || amount < 0) {
      throw new Error('Invalid amount to add to pot');
    }
    
    this.gameState.pot += amount;
  }

  /**
   * 获取当前奖池总额
   * @returns {number} 奖池总额
   */
  getTotalPot() {
    return this.gameState.pot || 0;
  }

  /**
   * 计算All-in场景下的奖池分配预览
   * @param {Array} allinPlayers - All-in玩家列表
   * @returns {Object} 奖池分配预览
   */
  calculateAllinPotPreview(allinPlayers) {
    if (!allinPlayers || allinPlayers.length === 0) {
      return { mainPot: this.getTotalPot(), sidePots: [] };
    }

    const allPlayers = this.playerManager.players;
    const pots = this.calculatePots(allPlayers);
    
    return {
      mainPot: pots.length > 0 ? pots[0].amount : 0,
      sidePots: pots.slice(1).map((pot, index) => ({
        id: index + 1,
        amount: pot.amount,
        eligiblePlayerCount: pot.eligiblePlayers.length
      })),
      totalPots: pots.length,
      complexityLevel: pots.length > 3 ? 'high' : pots.length > 1 ? 'medium' : 'simple'
    };
  }

  /**
   * 处理玩家退出时的奖池调整
   * @param {string} playerId - 退出的玩家ID
   * @returns {Object} 调整结果
   */
  handlePlayerExit(playerId) {
    const player = this.playerManager.getPlayerById(playerId);
    if (!player) {
      return { success: false, message: 'Player not found' };
    }

    // 如果玩家有未结算的下注，需要处理
    if (player.totalBet > 0) {
      // 简单处理：将下注留在奖池中
      const adjustedAmount = player.totalBet;
      player.totalBet = 0;
      
      return {
        success: true,
        adjustedAmount,
        message: `Player ${player.nickname} exited, ${adjustedAmount} chips remain in pot`
      };
    }

    return {
      success: true,
      adjustedAmount: 0,
      message: `Player ${player.nickname} exited with no pot impact`
    };
  }
}

module.exports = PotManager;
