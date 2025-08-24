# 德州扑克游戏 (Texas Hold'em)

一个功能丰富、支持高度自定义的实时网页版德州扑克游戏，专为朋友间的私密牌局设计。

## 功能特性

- 🎮 创建自定义游戏房间
- 👥 支持2-10人游戏
- ⚙️ 可自定义游戏规则（时长、Straddle、All-in发牌次数等）
- 💰 补码和换座功能
- 🃏 完整的德州扑克规则实现
- 🔄 实时多人游戏体验
- 📱 响应式设计，支持移动端

## 技术栈

- **前端**: React + Vite + Tailwind CSS + Socket.IO Client
- **后端**: Node.js + Express + Socket.IO

## 安装和运行

### 1. 安装依赖

```bash
# 安装服务器端依赖
cd server
npm install

# 安装客户端依赖
cd ../client
npm install
```

### 2. 启动项目

```bash
# 启动服务器（在server目录下）
cd server
npm start

# 启动客户端（在client目录下，新开一个终端）
cd client
npm run dev
```

### 3. 访问游戏

#### 本地访问
- 服务器：http://localhost:3001
- 客户端：http://localhost:5173

#### 局域网访问（多设备游戏）
- 使用 `start-lan.ps1` 启动脚本自动配置
- 其他设备访问：http://[您的IP]:5173
- 例如：http://192.168.1.106:5173

#### 快速启动（推荐）
```powershell
# 局域网多设备访问
./start-lan.ps1

# 或者手动启动
cd server && npm run dev  # 开发模式，支持自动重启
cd client && npm run dev  # 热重载模式
```

## 游戏规则

### 房间设置
- **游戏时长**: 30分钟为单位，可自定义
- **游戏人数**: 2-10人
- **Straddle**: 可选择是否允许UTG位置Straddle
- **All-in发牌次数**: 1-4次，决定多人All-in时的发牌次数
- **补码规则**: 允许在特定条件下补充筹码
- **初始筹码**: 1000

### 游戏流程
1. 创建房间并自定义规则
2. 分享房间链接邀请朋友
3. 达到人数要求后开始游戏
4. 实时进行德州扑克游戏
5. 支持换座、补码等高级功能

## 项目结构

```
├── server/          # 服务器端代码
│   ├── gameLogic/   # 游戏逻辑
│   ├── routes/      # 路由处理
│   └── server.js    # 主服务器文件
├── client/          # 客户端代码
│   ├── src/
│   │   ├── components/  # React组件
│   │   ├── contexts/    # 状态管理
│   │   └── App.js       # 主应用
│   └── package.json
└── README.md
```

## 注意事项

- 游戏状态存储在服务器内存中，重启服务器会丢失所有游戏数据
- 建议在局域网或稳定的网络环境下使用
- 支持现代浏览器（Chrome、Firefox、Safari、Edge）

## 许可证

MIT License 