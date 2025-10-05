/**
 * 统一输入验证器 - 提供类型安全的输入验证和数据清理
 * 支持复杂的游戏规则验证和错误处理
 */

const { ERROR_CODES, GAME_CONFIG } = require('../types/GameTypes');
const { logger } = require('../utils');

class Validator {
  /**
   * 验证玩家ID
   * @param {string} playerId - 玩家ID
   * @returns {ValidationResult} 验证结果
   */
  static validatePlayerId(playerId) {
    if (!playerId || typeof playerId !== 'string') {
      return {
        valid: false,
        error: '玩家ID必须是非空字符串',
      };
    }

    if (playerId.length < 3 || playerId.length > 50) {
      return {
        valid: false,
        error: '玩家ID长度必须在3-50个字符之间',
      };
    }

    // 检查是否包含非法字符
    const validPattern = /^[a-zA-Z0-9_-]+$/;
    if (!validPattern.test(playerId)) {
      return {
        valid: false,
        error: '玩家ID只能包含字母、数字、下划线和连字符',
      };
    }

    return {
      valid: true,
      data: playerId.trim(),
    };
  }

  /**
   * 验证玩家昵称
   * @param {string} nickname - 玩家昵称
   * @returns {ValidationResult} 验证结果
   */
  static validateNickname(nickname) {
    if (!nickname || typeof nickname !== 'string') {
      return {
        valid: false,
        error: '昵称必须是非空字符串',
      };
    }

    const trimmed = nickname.trim();

    if (trimmed.length < 1 || trimmed.length > 20) {
      return {
        valid: false,
        error: '昵称长度必须在1-20个字符之间',
      };
    }

    // 检查敏感词（简化版）
    const forbiddenWords = ['admin', 'bot', 'system', 'null', 'undefined'];
    const lowerNickname = trimmed.toLowerCase();

    for (const word of forbiddenWords) {
      if (lowerNickname.includes(word)) {
        return {
          valid: false,
          error: `昵称不能包含敏感词: ${word}`,
        };
      }
    }

    return {
      valid: true,
      data: trimmed,
    };
  }

  /**
   * 验证玩家动作
   * @param {string} playerId - 玩家ID
   * @param {string} action - 动作类型
   * @param {number} [amount=0] - 动作金额
   * @param {Object} gameContext - 游戏上下文
   * @returns {ValidationResult} 验证结果
   */
  static validatePlayerAction(playerId, action, amount = 0, gameContext = {}) {
    // 验证玩家ID
    const playerIdResult = this.validatePlayerId(playerId);
    if (!playerIdResult.valid) {
      return playerIdResult;
    }

    // 验证动作类型
    const validActions = ['fold', 'check', 'call', 'raise', 'allin'];
    if (!action || !validActions.includes(action)) {
      return {
        valid: false,
        error: `无效的动作类型: ${action}。有效动作: ${validActions.join(', ')}`,
      };
    }

    // 验证金额（仅对需要金额的动作）
    if (['raise', 'allin'].includes(action)) {
      const amountResult = this.validateBetAmount(amount, gameContext);
      if (!amountResult.valid) {
        return amountResult;
      }
    } else if (amount && amount !== 0) {
      logger.warn('Action does not require amount but amount provided', {
        playerId,
        action,
        amount,
      });
    }

    // 验证游戏上下文相关的规则
    const contextResult = this.validateActionContext(playerId, action, amount, gameContext);
    if (!contextResult.valid) {
      return contextResult;
    }

    return {
      valid: true,
      data: {
        playerId: playerIdResult.data,
        action,
        amount: ['raise', 'allin'].includes(action) ? amount : 0,
      },
    };
  }

  /**
   * 验证下注金额
   * @param {number} amount - 下注金额
   * @param {Object} constraints - 约束条件
   * @returns {ValidationResult} 验证结果
   */
  static validateBetAmount(amount, constraints = {}) {
    // 基础类型检查
    if (typeof amount !== 'number' || isNaN(amount)) {
      return {
        valid: false,
        error: '下注金额必须是有效数字',
      };
    }

    // 检查是否为整数
    if (!Number.isInteger(amount)) {
      return {
        valid: false,
        error: '下注金额必须是整数',
      };
    }

    // 检查最小值
    const minAmount = constraints.minAmount || 1;
    if (amount < minAmount) {
      return {
        valid: false,
        error: `下注金额不能少于 ${minAmount}`,
      };
    }

    // 检查最大值
    const maxAmount = constraints.maxAmount || GAME_CONFIG.MAX_CHIPS;
    if (amount > maxAmount) {
      return {
        valid: false,
        error: `下注金额不能超过 ${maxAmount}`,
      };
    }

    // 检查玩家筹码限制
    if (constraints.playerChips && amount > constraints.playerChips) {
      return {
        valid: false,
        error: `下注金额不能超过玩家筹码 ${constraints.playerChips}`,
      };
    }

    // 检查最小加注额
    if (constraints.minRaise && amount < constraints.minRaise) {
      return {
        valid: false,
        error: `加注金额不能少于最小加注额 ${constraints.minRaise}`,
      };
    }

    return {
      valid: true,
      data: amount,
    };
  }

  /**
   * 验证房间设置
   * @param {Object} settings - 房间设置
   * @returns {ValidationResult} 验证结果
   */
  static validateRoomSettings(settings) {
    if (!settings || typeof settings !== 'object') {
      return {
        valid: false,
        error: '房间设置必须是对象',
      };
    }

    const validatedSettings = {};

    // 验证最大玩家数
    const maxPlayers = settings.maxPlayers;
    if (typeof maxPlayers !== 'number' || maxPlayers < GAME_CONFIG.MIN_PLAYERS || maxPlayers > GAME_CONFIG.MAX_PLAYERS) {
      return {
        valid: false,
        error: `最大玩家数必须在 ${GAME_CONFIG.MIN_PLAYERS}-${GAME_CONFIG.MAX_PLAYERS} 之间`,
      };
    }
    validatedSettings.maxPlayers = maxPlayers;

    // 验证初始筹码
    const initialChips = settings.initialChips;
    if (typeof initialChips !== 'number' || initialChips < GAME_CONFIG.MIN_CHIPS || initialChips > GAME_CONFIG.MAX_CHIPS) {
      return {
        valid: false,
        error: `初始筹码必须在 ${GAME_CONFIG.MIN_CHIPS}-${GAME_CONFIG.MAX_CHIPS} 之间`,
      };
    }
    validatedSettings.initialChips = initialChips;

    // 验证时间限制
    const timeLimit = settings.timeLimit || GAME_CONFIG.DEFAULT_TIME_LIMIT;
    if (typeof timeLimit !== 'number' || timeLimit < GAME_CONFIG.MIN_TIME_LIMIT || timeLimit > GAME_CONFIG.MAX_TIME_LIMIT) {
      return {
        valid: false,
        error: `时间限制必须在 ${GAME_CONFIG.MIN_TIME_LIMIT}-${GAME_CONFIG.MAX_TIME_LIMIT} 秒之间`,
      };
    }
    validatedSettings.timeLimit = timeLimit;

    // 验证其他布尔设置
    validatedSettings.allowSpectators = Boolean(settings.allowSpectators);
    validatedSettings.isPrivate = Boolean(settings.isPrivate);

    // 验证密码（如果是私人房间）
    if (validatedSettings.isPrivate) {
      const password = settings.password;
      if (!password || typeof password !== 'string' || password.length < 4) {
        return {
          valid: false,
          error: '私人房间密码长度至少为4个字符',
        };
      }
      validatedSettings.password = password;
    }

    // 验证盲注设置
    if (settings.blinds) {
      const blindsResult = this.validateBlindStructure(settings.blinds, initialChips);
      if (!blindsResult.valid) {
        return blindsResult;
      }
      validatedSettings.blinds = blindsResult.data;
    } else {
      // 使用默认盲注设置
      validatedSettings.blinds = {
        smallBlind: Math.floor(initialChips / 100),
        bigBlind: Math.floor(initialChips / 50),
        autoIncrease: false,
        increaseInterval: 10,
        increaseRate: 1.5,
      };
    }

    return {
      valid: true,
      data: validatedSettings,
    };
  }

  /**
   * 验证盲注结构
   * @param {Object} blinds - 盲注设置
   * @param {number} initialChips - 初始筹码
   * @returns {ValidationResult} 验证结果
   */
  static validateBlindStructure(blinds, initialChips) {
    if (!blinds || typeof blinds !== 'object') {
      return {
        valid: false,
        error: '盲注设置必须是对象',
      };
    }

    const { smallBlind, bigBlind } = blinds;

    // 验证小盲注
    if (typeof smallBlind !== 'number' || smallBlind <= 0) {
      return {
        valid: false,
        error: '小盲注必须是正数',
      };
    }

    // 验证大盲注
    if (typeof bigBlind !== 'number' || bigBlind <= 0) {
      return {
        valid: false,
        error: '大盲注必须是正数',
      };
    }

    // 验证盲注关系
    if (bigBlind <= smallBlind) {
      return {
        valid: false,
        error: '大盲注必须大于小盲注',
      };
    }

    // 验证盲注与初始筹码的比例
    if (bigBlind > initialChips / 10) {
      return {
        valid: false,
        error: '大盲注不能超过初始筹码的10%',
      };
    }

    return {
      valid: true,
      data: {
        smallBlind,
        bigBlind,
        autoIncrease: Boolean(blinds.autoIncrease),
        increaseInterval: blinds.increaseInterval || 10,
        increaseRate: blinds.increaseRate || 1.5,
      },
    };
  }

  /**
   * 验证动作上下文（游戏规则）
   * @param {string} playerId - 玩家ID
   * @param {string} action - 动作类型
   * @param {number} amount - 动作金额
   * @param {Object} gameContext - 游戏上下文
   * @returns {ValidationResult} 验证结果
   */
  static validateActionContext(playerId, action, amount, gameContext) {
    const { currentPlayer, currentBet = 0, playerBet = 0, playerChips = 0, minRaise = 0, phase = 'waiting' } = gameContext;

    // 检查是否轮到该玩家
    if (currentPlayer && currentPlayer !== playerId) {
      return {
        valid: false,
        error: '不是您的回合',
      };
    }

    // 检查游戏阶段
    if (phase === 'waiting' || phase === 'finished') {
      return {
        valid: false,
        error: '游戏未开始或已结束',
      };
    }

    // 验证具体动作
    switch (action) {
      case 'fold':
        // 弃牌总是有效的
        return { valid: true };

      case 'check':
        // 只有当前下注等于玩家下注时才能过牌
        if (currentBet > playerBet) {
          return {
            valid: false,
            error: '存在下注时不能过牌，请选择跟注或加注',
          };
        }
        return { valid: true };

      case 'call':
        // 只有当前下注大于玩家下注时才能跟注
        if (currentBet <= playerBet) {
          return {
            valid: false,
            error: '没有需要跟注的金额，请选择过牌',
          };
        }

        const callAmount = currentBet - playerBet;
        if (callAmount > playerChips) {
          return {
            valid: false,
            error: '筹码不足，无法跟注',
          };
        }
        return { valid: true };

      case 'raise':
        // 验证加注金额
        const totalRaise = amount + (currentBet - playerBet);
        if (totalRaise > playerChips) {
          return {
            valid: false,
            error: '筹码不足，无法加注到该金额',
          };
        }

        if (amount < minRaise) {
          return {
            valid: false,
            error: `加注金额不能少于最小加注额 ${minRaise}`,
          };
        }
        return { valid: true };

      case 'allin':
        // All-in时金额应该等于玩家剩余筹码
        if (amount !== playerChips) {
          return {
            valid: false,
            error: 'All-in金额必须等于剩余筹码',
          };
        }
        return { valid: true };

      default:
        return {
          valid: false,
          error: `未知的动作类型: ${action}`,
        };
    }
  }

  /**
   * 验证Socket事件数据
   * @param {Object} eventData - 事件数据
   * @returns {ValidationResult} 验证结果
   */
  static validateSocketEvent(eventData) {
    if (!eventData || typeof eventData !== 'object') {
      return {
        valid: false,
        error: '事件数据必须是对象',
      };
    }

    // 验证事件类型
    const { type, payload, playerId, roomId } = eventData;

    if (!type || typeof type !== 'string') {
      return {
        valid: false,
        error: '事件类型必须是非空字符串',
      };
    }

    // 验证玩家ID（如果提供）
    if (playerId) {
      const playerResult = this.validatePlayerId(playerId);
      if (!playerResult.valid) {
        return playerResult;
      }
    }

    // 验证房间ID（如果提供）
    if (roomId) {
      const roomResult = this.validatePlayerId(roomId); // 房间ID使用相同的验证规则
      if (!roomResult.valid) {
        return {
          valid: false,
          error: '房间ID格式无效',
        };
      }
    }

    return {
      valid: true,
      data: {
        type,
        payload: payload || {},
        timestamp: Date.now(),
        playerId: playerId || null,
        roomId: roomId || null,
      },
    };
  }

  /**
   * 创建游戏错误对象
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   * @param {*} [details] - 错误详情
   * @returns {GameError} 游戏错误对象
   */
  static createGameError(code, message, details = null) {
    return {
      code: ERROR_CODES[code] || code,
      message,
      details,
      timestamp: Date.now(),
    };
  }

  /**
   * 验证并清理输入数据
   * @param {*} data - 输入数据
   * @param {string} type - 数据类型
   * @returns {ValidationResult} 验证结果
   */
  static sanitizeInput(data, type) {
    switch (type) {
      case 'string':
        if (typeof data !== 'string') return { valid: false, error: '必须是字符串' };
        return { valid: true, data: data.trim() };

      case 'number':
        const num = Number(data);
        if (isNaN(num)) return { valid: false, error: '必须是有效数字' };
        return { valid: true, data: num };

      case 'boolean':
        return { valid: true, data: Boolean(data) };

      case 'array':
        if (!Array.isArray(data)) return { valid: false, error: '必须是数组' };
        return { valid: true, data };

      case 'object':
        if (!data || typeof data !== 'object') return { valid: false, error: '必须是对象' };
        return { valid: true, data };

      default:
        return { valid: true, data };
    }
  }
}

module.exports = Validator;
