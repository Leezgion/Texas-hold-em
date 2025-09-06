# 🚀 德州扑克游戏启动指南

## 📋 系统要求

- Node.js 14+ 
- npm 6+
- 现代浏览器 (Chrome, Firefox, Safari, Edge)

## 🛠️ 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd Texas-hold'em
```

### 2. 安装服务器依赖
```bash
cd server
npm install
```

### 3. 安装客户端依赖
```bash
cd ../client
npm install
```

## 🎮 启动游戏

### 方法一: 使用启动脚本 (推荐)

#### Windows
```powershell
# 在项目根目录运行
.\start.ps1
```

#### 或者使用批处理文件
```cmd
start.bat
```

### 方法二: 手动启动

#### 启动服务器
```bash
cd server
npm start
# 或开发模式
npm run dev
```

#### 启动客户端 (新终端)
```bash
cd client  
npm run dev
```

## 🌐 访问游戏

- **游戏地址**: http://localhost:5173
- **服务器API**: http://localhost:3001

## 🧪 运行测试

### 运行所有测试
```bash
cd server
npm test
```

### 运行特定测试
```bash
# 单元测试
npm run test:unit

# 集成测试  
npm run test:integration

# 测试覆盖率
npm run test:coverage
```

### 运行Stage 4测试套件
```bash
cd server
node run-stage4-tests.js
```

## 🎯 游戏功能

### 核心功能
- ✅ 创建游戏房间
- ✅ 加入现有房间
- ✅ 实时多人游戏
- ✅ 完整的德州扑克规则
- ✅ 聊天功能
- ✅ 观战模式

### 游戏操作
- **下注**: 选择下注金额
- **跟注**: 跟随当前最大下注
- **加注**: 增加下注金额  
- **弃牌**: 放弃当前手牌
- **全押**: 投入所有筹码

## 🔧 配置选项

### 服务器配置
```javascript
// server/server.js
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";
```

### 客户端配置
```javascript
// client/vite.config.js
export default defineConfig({
  server: {
    port: 5173
  }
})
```

## 📊 性能监控

访问 http://localhost:3001/api/stats 查看服务器统计信息:
- 活跃连接数
- 房间数量
- 内存使用情况
- 响应时间

## 🐛 故障排除

### 常见问题

#### 1. 端口冲突
```bash
# 检查端口占用
netstat -ano | findstr :3001
netstat -ano | findstr :5173

# 修改端口配置
# 编辑 server/server.js 和 client/vite.config.js
```

#### 2. 依赖安装失败
```bash
# 清除缓存重新安装
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### 3. 连接问题
- 检查防火墙设置
- 确认服务器已启动
- 检查浏览器控制台错误

### 日志查看
```bash
# 服务器日志
cd server
npm run dev  # 开发模式有详细日志

# 客户端日志
# 打开浏览器开发者工具 (F12)
```

## 🔒 安全注意事项

### 生产环境
- 更改默认端口
- 设置CORS白名单
- 启用HTTPS
- 配置防火墙规则

### 环境变量
```bash
# 创建 .env 文件
PORT=3001
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

## 📚 API 文档

### WebSocket 事件
- `joinRoom`: 加入房间
- `createRoom`: 创建房间  
- `gameAction`: 游戏动作
- `sendMessage`: 发送消息

### HTTP 端点
- `GET /api/rooms`: 获取房间列表
- `GET /api/stats`: 服务器统计
- `POST /api/room`: 创建房间

## 🤝 开发指南

### 添加新功能
1. 在 `server/gameLogic/` 添加游戏逻辑
2. 在 `client/src/components/` 添加UI组件
3. 更新类型定义 `server/types/GameTypes.js`
4. 编写测试用例 `server/tests/`

### 代码规范
- 使用JSDoc注释
- 遵循现有命名约定
- 编写单元测试
- 更新文档

## 📞 技术支持

### 项目结构
```
德州扑克项目/
├── client/         # React前端
├── server/         # Node.js后端  
├── start.ps1       # PowerShell启动脚本
├── start.bat       # 批处理启动脚本
└── README.md       # 项目说明
```

### 获取帮助
- 查看项目文档
- 检查错误日志
- 运行测试套件
- 查看API响应

## 🎉 开始游戏

现在你可以启动游戏并享受德州扑克的乐趣！

1. 运行启动脚本
2. 打开浏览器访问 http://localhost:5173
3. 创建或加入房间
4. 开始游戏！

祝你游戏愉快！ 🎮♠️♥️♦️♣️
