# 当前终端状态记录

## 活跃终端列表

### SERVER_TERMINAL 
- **终端ID**: 9f0b4770-7883-4e23-af58-c73c2a91fc96
- **用途**: 后端服务器 (server.js)
- **状态**: ✅ 运行中
- **端口**: 3001
- **命令**: `cd "d:\GITHUB\Texas-hold'em\server" && node server.js`

### CLIENT_TERMINAL
- **终端ID**: 3dba8452-aab8-4d5b-9c29-390abd054c93
- **用途**: 前端开发服务器 (Vite)
- **状态**: ✅ 运行中
- **端口**: 5173
- **命令**: `cd "d:\GITHUB\Texas-hold'em\client" && npm run dev`

### BOT_TEST_TERMINAL
- **终端ID**: 2aa63c5d-ef13-43a7-8aa6-b6695469aca3
- **用途**: 机器人测试系统 (enhancedBotTest.js)
- **状态**: ✅ 运行中 - 正在进行游戏
- **房间**: AHNCY4
- **命令**: `cd "d:\GITHUB\Texas-hold'em\server" && node enhancedBotTest.js`

### MONITOR_TERMINAL
- **用途**: 系统监控和状态查看
- **状态**: 待用
- **命令**: 根据需要执行监控命令

### UTILITY_TERMINAL
- **用途**: 临时操作和工具命令
- **状态**: 待用
- **命令**: 根据需要执行临时命令

## 当前游戏状态
- **活跃房间**: AHNCY4
- **游戏阶段**: preflop (翻牌前)
- **参与机器人**: AlphaBot (激进型), BetaBot (保守型)
- **访问链接**: http://192.168.110.69:5173/game/AHNCY4

## 操作指南

### 重启服务器
在 SERVER_TERMINAL (ID: 9f0b4770-7883-4e23-af58-c73c2a91fc96) 中:
1. Ctrl+C 停止当前服务器
2. 执行: `node server.js`

### 重启前端
在 CLIENT_TERMINAL (ID: 3dba8452-aab8-4d5b-9c29-390abd054c93) 中:
1. Ctrl+C 停止当前服务器
2. 执行: `npm run dev`

### 重启机器人测试
在 BOT_TEST_TERMINAL (ID: 2aa63c5d-ef13-43a7-8aa6-b6695469aca3) 中:
1. Ctrl+C 停止当前测试
2. 执行: `node enhancedBotTest.js`

### 查看服务器日志
```bash
# 使用 get_terminal_output 工具查看对应终端的输出
get_terminal_output(id="9f0b4770-7883-4e23-af58-c73c2a91fc96")  # 服务器日志
get_terminal_output(id="3dba8452-aab8-4d5b-9c29-390abd054c93")  # 前端日志  
get_terminal_output(id="2aa63c5d-ef13-43a7-8aa6-b6695469aca3")  # 机器人测试日志
```

## 注意事项
1. 每个终端都有专门用途，不要混用
2. 重启服务时务必使用对应的专用终端
3. 保持终端ID记录的准确性
4. 定期更新终端状态记录
