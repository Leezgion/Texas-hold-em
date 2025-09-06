/**
 * Validator 单元测试
 * 测试输入验证器的所有功能和边界情况
 */

const Validator = require('../../validators/Validator');
const { ERROR_CODES } = require('../../types/GameTypes');

describe('Validator 验证器测试', () => {
  
  describe('玩家ID验证', () => {
    test('应该接受有效的玩家ID', () => {
      const validIds = ['player123', 'user_456', 'test-player', 'p1'];
      
      validIds.forEach(id => {
        const result = Validator.validatePlayerId(id);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
        expect(result.data).toBe(id);
      });
    });

    test('应该拒绝无效的玩家ID', () => {
      const invalidIds = ['', null, undefined, 123, {}, [], 'a', 'x'.repeat(51)];
      
      invalidIds.forEach(id => {
        const result = Validator.validatePlayerId(id);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    test('应该拒绝包含特殊字符的玩家ID', () => {
      const invalidIds = ['player@123', 'user#456', 'test player', 'p1!'];
      
      invalidIds.forEach(id => {
        const result = Validator.validatePlayerId(id);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_DATA_FORMAT)).toBe(true);
      });
    });
  });

  describe('昵称验证', () => {
    test('应该接受有效的昵称', () => {
      const validNicknames = ['测试玩家', 'Player1', '玩家_123', 'Test-User'];
      
      validNicknames.forEach(nickname => {
        const result = Validator.validateNickname(nickname);
        expect(result.valid).toBe(true);
        expect(result.data).toBe(nickname);
      });
    });

    test('应该拒绝禁用的昵称', () => {
      const forbiddenNicknames = ['admin', 'system', 'bot', 'null', 'undefined'];
      
      forbiddenNicknames.forEach(nickname => {
        const result = Validator.validateNickname(nickname);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_NICKNAME)).toBe(true);
      });
    });

    test('应该拒绝长度不符的昵称', () => {
      const tooShort = 'a';
      const tooLong = 'x'.repeat(21);
      
      const shortResult = Validator.validateNickname(tooShort);
      expect(shortResult.valid).toBe(false);
      
      const longResult = Validator.validateNickname(tooLong);
      expect(longResult.valid).toBe(false);
      expect(longResult.errors.some(e => e.code === ERROR_CODES.NICKNAME_TOO_LONG)).toBe(true);
    });

    test('应该拒绝包含非法字符的昵称', () => {
      const invalidNicknames = ['player@123', 'user#456', 'test!player'];
      
      invalidNicknames.forEach(nickname => {
        const result = Validator.validateNickname(nickname);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ERROR_CODES.NICKNAME_CONTAINS_INVALID_CHARS)).toBe(true);
      });
    });
  });

  describe('下注金额验证', () => {
    test('应该接受有效的下注金额', () => {
      const validAmounts = [10, 50, 100, 500, 1000];
      const context = { minAmount: 10, maxAmount: 1000 };
      
      validAmounts.forEach(amount => {
        const result = Validator.validateBetAmount(amount, context);
        expect(result.valid).toBe(true);
        expect(result.data).toBe(amount);
      });
    });

    test('应该拒绝负数或零', () => {
      const invalidAmounts = [-10, 0, -1];
      
      invalidAmounts.forEach(amount => {
        const result = Validator.validateBetAmount(amount);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ERROR_CODES.GAME_INVALID_BET)).toBe(true);
      });
    });

    test('应该验证最小和最大金额限制', () => {
      const context = { minAmount: 50, maxAmount: 500 };
      
      // 小于最小值
      const tooLow = Validator.validateBetAmount(30, context);
      expect(tooLow.valid).toBe(false);
      
      // 大于最大值
      const tooHigh = Validator.validateBetAmount(600, context);
      expect(tooHigh.valid).toBe(false);
      
      // 正确范围内
      const valid = Validator.validateBetAmount(100, context);
      expect(valid.valid).toBe(true);
    });

    test('应该拒绝非数字类型', () => {
      const invalidTypes = ['100', null, undefined, {}, [], true];
      
      invalidTypes.forEach(amount => {
        const result = Validator.validateBetAmount(amount);
        expect(result.valid).toBe(false);
        expect(result.errors.some(e => e.code === ERROR_CODES.INVALID_DATA_TYPE)).toBe(true);
      });
    });
  });

  describe('房间设置验证', () => {
    test('应该接受有效的房间设置', () => {
      const validSettings = {
        maxPlayers: 6,
        initialChips: 1000,
        timeLimit: 30,
        allowSpectators: true,
        isPrivate: false
      };
      
      const result = Validator.validateRoomSettings(validSettings);
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(validSettings);
    });

    test('应该拒绝无效的最大玩家数', () => {
      const invalidSettings = [
        { maxPlayers: 1 },  // 太少
        { maxPlayers: 11 }, // 太多
        { maxPlayers: '6' }, // 错误类型
      ];
      
      invalidSettings.forEach(settings => {
        const result = Validator.validateRoomSettings(settings);
        expect(result.valid).toBe(false);
      });
    });

    test('应该拒绝无效的初始筹码', () => {
      const invalidSettings = [
        { initialChips: 0 },     // 太少
        { initialChips: 100001 }, // 太多
        { initialChips: -100 },   // 负数
      ];
      
      invalidSettings.forEach(settings => {
        const result = Validator.validateRoomSettings(settings);
        expect(result.valid).toBe(false);
      });
    });

    test('应该拒绝无效的时间限制', () => {
      const invalidSettings = [
        { timeLimit: 4 },  // 太短
        { timeLimit: 121 }, // 太长
        { timeLimit: '30' }, // 错误类型
      ];
      
      invalidSettings.forEach(settings => {
        const result = Validator.validateRoomSettings(settings);
        expect(result.valid).toBe(false);
      });
    });

    test('应该使用默认值填充缺失字段', () => {
      const partialSettings = {
        maxPlayers: 8
      };
      
      const result = Validator.validateRoomSettings(partialSettings);
      expect(result.valid).toBe(true);
      expect(result.data.initialChips).toBeDefined();
      expect(result.data.timeLimit).toBeDefined();
      expect(result.data.allowSpectators).toBeDefined();
    });
  });

  describe('玩家动作验证', () => {
    const gameContext = {
      currentPlayer: 'player1',
      currentBet: 50,
      playerBet: 0,
      playerChips: 500,
      minRaise: 50,
      phase: 'preflop'
    };

    test('应该验证有效的玩家动作', () => {
      const validActions = [
        ['player1', 'call', 50],
        ['player1', 'raise', 100],
        ['player1', 'fold', 0],
        ['player1', 'check', 0]
      ];
      
      validActions.forEach(([playerId, action, amount]) => {
        const result = Validator.validatePlayerAction(playerId, action, amount, gameContext);
        if (action === 'check' && gameContext.currentBet > 0) {
          // check在有下注时应该失败
          expect(result.valid).toBe(false);
        } else {
          expect(result.valid).toBe(true);
        }
      });
    });

    test('应该拒绝非当前玩家的动作', () => {
      const result = Validator.validatePlayerAction('player2', 'call', 50, gameContext);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.code === ERROR_CODES.PLAYER_NOT_CURRENT_TURN)).toBe(true);
    });

    test('应该验证加注金额', () => {
      // 加注金额不足
      const tooLow = Validator.validatePlayerAction('player1', 'raise', 60, gameContext);
      expect(tooLow.valid).toBe(false);
      
      // 超过玩家筹码
      const tooHigh = Validator.validatePlayerAction('player1', 'raise', 600, gameContext);
      expect(tooHigh.valid).toBe(false);
      
      // 有效加注
      const valid = Validator.validatePlayerAction('player1', 'raise', 100, gameContext);
      expect(valid.valid).toBe(true);
    });

    test('应该验证跟注金额', () => {
      // 错误的跟注金额
      const wrongAmount = Validator.validatePlayerAction('player1', 'call', 30, gameContext);
      expect(wrongAmount.valid).toBe(false);
      
      // 正确的跟注金额
      const correctAmount = Validator.validatePlayerAction('player1', 'call', 50, gameContext);
      expect(correctAmount.valid).toBe(true);
    });
  });

  describe('错误创建', () => {
    test('应该创建标准错误对象', () => {
      const error = Validator.createGameError(
        ERROR_CODES.PLAYER_NOT_FOUND,
        '玩家未找到',
        { playerId: 'test123' }
      );
      
      expect(error.code).toBe(ERROR_CODES.PLAYER_NOT_FOUND);
      expect(error.message).toBe('玩家未找到');
      expect(error.details.playerId).toBe('test123');
      expect(error.timestamp).toBeDefined();
      expect(error.isGameError).toBe(true);
    });

    test('应该支持可选参数', () => {
      const simpleError = Validator.createGameError(ERROR_CODES.VALIDATION_FAILED);
      
      expect(simpleError.code).toBe(ERROR_CODES.VALIDATION_FAILED);
      expect(simpleError.message).toBeTruthy();
      expect(simpleError.details).toEqual({});
    });
  });

  describe('性能测试', () => {
    test('验证器应该有良好的性能', () => {
      const startTime = Date.now();
      
      // 执行大量验证
      for (let i = 0; i < 1000; i++) {
        Validator.validatePlayerId(`player_${i}`);
        Validator.validateNickname(`玩家${i}`);
        Validator.validateBetAmount(100);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 1000次验证应该在500ms内完成
      expect(duration).toBeLessThan(500);
    });

    test('缓存应该提高性能', () => {
      const testId = 'performance_test_player';
      
      // 第一次验证
      const start1 = Date.now();
      Validator.validatePlayerId(testId);
      const duration1 = Date.now() - start1;
      
      // 第二次验证（应该使用缓存）
      const start2 = Date.now();
      Validator.validatePlayerId(testId);
      const duration2 = Date.now() - start2;
      
      // 第二次应该更快（缓存效果）
      expect(duration2).toBeLessThanOrEqual(duration1);
    });
  });

  describe('边界情况测试', () => {
    test('应该处理极端输入', () => {
      const extremeInputs = [
        null,
        undefined,
        0,
        -1,
        Number.MAX_SAFE_INTEGER,
        Number.MIN_SAFE_INTEGER,
        '',
        ' ',
        '\n',
        '\t',
        {},
        [],
        function() {},
        Symbol('test')
      ];
      
      extremeInputs.forEach(input => {
        // 这些都不应该导致崩溃
        expect(() => {
          Validator.validatePlayerId(input);
          Validator.validateNickname(input);
          Validator.validateBetAmount(input);
        }).not.toThrow();
      });
    });

    test('应该处理循环引用对象', () => {
      const circular = {};
      circular.self = circular;
      
      expect(() => {
        Validator.validateRoomSettings(circular);
      }).not.toThrow();
    });
  });
});
