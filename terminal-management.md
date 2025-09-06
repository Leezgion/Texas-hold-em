# 终端管理规则文档

## 终端分配规范

### 核心服务终端
1. **SERVER_TERMINAL** - 后端服务器终端
   - 用途: 运行 Node.js 服务器 (server.js)
   - 命令: `cd server && node server.js`
   - 状态: 长期运行，除非需要重启
   - 端口: 3001

2. **CLIENT_TERMINAL** - 前端开发服务器终端
   - 用途: 运行 Vite 前端开发服务器
   - 命令: `cd client && npm run dev`
   - 状态: 长期运行，除非需要重启
   - 端口: 5173

### 监控和测试终端
3. **BOT_TEST_TERMINAL** - 机器人测试终端
   - 用途: 运行机器人自动测试 (enhancedBotTest.js)
   - 命令: `cd server && node enhancedBotTest.js`
   - 状态: 测试期间运行，可随时重启

4. **MONITOR_TERMINAL** - 系统监控终端
   - 用途: 监控游戏状态、日志输出、性能指标
   - 命令: 各种监控脚本和实时日志查看
   - 状态: 按需使用

5. **UTILITY_TERMINAL** - 工具操作终端
   - 用途: 执行临时命令、文件操作、包管理等
   - 命令: 各种临时性命令
   - 状态: 临时使用

## 终端操作规则

### 启动顺序
1. 首先启动 SERVER_TERMINAL (后端服务器)
2. 然后启动 CLIENT_TERMINAL (前端服务器)
3. 根据需要启动测试和监控终端

### 重启规则
- **服务器重启**: 只在 SERVER_TERMINAL 中操作
- **前端重启**: 只在 CLIENT_TERMINAL 中操作
- **测试重启**: 只在 BOT_TEST_TERMINAL 中操作

### 终端标识
每个终端都会有明确的标识和用途说明，避免混淆。

### 日志管理
- 服务器日志: SERVER_TERMINAL 输出
- 前端日志: CLIENT_TERMINAL 输出
- 测试日志: BOT_TEST_TERMINAL 输出
- 监控日志: MONITOR_TERMINAL 输出

## 命令模板

### 服务器启动
```bash
# SERVER_TERMINAL
cd "d:\GITHUB\Texas-hold'em\server"
node server.js
```

### 前端启动
```bash
# CLIENT_TERMINAL
cd "d:\GITHUB\Texas-hold'em\client"
npm run dev
```

### 机器人测试
```bash
# BOT_TEST_TERMINAL
cd "d:\GITHUB\Texas-hold'em\server"
node enhancedBotTest.js
```

### 服务器重启
```bash
# SERVER_TERMINAL (Ctrl+C 停止当前进程，然后)
node server.js
```

### 清理所有进程 (仅在必要时使用)
```bash
# UTILITY_TERMINAL
taskkill /F /IM node.exe
```

## 注意事项
1. 避免在多个终端中运行相同的服务
2. 重启服务时优先使用原有终端
3. 保持终端的专一性和持久性
4. 记录每个终端的当前状态和用途
