/**
 * Jest 测试配置 - 德州扑克游戏测试框架
 * 支持单元测试、集成测试和Socket.IO测试
 */

module.exports = {
  // 测试环境
  testEnvironment: 'node',
  
  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js',
    '**/__tests__/**/*.js'
  ],
  
  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'gameLogic/**/*.js',
    'managers/**/*.js',
    'utils/**/*.js',
    'validators/**/*.js',
    'interfaces/**/*.js',
    'types/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/*.config.js'
  ],
  
  // 覆盖率报告
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85
    },
    './gameLogic/': {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95
    },
    './validators/': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95
    }
  },
  
  // 测试设置
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // 模拟设置
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // 超时设置
  testTimeout: 10000,
  
  // 详细输出
  verbose: true,
  
  // 错误处理
  errorOnDeprecated: true,
  
  // 性能监控
  detectOpenHandles: true,
  detectLeaksMemory: true,
  
  // 并行测试
  maxWorkers: '50%',
  
  // 模块映射
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@gameLogic/(.*)$': '<rootDir>/gameLogic/$1',
    '^@managers/(.*)$': '<rootDir>/managers/$1',
    '^@utils/(.*)$': '<rootDir>/utils/$1',
    '^@validators/(.*)$': '<rootDir>/validators/$1',
    '^@interfaces/(.*)$': '<rootDir>/interfaces/$1',
    '^@types/(.*)$': '<rootDir>/types/$1'
  },
  
  // 全局变量
  globals: {
    'process.env.NODE_ENV': 'test',
    'process.env.TEST_MODE': 'true'
  },
  
  // 转换设置
  transform: {},
  
  // 忽略文件
  testPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/',
    '/dist/'
  ],
  
  // 监视模式
  watchPathIgnorePatterns: [
    '/node_modules/',
    '/coverage/'
  ]
};
