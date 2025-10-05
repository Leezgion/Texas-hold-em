/**
 * 重构验证测试脚本
 * 用于验证移除 deviceSocketMap 后的功能正常性
 */

const io = require('socket.io-client');

// 测试配置
const SERVER_URL = 'http://localhost:3001';
const TEST_TIMEOUT = 30000;

// 颜色输出
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 生成测试设备ID
function generateDeviceId() {
  return `test-device-${Math.random().toString(36).substring(2, 9)}`;
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 测试用例
class RefactorTest {
  constructor() {
    this.tests = [];
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // 测试1: 正常设备注册
  async testDeviceRegistration() {
    log('\n📝 测试1: 正常设备注册', 'blue');
    
    return new Promise((resolve, reject) => {
      const deviceId = generateDeviceId();
      const socket = io(SERVER_URL);

      socket.on('connect', () => {
        log(`  ✓ Socket连接成功: ${socket.id}`, 'green');
        socket.emit('registerDevice', { deviceId });
      });

      socket.on('deviceRegistered', (data) => {
        if (data.deviceId === deviceId && data.socketId === socket.id) {
          log(`  ✓ 设备注册成功: ${deviceId}`, 'green');
          socket.disconnect();
          resolve(true);
        } else {
          log(`  ✗ 设备注册数据不匹配`, 'red');
          socket.disconnect();
          reject(new Error('设备注册数据不匹配'));
        }
      });

      socket.on('error', (err) => {
        log(`  ✗ 错误: ${err}`, 'red');
        socket.disconnect();
        reject(err);
      });

      setTimeout(() => {
        log(`  ✗ 测试超时`, 'red');
        socket.disconnect();
        reject(new Error('测试超时'));
      }, 5000);
    });
  }

  // 测试2: 设备重连（相同设备ID，新socket）
  async testDeviceReconnection() {
    log('\n📝 测试2: 设备重连', 'blue');
    
    const deviceId = generateDeviceId();
    
    return new Promise(async (resolve, reject) => {
      // 第一次连接
      const socket1 = io(SERVER_URL);
      
      await new Promise((res) => {
        socket1.on('connect', () => {
          log(`  ✓ 第一次连接成功: ${socket1.id}`, 'green');
          socket1.emit('registerDevice', { deviceId });
        });

        socket1.on('deviceRegistered', () => {
          log(`  ✓ 第一次注册成功`, 'green');
          res();
        });
      });

      await delay(1000);

      // 第二次连接（模拟重连）
      const socket2 = io(SERVER_URL);
      
      socket2.on('connect', () => {
        log(`  ✓ 第二次连接成功: ${socket2.id}`, 'green');
        socket2.emit('registerDevice', { deviceId });
      });

      socket2.on('deviceRegistered', (data) => {
        if (data.deviceId === deviceId && data.socketId === socket2.id) {
          log(`  ✓ 重连注册成功，旧连接应被清除`, 'green');
          socket1.disconnect();
          socket2.disconnect();
          resolve(true);
        } else {
          log(`  ✗ 重连数据不匹配`, 'red');
          socket1.disconnect();
          socket2.disconnect();
          reject(new Error('重连数据不匹配'));
        }
      });

      socket2.on('error', (err) => {
        log(`  ✗ 错误: ${err}`, 'red');
        socket1.disconnect();
        socket2.disconnect();
        reject(err);
      });

      setTimeout(() => {
        log(`  ✗ 测试超时`, 'red');
        socket1.disconnect();
        socket2.disconnect();
        reject(new Error('测试超时'));
      }, 10000);
    });
  }

  // 测试3: 多设备同时连接
  async testMultipleDevices() {
    log('\n📝 测试3: 多设备同时连接', 'blue');
    
    const deviceCount = 3;
    const devices = [];

    try {
      for (let i = 0; i < deviceCount; i++) {
        const deviceId = generateDeviceId();
        const socket = io(SERVER_URL);

        const registered = await new Promise((resolve, reject) => {
          socket.on('connect', () => {
            log(`  ✓ 设备${i + 1}连接成功: ${socket.id}`, 'green');
            socket.emit('registerDevice', { deviceId });
          });

          socket.on('deviceRegistered', (data) => {
            if (data.deviceId === deviceId) {
              log(`  ✓ 设备${i + 1}注册成功`, 'green');
              resolve(true);
            } else {
              reject(new Error('设备注册失败'));
            }
          });

          socket.on('error', reject);

          setTimeout(() => reject(new Error('超时')), 5000);
        });

        devices.push({ deviceId, socket });
        await delay(500);
      }

      log(`  ✓ ${deviceCount}个设备全部注册成功`, 'green');

      // 清理连接
      devices.forEach(d => d.socket.disconnect());
      
      return true;
    } catch (error) {
      log(`  ✗ 多设备连接测试失败: ${error.message}`, 'red');
      devices.forEach(d => d.socket.disconnect());
      throw error;
    }
  }

  // 测试4: 创建房间功能
  async testCreateRoom() {
    log('\n📝 测试4: 创建房间功能', 'blue');
    
    return new Promise((resolve, reject) => {
      const deviceId = generateDeviceId();
      const socket = io(SERVER_URL);

      socket.on('connect', () => {
        log(`  ✓ Socket连接成功`, 'green');
        socket.emit('registerDevice', { deviceId });
      });

      socket.on('deviceRegistered', () => {
        log(`  ✓ 设备注册成功`, 'green');
        
        // 创建房间
        const settings = {
          duration: 60,
          maxPlayers: 6,
          allowStraddle: false,
          allinDealCount: 1
        };
        
        socket.emit('createRoom', settings);
      });

      socket.on('roomCreated', (data) => {
        if (data.roomId) {
          log(`  ✓ 房间创建成功: ${data.roomId}`, 'green');
          socket.disconnect();
          resolve(true);
        } else {
          log(`  ✗ 房间创建失败`, 'red');
          socket.disconnect();
          reject(new Error('房间创建失败'));
        }
      });

      socket.on('error', (err) => {
        log(`  ✗ 错误: ${err}`, 'red');
        socket.disconnect();
        reject(new Error(err));
      });

      setTimeout(() => {
        log(`  ✗ 测试超时`, 'red');
        socket.disconnect();
        reject(new Error('测试超时'));
      }, 5000);
    });
  }

  // 测试5: 检查调试端点
  async testDebugEndpoint() {
    log('\n📝 测试5: 调试端点检查', 'blue');
    
    try {
      const response = await fetch(`${SERVER_URL}/api/debug/devices`);
      const data = await response.json();
      
      if (data.socketCount !== undefined && Array.isArray(data.mappings)) {
        log(`  ✓ 调试端点正常工作`, 'green');
        log(`  ✓ 当前socket数量: ${data.socketCount}`, 'green');
        return true;
      } else {
        log(`  ✗ 调试端点数据格式错误`, 'red');
        throw new Error('调试端点数据格式错误');
      }
    } catch (error) {
      log(`  ✗ 调试端点测试失败: ${error.message}`, 'red');
      throw error;
    }
  }

  // 运行所有测试
  async runAll() {
    log('\n' + '='.repeat(50), 'yellow');
    log('开始重构验证测试', 'yellow');
    log('='.repeat(50), 'yellow');

    const tests = [
      { name: '设备注册', fn: () => this.testDeviceRegistration() },
      { name: '设备重连', fn: () => this.testDeviceReconnection() },
      { name: '多设备连接', fn: () => this.testMultipleDevices() },
      { name: '创建房间', fn: () => this.testCreateRoom() },
      { name: '调试端点', fn: () => this.testDebugEndpoint() },
    ];

    for (const test of tests) {
      try {
        await test.fn();
        this.passedTests++;
      } catch (error) {
        log(`\n❌ ${test.name} 测试失败: ${error.message}`, 'red');
        this.failedTests++;
      }
      
      await delay(1000); // 测试之间的延迟
    }

    // 输出测试结果
    log('\n' + '='.repeat(50), 'yellow');
    log('测试结果汇总', 'yellow');
    log('='.repeat(50), 'yellow');
    log(`通过: ${this.passedTests}/${tests.length}`, 'green');
    log(`失败: ${this.failedTests}/${tests.length}`, this.failedTests > 0 ? 'red' : 'green');
    
    if (this.failedTests === 0) {
      log('\n✅ 所有测试通过！重构成功！', 'green');
    } else {
      log('\n⚠️  部分测试失败，请检查代码', 'red');
    }

    process.exit(this.failedTests > 0 ? 1 : 0);
  }
}

// 运行测试
const tester = new RefactorTest();

// 等待服务器启动
log('等待服务器启动...', 'yellow');
setTimeout(() => {
  tester.runAll().catch((error) => {
    log(`\n❌ 测试执行出错: ${error.message}`, 'red');
    process.exit(1);
  });
}, 2000);
