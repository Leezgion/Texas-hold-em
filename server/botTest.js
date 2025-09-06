/**
 * 德州扑克机器人自动测试系统
 * 模拟两个智能机器人进行完整的游戏测试
 */

const io = require('socket.io-client');
const { v4: uuidv4 } = require('uuid');

class PokerBot {
    constructor(name, strategy = 'balanced') {
        this.name = name;
        this.strategy = strategy; // 'aggressive', 'conservative', 'balanced'
        this.socket = null;
        this.deviceId = `bot_${uuidv4().replace(/-/g, '_')}`;
        this.playerId = null;
        this.chips = 0;
        this.cards = [];
        this.roomId = null;
        this.isConnected = false;
        this.gameState = null;
        this.position = null;
        
        // 策略参数
        this.strategies = {
            aggressive: {
                bluffRate: 0.3,
                callThreshold: 0.4,
                raiseThreshold: 0.6,
                allInThreshold: 0.8
            },
            conservative: {
                bluffRate: 0.1,
                callThreshold: 0.7,
                raiseThreshold: 0.8,
                allInThreshold: 0.95
            },
            balanced: {
                bluffRate: 0.2,
                callThreshold: 0.5,
                raiseThreshold: 0.7,
                allInThreshold: 0.9
            }
        };
        
        this.currentStrategy = this.strategies[strategy];
        
        // 统计数据
        this.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            totalActions: 0,
            bluffs: 0,
            folds: 0,
            calls: 0,
            raises: 0,
            allIns: 0
        };
    }

    /**
     * 连接到服务器
     */
    async connect(serverUrl = 'http://localhost:3001') {
        return new Promise((resolve, reject) => {
            this.socket = io(serverUrl);
            
            this.socket.on('connect', () => {
                console.log(`🤖 [${this.name}] 已连接到服务器`);
                this.isConnected = true;
                this.registerDevice();
                resolve();
            });
            
            this.socket.on('disconnect', () => {
                console.log(`🤖 [${this.name}] 已断开连接`);
                this.isConnected = false;
            });
            
            this.socket.on('connect_error', (error) => {
                console.error(`🤖 [${this.name}] 连接错误:`, error);
                reject(error);
            });
            
            this.setupEventHandlers();
        });
    }

    /**
     * 注册设备
     */
    registerDevice() {
        console.log(`🤖 [${this.name}] 注册设备: ${this.deviceId}`);
        this.socket.emit('registerDevice', {
            deviceId: this.deviceId,
            socketId: this.socket.id
        });
        
        // 等待一下再进行后续操作
        setTimeout(() => {
            console.log(`🤖 [${this.name}] 设备注册完成`);
        }, 1000);
    }

    /**
     * 设置事件处理器
     */
    setupEventHandlers() {
        // 游戏状态更新
        this.socket.on('gameStateUpdate', (data) => {
            this.handleGameStateUpdate(data);
        });
        
        // 轮到我行动
        this.socket.on('actionRequired', (data) => {
            this.handleActionRequired(data);
        });
        
        // 游戏结束
        this.socket.on('gameEnd', (data) => {
            this.handleGameEnd(data);
        });
        
        // 房间更新
        this.socket.on('roomUpdate', (data) => {
            this.handleRoomUpdate(data);
        });
        
        // 错误处理
        this.socket.on('error', (error) => {
            console.error(`🤖 [${this.name}] 收到错误:`, error);
        });
        
        // 成功事件
        this.socket.on('roomJoined', (data) => {
            console.log(`🤖 [${this.name}] 成功加入房间:`, data);
            this.roomId = data.roomId;
            this.playerId = data.playerId;
        });
        
        this.socket.on('roomCreated', (data) => {
            console.log(`🤖 [${this.name}] 成功创建房间:`, data);
            this.roomId = data.roomId;
            // 房间创建后，等待其他玩家加入
        });
        
        // 添加设备注册成功的确认
        this.socket.on('deviceRegistered', (data) => {
            console.log(`🤖 [${this.name}] 设备注册成功:`, data);
        });
        
        // 添加更多事件监听
        this.socket.on('playerJoined', (data) => {
            console.log(`🤖 [${this.name}] 玩家加入:`, data);
        });
        
        this.socket.on('gameStarted', (data) => {
            console.log(`🤖 [${this.name}] 游戏开始!`, data);
        });
        
        this.socket.on('roomUpdate', (data) => {
            console.log(`🤖 [${this.name}] 房间更新:`, data);
            
            // 如果我是房主并且房间有2个或更多玩家，自动开始游戏
            if (this.name === 'AlphaBot' && this.roomId && data.players && data.players.length >= 2) {
                const me = data.players.find(p => p.id === this.deviceId);
                if (me && me.isHost) {
                    console.log(`🎮 [${this.name}] 自动开始游戏 (${data.players.length} 个玩家)`);
                    setTimeout(() => {
                        this.socket.emit('startGame', this.roomId);
                    }, 2000);
                }
            }
        });
    }

    /**
     * 处理游戏状态更新
     */
    handleGameStateUpdate(data) {
        this.gameState = data;
        this.chips = data.players?.find(p => p.id === this.playerId)?.chips || this.chips;
        this.cards = data.players?.find(p => p.id === this.playerId)?.cards || this.cards;
        
        console.log(`🤖 [${this.name}] 游戏状态更新 - 阶段: ${data.phase}, 底池: ${data.pot}, 我的筹码: ${this.chips}`);
    }

    /**
     * 处理需要行动的情况
     */
    async handleActionRequired(data) {
        console.log(`🤖 [${this.name}] 轮到我行动 - 当前下注: ${data.currentBet}, 我的下注: ${data.playerBet}`);
        
        // 等待1-3秒模拟思考
        const thinkTime = 1000 + Math.random() * 2000;
        await this.sleep(thinkTime);
        
        const action = this.decideAction(data);
        this.executeAction(action);
    }

    /**
     * 处理游戏结束
     */
    handleGameEnd(data) {
        this.stats.gamesPlayed++;
        
        if (data.winner === this.playerId) {
            this.stats.gamesWon++;
            console.log(`🎉 [${this.name}] 赢得了游戏! 奖金: ${data.winAmount}`);
        } else {
            console.log(`😔 [${this.name}] 游戏结束，赢家: ${data.winner}`);
        }
        
        // 显示统计
        this.showStats();
    }

    /**
     * 处理房间更新
     */
    handleRoomUpdate(data) {
        console.log(`🤖 [${this.name}] 房间更新 - 玩家数: ${data.players?.length || 0}`);
    }

    /**
     * 决定行动
     */
    decideAction(data) {
        const { currentBet, playerBet, minRaise, maxBet } = data;
        const callAmount = currentBet - playerBet;
        
        // 计算手牌强度 (简化版)
        const handStrength = this.evaluateHandStrength();
        
        // 根据策略和手牌强度决定行动
        const random = Math.random();
        
        // 如果不需要跟注 (当前下注等于玩家下注)
        if (callAmount === 0) {
            if (handStrength > this.currentStrategy.raiseThreshold) {
                return this.createRaiseAction(minRaise, maxBet);
            } else if (random < 0.3) {
                return this.createRaiseAction(minRaise, maxBet);
            } else {
                return { type: 'check' };
            }
        }
        
        // 需要跟注的情况
        if (handStrength > this.currentStrategy.allInThreshold) {
            this.stats.allIns++;
            return { type: 'allin' };
        } else if (handStrength > this.currentStrategy.raiseThreshold) {
            this.stats.raises++;
            return this.createRaiseAction(minRaise, maxBet);
        } else if (handStrength > this.currentStrategy.callThreshold) {
            this.stats.calls++;
            return { type: 'call' };
        } else if (random < this.currentStrategy.bluffRate) {
            this.stats.bluffs++;
            return this.createRaiseAction(minRaise, maxBet);
        } else {
            this.stats.folds++;
            return { type: 'fold' };
        }
    }

    /**
     * 创建加注行动
     */
    createRaiseAction(minRaise, maxBet) {
        // 随机选择加注金额 (在最小加注和最大下注之间)
        const raiseAmount = minRaise + Math.random() * Math.min(maxBet - minRaise, this.chips - minRaise);
        return {
            type: 'raise',
            amount: Math.floor(raiseAmount)
        };
    }

    /**
     * 评估手牌强度 (简化版)
     */
    evaluateHandStrength() {
        if (!this.cards || this.cards.length < 2) {
            return Math.random() * 0.5; // 没有牌时随机返回较低值
        }
        
        // 简化的手牌评估
        const card1 = this.cards[0];
        const card2 = this.cards[1];
        
        let strength = 0;
        
        // 对子
        if (card1.rank === card2.rank) {
            strength += 0.6;
            if (card1.rank >= 10) strength += 0.2; // 高对子
        }
        
        // 同花
        if (card1.suit === card2.suit) {
            strength += 0.1;
        }
        
        // 连牌
        const rank1 = this.getNumericRank(card1.rank);
        const rank2 = this.getNumericRank(card2.rank);
        if (Math.abs(rank1 - rank2) === 1) {
            strength += 0.1;
        }
        
        // 高牌
        const highCard = Math.max(rank1, rank2);
        strength += highCard / 14 * 0.3;
        
        // 加入一些随机性
        strength += (Math.random() - 0.5) * 0.2;
        
        return Math.max(0, Math.min(1, strength));
    }

    /**
     * 获取数字排名
     */
    getNumericRank(rank) {
        const ranks = { 'A': 14, 'K': 13, 'Q': 12, 'J': 11 };
        return ranks[rank] || parseInt(rank) || 2;
    }

    /**
     * 执行行动
     */
    executeAction(action) {
        console.log(`🤖 [${this.name}] 执行行动:`, action);
        this.stats.totalActions++;
        
        this.socket.emit('gameAction', {
            roomId: this.roomId,
            action: action.type,
            amount: action.amount || 0
        });
    }

    /**
     * 创建房间
     */
    createRoom() {
        const settings = {
            playerName: this.name,
            settings: {
                maxPlayers: 6,
                buyIn: 1000,
                smallBlind: 10,
                bigBlind: 20,
                isPrivate: false
            }
        };
        
        console.log(`🤖 [${this.name}] 创建房间，设置:`, settings);
        
        // 等待设备注册完成后再创建房间
        setTimeout(() => {
            this.socket.emit('createRoom', settings);
        }, 2000);
    }

    /**
     * 加入房间
     */
    joinRoom(roomId) {
        console.log(`🤖 [${this.name}] 尝试加入房间: ${roomId}`);
        
        this.socket.emit('joinRoom', {
            roomId: roomId,
            deviceId: this.deviceId,
            playerName: this.name  // 添加玩家名称
        });
    }

    /**
     * 显示统计信息
     */
    showStats() {
        const winRate = this.stats.gamesPlayed > 0 ? 
            (this.stats.gamesWon / this.stats.gamesPlayed * 100).toFixed(1) : 0;
            
        console.log(`📊 [${this.name}] 统计信息:`);
        console.log(`   游戏场次: ${this.stats.gamesPlayed}`);
        console.log(`   胜率: ${winRate}%`);
        console.log(`   总行动: ${this.stats.totalActions}`);
        console.log(`   弃牌: ${this.stats.folds}, 跟注: ${this.stats.calls}, 加注: ${this.stats.raises}`);
        console.log(`   全押: ${this.stats.allIns}, 诈唬: ${this.stats.bluffs}`);
    }

    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 断开连接
     */
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}

/**
 * 机器人测试管理器
 */
class BotTestManager {
    constructor() {
        this.bots = [];
        this.testResults = {
            startTime: new Date(),
            endTime: null,
            totalGames: 0,
            errors: [],
            performance: {}
        };
    }

    /**
     * 创建和启动机器人测试
     */
    async startBotTest() {
        console.log('🚀 启动德州扑克机器人自动测试...\n');
        
        try {
            // 创建两个机器人
            const bot1 = new PokerBot('AlphaBot', 'aggressive');
            const bot2 = new PokerBot('BetaBot', 'conservative');
            
            this.bots = [bot1, bot2];
            
            // 连接到服务器
            console.log('📡 连接机器人到服务器...');
            await bot1.connect();
            await bot2.connect();
            
            await this.sleep(1000);
            
            // Bot1 创建房间
            console.log('🏠 AlphaBot 创建游戏房间...');
            bot1.createRoom();
            
            await this.sleep(2000);
            
            // Bot2 加入房间
            console.log('👥 等待房间创建完成...');
            setTimeout(() => {
                if (bot1.roomId) {
                    console.log('👥 BetaBot 加入游戏房间...');
                    bot2.joinRoom(bot1.roomId);
                } else {
                    console.log('⚠️ 房间ID未找到，尝试加入默认房间...');
                    bot2.joinRoom('9QZU69'); // 使用创建的房间ID
                }
            }, 4000);
            
            // 监控测试进度
            this.monitorTest();
            
            console.log('✅ 机器人测试已启动！');
            console.log('🎮 访问 http://localhost:5173 观看机器人游戏');
            console.log('📊 测试将持续运行，按 Ctrl+C 停止\n');
            
        } catch (error) {
            console.error('❌ 启动机器人测试失败:', error);
            this.testResults.errors.push({
                time: new Date(),
                error: error.message
            });
        }
    }

    /**
     * 监控测试进度
     */
    monitorTest() {
        // 每30秒显示一次统计信息
        setInterval(() => {
            console.log('\n📈 === 机器人测试进度报告 ===');
            this.bots.forEach(bot => {
                bot.showStats();
            });
            console.log('================================\n');
        }, 30000);
        
        // 每5分钟显示详细性能报告
        setInterval(() => {
            this.generatePerformanceReport();
        }, 300000);
    }

    /**
     * 生成性能报告
     */
    generatePerformanceReport() {
        console.log('\n🔍 === 详细性能报告 ===');
        
        const totalGames = this.bots.reduce((sum, bot) => sum + bot.stats.gamesPlayed, 0);
        const totalActions = this.bots.reduce((sum, bot) => sum + bot.stats.totalActions, 0);
        
        console.log(`测试运行时间: ${Math.floor((Date.now() - this.testResults.startTime) / 1000 / 60)} 分钟`);
        console.log(`总游戏数: ${totalGames}`);
        console.log(`总行动数: ${totalActions}`);
        console.log(`错误数: ${this.testResults.errors.length}`);
        
        if (this.testResults.errors.length > 0) {
            console.log('最近错误:');
            this.testResults.errors.slice(-3).forEach(error => {
                console.log(`  - ${error.time.toLocaleTimeString()}: ${error.error}`);
            });
        }
        
        console.log('========================\n');
    }

    /**
     * 睡眠函数
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 停止测试
     */
    stopTest() {
        console.log('\n🛑 停止机器人测试...');
        
        this.bots.forEach(bot => {
            bot.disconnect();
        });
        
        this.testResults.endTime = new Date();
        this.generateFinalReport();
    }

    /**
     * 生成最终报告
     */
    generateFinalReport() {
        console.log('\n📋 === 最终测试报告 ===');
        
        const duration = this.testResults.endTime - this.testResults.startTime;
        const totalGames = this.bots.reduce((sum, bot) => sum + bot.stats.gamesPlayed, 0);
        const totalActions = this.bots.reduce((sum, bot) => sum + bot.stats.totalActions, 0);
        
        console.log(`测试总时长: ${Math.floor(duration / 1000 / 60)} 分钟`);
        console.log(`总游戏数: ${totalGames}`);
        console.log(`总行动数: ${totalActions}`);
        console.log(`平均游戏时长: ${totalGames > 0 ? Math.floor(duration / totalGames / 1000) : 0} 秒`);
        console.log(`错误总数: ${this.testResults.errors.length}`);
        
        this.bots.forEach(bot => {
            console.log(`\n${bot.name} 最终统计:`);
            bot.showStats();
        });
        
        console.log('\n✅ 机器人测试完成！');
        console.log('========================\n');
    }
}

// 如果直接运行此文件，启动测试
if (require.main === module) {
    const testManager = new BotTestManager();
    
    // 启动测试
    testManager.startBotTest();
    
    // 优雅关闭
    process.on('SIGINT', () => {
        testManager.stopTest();
        process.exit(0);
    });
}

module.exports = { PokerBot, BotTestManager };
