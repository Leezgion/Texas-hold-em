# 德州扑克游戏 (Texas Hold'em) 🎮

一个功能丰富、支持高度自定义的实时网页版德州扑克游戏，专为朋友间的私密牌局设计。

## ✨ 最新更新 (v2.0 - 2025-10-13)

### 🎉 重大改进

- ✅ **Toast通知系统** - 替代原生alert，美观友好的通知弹窗
- ✅ **游戏日志** - 实时显示所有玩家操作历史
- ✅ **断线重连** - 自动重连+UI提示，网络中断不怕
- ✅ **防重复提交** - 避免误操作，操作更安全
- ✅ **键盘快捷键** - F/C/R/A快速操作，效率翻倍
- ✅ **边池显示** - All-in场景清晰展示边池
- ✅ **可访问性改进** - ARIA标签，键盘导航支持

## 🎯 功能特性

### 核心功能

- 🎮 创建自定义游戏房间
- 👥 支持2-10人游戏
- ⚙️ 可自定义游戏规则（时长、Straddle、All-in发牌次数等）
- 💰 补码和换座功能
- 🃏 完整的德州扑克规则实现
- 🔄 实时多人游戏体验
- 📱 响应式设计，支持移动端

### 用户体验

- 🎨 现代化UI设计（Tailwind CSS）
- ⌨️ 键盘快捷键支持（F/C/R/A/Esc）
- 🔔 Toast通知系统（4种类型）
- 📊 实时游戏日志（最近20条）
- 🔄 断线自动重连
- 🛡️ 防重复提交保护
- 💰 边池清晰显示

## 🚀 技术栈

### 前端

- **框架**: React 18.2.0 + Vite 4.4.5
- **状态管理**: Zustand 4.4.1
- **实时通信**: Socket.io-client 4.7.2
- **路由**: React Router 6.8.1
- **样式**: Tailwind CSS 3.3.2
- **图标**: Lucide-react 0.541.0

### 后端

- **运行时**: Node.js
- **框架**: Express
- **实时通信**: Socket.io 4.7.2
- **游戏逻辑**: 自定义引擎

## 📦 安装和运行

### 1. 安装依赖

```bash
# 安装服务器端依赖
cd server
npm install

# 安装客户端依赖
cd client
npm install
```

### 2. 启动项目

```bash
# 启动服务器（在server目录下）
cd server
npm run dev

# 启动客户端（在client目录下，新开一个终端）
cd client
npm run dev
```

### 2.1 真实浏览器回归入口

当前仓库的真实浏览器回归，不再依赖口头步骤或临时命令。请直接使用：

- [docs/runbooks/real-browser-regression-runbook.md](./docs/runbooks/real-browser-regression-runbook.md)
- [scripts/manage-real-browser-env.ps1](./scripts/manage-real-browser-env.ps1)
- [scripts/browser-room-workflow.ps1](./scripts/browser-room-workflow.ps1)

这套 runbook 的固定端口约定是：

- regression server: `3101`
- regression client: `5173`

如果你只是普通开发，可以继续用下面的常规启动方式；如果你是在做真实浏览器矩阵、重连验证或产品化回归，优先走 runbook，不要混用旧流程。

### 3. 访问游戏

#### 本地访问

- 客户端：<http://localhost:5173/>
- 服务器：<http://localhost:3001>
- 浏览器回归环境：<http://127.0.0.1:5173/> 配合 <http://127.0.0.1:3101/>

#### 局域网访问（多设备游戏）

- 使用 `start-lan.ps1` 启动脚本自动配置
- 其他设备访问：http://[您的IP]:5173
- 例如：<http://192.168.1.106:5173>

#### 快速启动（推荐）

```powershell
# 局域网多设备访问
./start-lan.ps1

# 或者手动启动
cd server && npm run dev  # 开发模式，支持自动重启
cd client && npm run dev  # 热重载模式
```

## ⌨️ 键盘快捷键

| 快捷键 | 功能 | 说明 |
|--------|------|------|
| **F** | 弃牌 | Fold - 放弃当前手牌 |
| **C** | 过牌/跟注 | Check/Call - 过牌或跟注 |
| **R** | 加注 | Raise - 打开加注面板 |
| **A** | All-in | 全押所有筹码 |
| **Esc** | 取消 | 关闭加注面板 |

💡 提示：快捷键仅在轮到你操作时有效

## 🎲 游戏规则

### 房间设置

- **游戏时长**: 30分钟为单位，可自定义
- **游戏人数**: 2-10人
- **Straddle**: 可选择是否允许UTG位置Straddle
- **All-in发牌次数**: 1-4次，决定多人All-in时的发牌次数
- **补码规则**: 允许在特定条件下补充筹码
- **初始筹码**: 1000

### 游戏流程

1. 创建房间并自定义规则
2. 分享房间链接邀请朋友（6位房间ID）
3. 达到人数要求后开始游戏
4. 实时进行德州扑克游戏
5. 支持换座、补码等高级功能
6. 查看游戏日志了解所有操作

## 📁 项目结构

```
Texas-hold'em/
├── server/                  # 服务器端
│   ├── gameLogic/          # 游戏逻辑引擎
│   │   ├── Card.js         # 扑克牌
│   │   ├── Deck.js         # 牌组
│   │   ├── HandEvaluator.js # 牌型评估
│   │   ├── GameLogic.js    # 核心游戏逻辑
│   │   └── RoomManager.js  # 房间管理
│   ├── interfaces/         # 接口层
│   │   ├── SocketEventManager.js  # Socket事件管理
│   │   └── APIResponseManager.js  # API响应管理
│   ├── validators/         # 验证器
│   ├── tests/             # 测试文件
│   └── server.js          # 服务器入口
│
├── client/                 # 客户端
│   ├── src/
│   │   ├── components/    # React组件
│   │   │   ├── Toast.jsx           # Toast通知 ✨
│   │   │   ├── GameLog.jsx         # 游戏日志 ✨
│   │   │   ├── ReconnectingOverlay.jsx  # 重连UI ✨
│   │   │   ├── ActionButtons.jsx   # 操作按钮
│   │   │   ├── GameRoom.jsx       # 游戏房间
│   │   │   └── ...
│   │   ├── contexts/      # 状态管理
│   │   │   └── GameContext.jsx    # Zustand状态
│   │   ├── hooks/         # 自定义Hooks
│   │   │   ├── useToast.js         # Toast Hook ✨
│   │   │   └── useKeyboardShortcuts.js  # 键盘快捷键 ✨
│   │   ├── utils/         # 工具函数
│   │   └── App.jsx        # 应用入口
│   └── package.json
│
├── 重构完成总结.md         # 重构文档 ✨
├── 快速使用指南.md         # 使用指南 ✨
├── 前端审查报告.md         # 审查报告
├── 前后端对齐审查报告.md    # 对齐报告
└── README.md
```

## 📚 文档说明

### 用户文档

- **[快速使用指南.md](./快速使用指南.md)** - 游戏玩法、操作说明
- **[README.md](./README.md)** - 项目概览、安装运行

### 技术文档

- **[重构完成总结.md](./重构完成总结.md)** - 最新改进详情
- **[前端审查报告.md](./前端审查报告.md)** - 代码审查结果
- **[前后端对齐审查报告.md](./前后端对齐审查报告.md)** - 接口验证
- **[修复指南-防重复提交.md](./修复指南-防重复提交.md)** - 技术实现

## 🔧 开发说明

### 开发模式

```bash
# 服务器（支持自动重启）
cd server
npm run dev

# 客户端（支持热重载）
cd client
npm run dev
```

### 真实浏览器回归模式

精确的启动、验证、取证、清理流程见：

- [docs/runbooks/real-browser-regression-runbook.md](./docs/runbooks/real-browser-regression-runbook.md)

常用命令：

```powershell
pwsh -NoProfile -File .\scripts\manage-real-browser-env.ps1 start-all -CleanProfile
pwsh -NoProfile -File .\scripts\manage-real-browser-env.ps1 status
pwsh -NoProfile -File .\scripts\browser-room-workflow.ps1 show-current-room
pwsh -NoProfile -File .\scripts\manage-real-browser-env.ps1 stop-all
```

### 构建生产版本

```bash
# 客户端构建
cd client
npm run build

# 服务器（已包含在npm start中）
cd server
npm start
```

## ⚠️ 注意事项

- 游戏状态存储在服务器内存中，重启服务器会丢失所有游戏数据
- 建议在局域网或稳定的网络环境下使用
- 支持现代浏览器（Chrome 90+、Firefox 88+、Safari 14+、Edge 90+）
- 推荐屏幕分辨率：1024x768 及以上
- 移动端建议横屏使用

## 🐛 常见问题

### 连接问题

- 确保服务器和客户端都已启动
- 检查防火墙设置
- 常规开发确认端口 `3001` 和 `5173`
- 浏览器回归确认端口 `3101` 和 `5173`
- 若 `start-all` 返回失败，不要立刻重试；先按 runbook 检查 `status` 和 `.runlogs`

### 游戏问题

- 刷新页面会自动重连
- 断线后系统自动尝试重连
- 操作失败请查看Toast通知提示

## 📝 更新日志

### v2.0 (2025-10-13) - 重大重构

- ✅ 新增Toast通知系统
- ✅ 新增游戏日志组件
- ✅ 新增断线重连UI
- ✅ 新增防重复提交机制
- ✅ 新增键盘快捷键支持
- ✅ 新增边池显示
- ✅ 改进可访问性（ARIA标签）
- 🔧 优化错误处理
- 🔧 优化UI/UX体验

### v1.0 - 初始版本

- 基础游戏功能
- 房间系统
- 实时通信

## 📄 许可证

MIT License
