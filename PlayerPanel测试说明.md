// PlayerPanel组件功能测试说明

// 测试用例：
// 1. 显示入座玩家（有座位号的玩家）
// 2. 显示观战玩家（座位号为-1或isSpectator为true的玩家）  
// 3. 显示不同玩家状态：游戏中、观战中、等待下轮、已弃牌、All-in、未激活
// 4. 显示房主标识（Crown图标）
// 5. 显示当前玩家标识（"我"字样）
// 6. 点击展开/收起面板
// 7. 点击外部区域自动关闭面板
// 8. 响应式设计适配不同屏幕尺寸

// 模拟测试数据示例：
const testPlayers = [
  {
    id: 'player1',
    nickname: '房主-alpha_bot',
    seat: 0,
    chips: 1500,
    isHost: true,
    isActive: true,
    isSpectator: false,
    waitingForNextRound: false,
    folded: false,
    allIn: false
  },
  {
    id: 'player2', 
    nickname: 'BetaBot',
    seat: 1,
    chips: 800,
    isHost: false,
    isActive: true,
    isSpectator: false,
    waitingForNextRound: false,
    folded: true,
    allIn: false
  },
  {
    id: 'player3',
    nickname: '观众_123456',
    seat: -1,
    chips: 0,
    isHost: false,
    isActive: false,
    isSpectator: true,
    waitingForNextRound: false,
    folded: false,
    allIn: false
  }
];

// 预期效果：
// - 左上角显示人数统计：3/6 (2座 1观)
// - 点击后展开面板显示：
//   - 入座玩家：房主-alpha_bot (座1, 1500筹码, 游戏中), BetaBot (座2, 800筹码, 已弃牌)
//   - 观战玩家：观众_123456 (观战中)
// - 如果当前玩家ID匹配，显示对应的"(我)"标识
