#!/usr/bin/env node

/**
 * 德州扑克游戏测试运行器
 * 提供完整的测试套件执行和报告
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

class TestRunner {
  constructor() {
    this.testResults = {
      unit: null,
      integration: null,
      coverage: null,
      startTime: Date.now()
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      error: '\x1b[31m',   // red
      warning: '\x1b[33m', // yellow
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async runCommand(command, description) {
    this.log(`运行: ${description}`, 'info');
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8',
        stdio: 'inherit'
      });
      this.log(`✅ ${description} 完成`, 'success');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} 失败: ${error.message}`, 'error');
      return { success: false, error };
    }
  }

  async runUnitTests() {
    this.log('=== 开始单元测试 ===', 'info');
    const result = await this.runCommand('npm run test:unit', '单元测试');
    this.testResults.unit = result;
    return result;
  }

  async runIntegrationTests() {
    this.log('=== 开始集成测试 ===', 'info');
    const result = await this.runCommand('npm run test:integration', '集成测试');
    this.testResults.integration = result;
    return result;
  }

  async runCoverageTests() {
    this.log('=== 开始覆盖率测试 ===', 'info');
    const result = await this.runCommand('npm run test:coverage', '覆盖率测试');
    this.testResults.coverage = result;
    return result;
  }

  async runBotTests() {
    this.log('=== 开始AI机器人测试 ===', 'info');
    const result = await this.runCommand('npm run test:bots', 'AI机器人测试');
    return result;
  }

  async checkTestEnvironment() {
    this.log('检查测试环境...', 'info');
    
    // 检查Jest是否安装
    try {
      execSync('npx jest --version', { stdio: 'ignore' });
      this.log('✅ Jest 已安装', 'success');
    } catch (error) {
      this.log('❌ Jest 未安装，请运行: npm install', 'error');
      process.exit(1);
    }

    // 检查测试文件是否存在
    const testDirs = ['tests/gameLogic', 'tests/integration', 'tests/bots'];
    for (const dir of testDirs) {
      if (fs.existsSync(path.join(__dirname, dir))) {
        this.log(`✅ 测试目录存在: ${dir}`, 'success');
      } else {
        this.log(`⚠️  测试目录不存在: ${dir}`, 'warning');
      }
    }
  }

  generateReport() {
    const duration = Date.now() - this.testResults.startTime;
    const durationMin = (duration / 1000 / 60).toFixed(2);

    this.log('=== 测试报告 ===', 'info');
    this.log(`总执行时间: ${durationMin} 分钟`, 'info');
    
    const results = [
      { name: '单元测试', result: this.testResults.unit },
      { name: '集成测试', result: this.testResults.integration },
      { name: '覆盖率测试', result: this.testResults.coverage }
    ];

    let passCount = 0;
    results.forEach(({ name, result }) => {
      if (result) {
        if (result.success) {
          this.log(`✅ ${name}: 通过`, 'success');
          passCount++;
        } else {
          this.log(`❌ ${name}: 失败`, 'error');
        }
      } else {
        this.log(`⏭️  ${name}: 跳过`, 'warning');
      }
    });

    this.log(`测试总结: ${passCount}/${results.length} 通过`, 
             passCount === results.length ? 'success' : 'warning');

    // 生成HTML报告（如果覆盖率测试运行了）
    if (this.testResults.coverage && fs.existsSync('coverage/lcov-report/index.html')) {
      this.log('📊 覆盖率报告: coverage/lcov-report/index.html', 'info');
    }
  }

  async runAllTests() {
    this.log('🚀 德州扑克游戏测试套件启动', 'info');
    
    await this.checkTestEnvironment();
    
    // 按顺序执行测试
    await this.runUnitTests();
    await this.runIntegrationTests();
    await this.runCoverageTests();
    
    this.generateReport();
    
    // 根据结果设置退出码
    const allPassed = this.testResults.unit?.success && 
                     this.testResults.integration?.success;
    
    if (allPassed) {
      this.log('🎉 所有测试通过！', 'success');
      process.exit(0);
    } else {
      this.log('💥 部分测试失败', 'error');
      process.exit(1);
    }
  }

  async runQuickTest() {
    this.log('🏃‍♂️ 快速测试模式', 'info');
    
    await this.checkTestEnvironment();
    
    // 只运行单元测试
    const unitResult = await this.runUnitTests();
    
    if (unitResult.success) {
      this.log('✅ 快速测试通过', 'success');
      process.exit(0);
    } else {
      this.log('❌ 快速测试失败', 'error');
      process.exit(1);
    }
  }

  async runSpecificTest(testPattern) {
    this.log(`🎯 运行特定测试: ${testPattern}`, 'info');
    
    const result = await this.runCommand(
      `npx jest ${testPattern}`,
      `特定测试: ${testPattern}`
    );
    
    process.exit(result.success ? 0 : 1);
  }
}

// CLI接口
function main() {
  const args = process.argv.slice(2);
  const testRunner = new TestRunner();

  if (args.length === 0) {
    // 默认运行所有测试
    testRunner.runAllTests();
  } else if (args[0] === '--quick' || args[0] === '-q') {
    // 快速测试模式
    testRunner.runQuickTest();
  } else if (args[0] === '--unit' || args[0] === '-u') {
    // 只运行单元测试
    testRunner.runUnitTests().then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--integration' || args[0] === '-i') {
    // 只运行集成测试
    testRunner.runIntegrationTests().then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--coverage' || args[0] === '-c') {
    // 只运行覆盖率测试
    testRunner.runCoverageTests().then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--bots' || args[0] === '-b') {
    // 只运行机器人测试
    testRunner.runBotTests().then(result => {
      process.exit(result.success ? 0 : 1);
    });
  } else if (args[0] === '--help' || args[0] === '-h') {
    // 显示帮助
    console.log(`
德州扑克游戏测试运行器

使用方法:
  node run-tests.js [选项]

选项:
  (无参数)           运行所有测试
  --quick, -q       快速测试（仅单元测试）
  --unit, -u        仅单元测试
  --integration, -i 仅集成测试
  --coverage, -c    仅覆盖率测试
  --bots, -b        仅AI机器人测试
  --help, -h        显示此帮助信息

示例:
  node run-tests.js              # 运行所有测试
  node run-tests.js --quick      # 快速测试
  node run-tests.js --coverage   # 生成覆盖率报告
    `);
  } else {
    // 运行特定测试模式
    testRunner.runSpecificTest(args.join(' '));
  }
}

if (require.main === module) {
  main();
}

module.exports = TestRunner;
