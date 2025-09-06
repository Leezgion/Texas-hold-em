/**
 * API接口标准化 - 统一HTTP API接口格式和错误处理
 * 提供类型安全的API响应和请求处理机制
 */

const { ERROR_CODES } = require('../types/GameTypes');
const Validator = require('../validators/Validator');
const { logger, performanceDashboard } = require('../utils');

class APIResponseManager {
  constructor() {
    this.responseFormats = {
      SUCCESS: 'success',
      ERROR: 'error',
      PARTIAL: 'partial'
    };
    
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'X-API-Version': '1.0',
      'X-Response-Time': null
    };
    
    // API统计
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0
    };
  }

  /**
   * 创建Express中间件用于API标准化
   * @returns {Function} Express中间件
   */
  createMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // 增强request对象
      req.validateBody = (schema) => this.validateRequestBody(req.body, schema);
      req.validateQuery = (schema) => this.validateRequestQuery(req.query, schema);
      req.validateParams = (schema) => this.validateRequestParams(req.params, schema);
      
      // 增强response对象
      res.sendSuccess = (data, message, meta) => {
        this.sendSuccessResponse(res, data, message, meta, startTime);
      };
      
      res.sendError = (code, message, details, statusCode) => {
        this.sendErrorResponse(res, code, message, details, statusCode, startTime);
      };
      
      res.sendPartial = (data, errors, message, meta) => {
        this.sendPartialResponse(res, data, errors, message, meta, startTime);
      };
      
      // 记录请求开始
      this.stats.totalRequests++;
      
      logger.debug('API Request started', {
        method: req.method,
        url: req.url,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
      
      next();
    };
  }

  /**
   * 发送成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 响应数据
   * @param {string} message - 成功消息
   * @param {Object} meta - 元数据
   * @param {number} startTime - 请求开始时间
   */
  sendSuccessResponse(res, data = null, message = 'Success', meta = {}, startTime = Date.now()) {
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: this.responseFormats.SUCCESS,
      message,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        ...meta
      }
    };
    
    this.setResponseHeaders(res, responseTime);
    res.status(200).json(response);
    
    this.recordResponse('success', responseTime);
    performanceDashboard.recordResponseTime(responseTime);
    
    logger.info('API Success Response', {
      responseTime,
      dataSize: data ? JSON.stringify(data).length : 0,
      message
    });
  }

  /**
   * 发送错误响应
   * @param {Object} res - Express响应对象
   * @param {string} code - 错误代码
   * @param {string} message - 错误消息
   * @param {*} details - 错误详情
   * @param {number} statusCode - HTTP状态码
   * @param {number} startTime - 请求开始时间
   */
  sendErrorResponse(res, code, message, details = null, statusCode = 400, startTime = Date.now()) {
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: this.responseFormats.ERROR,
      error: {
        code: ERROR_CODES[code] || code,
        message,
        details,
        timestamp: new Date().toISOString()
      },
      meta: {
        responseTime: `${responseTime}ms`
      }
    };
    
    this.setResponseHeaders(res, responseTime);
    res.status(statusCode).json(response);
    
    this.recordResponse('error', responseTime);
    performanceDashboard.recordResponseTime(responseTime);
    
    logger.warn('API Error Response', {
      code,
      message,
      statusCode,
      responseTime,
      details
    });
  }

  /**
   * 发送部分成功响应
   * @param {Object} res - Express响应对象
   * @param {*} data - 成功的数据
   * @param {Array} errors - 错误列表
   * @param {string} message - 响应消息
   * @param {Object} meta - 元数据
   * @param {number} startTime - 请求开始时间
   */
  sendPartialResponse(res, data, errors, message = 'Partial success', meta = {}, startTime = Date.now()) {
    const responseTime = Date.now() - startTime;
    
    const response = {
      status: this.responseFormats.PARTIAL,
      message,
      data,
      errors: errors.map(error => ({
        code: error.code || 'UNKNOWN_ERROR',
        message: error.message || 'Unknown error',
        field: error.field || null
      })),
      meta: {
        timestamp: new Date().toISOString(),
        responseTime: `${responseTime}ms`,
        successCount: Array.isArray(data) ? data.length : (data ? 1 : 0),
        errorCount: errors.length,
        ...meta
      }
    };
    
    this.setResponseHeaders(res, responseTime);
    res.status(207).json(response); // 207 Multi-Status
    
    this.recordResponse('partial', responseTime);
    performanceDashboard.recordResponseTime(responseTime);
    
    logger.info('API Partial Response', {
      responseTime,
      successCount: response.meta.successCount,
      errorCount: response.meta.errorCount
    });
  }

  /**
   * 设置响应头
   * @param {Object} res - Express响应对象
   * @param {number} responseTime - 响应时间
   */
  setResponseHeaders(res, responseTime) {
    Object.entries(this.defaultHeaders).forEach(([key, value]) => {
      if (key === 'X-Response-Time') {
        res.set(key, `${responseTime}ms`);
      } else if (value) {
        res.set(key, value);
      }
    });
  }

  /**
   * 验证请求体
   * @param {Object} body - 请求体
   * @param {Object} schema - 验证模式
   * @returns {ValidationResult} 验证结果
   */
  validateRequestBody(body, schema) {
    return this.validateData(body, schema, 'body');
  }

  /**
   * 验证查询参数
   * @param {Object} query - 查询参数
   * @param {Object} schema - 验证模式
   * @returns {ValidationResult} 验证结果
   */
  validateRequestQuery(query, schema) {
    return this.validateData(query, schema, 'query');
  }

  /**
   * 验证路径参数
   * @param {Object} params - 路径参数
   * @param {Object} schema - 验证模式
   * @returns {ValidationResult} 验证结果
   */
  validateRequestParams(params, schema) {
    return this.validateData(params, schema, 'params');
  }

  /**
   * 通用数据验证
   * @param {Object} data - 待验证数据
   * @param {Object} schema - 验证模式
   * @param {string} source - 数据来源
   * @returns {ValidationResult} 验证结果
   */
  validateData(data, schema, source) {
    const errors = [];
    const validatedData = {};
    
    // 验证必需字段
    if (schema.required) {
      for (const field of schema.required) {
        if (!(field in data) || data[field] === null || data[field] === undefined) {
          errors.push({
            field,
            code: 'REQUIRED_FIELD_MISSING',
            message: `Required field '${field}' is missing`
          });
        }
      }
    }
    
    // 验证字段类型和值
    if (schema.fields) {
      for (const [fieldName, fieldSchema] of Object.entries(schema.fields)) {
        const value = data[fieldName];
        
        // 跳过可选的空字段
        if (value === undefined || value === null) {
          if (fieldSchema.default !== undefined) {
            validatedData[fieldName] = fieldSchema.default;
          }
          continue;
        }
        
        // 类型验证
        const typeResult = this.validateFieldType(value, fieldSchema.type, fieldName);
        if (!typeResult.valid) {
          errors.push({
            field: fieldName,
            code: 'INVALID_TYPE',
            message: typeResult.error
          });
          continue;
        }
        
        // 自定义验证
        if (fieldSchema.validate) {
          const customResult = fieldSchema.validate(typeResult.data);
          if (!customResult.valid) {
            errors.push({
              field: fieldName,
              code: 'VALIDATION_FAILED',
              message: customResult.error
            });
            continue;
          }
          validatedData[fieldName] = customResult.data;
        } else {
          validatedData[fieldName] = typeResult.data;
        }
      }
    }
    
    if (errors.length > 0) {
      return {
        valid: false,
        errors,
        source
      };
    }
    
    return {
      valid: true,
      data: validatedData
    };
  }

  /**
   * 验证字段类型
   * @param {*} value - 字段值
   * @param {string} type - 期望类型
   * @param {string} fieldName - 字段名
   * @returns {ValidationResult} 验证结果
   */
  validateFieldType(value, type, fieldName) {
    switch (type) {
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: `Field '${fieldName}' must be a string` };
        }
        return { valid: true, data: value.trim() };
        
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          return { valid: false, error: `Field '${fieldName}' must be a valid number` };
        }
        return { valid: true, data: num };
        
      case 'integer':
        const int = parseInt(value);
        if (isNaN(int) || int !== Number(value)) {
          return { valid: false, error: `Field '${fieldName}' must be an integer` };
        }
        return { valid: true, data: int };
        
      case 'boolean':
        if (typeof value === 'boolean') {
          return { valid: true, data: value };
        }
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'true' || lower === '1') {
            return { valid: true, data: true };
          }
          if (lower === 'false' || lower === '0') {
            return { valid: true, data: false };
          }
        }
        return { valid: false, error: `Field '${fieldName}' must be a boolean` };
        
      case 'array':
        if (!Array.isArray(value)) {
          return { valid: false, error: `Field '${fieldName}' must be an array` };
        }
        return { valid: true, data: value };
        
      case 'object':
        if (!value || typeof value !== 'object' || Array.isArray(value)) {
          return { valid: false, error: `Field '${fieldName}' must be an object` };
        }
        return { valid: true, data: value };
        
      case 'playerId':
        return Validator.validatePlayerId(value);
        
      case 'nickname':
        return Validator.validateNickname(value);
        
      default:
        return { valid: true, data: value };
    }
  }

  /**
   * 创建标准API错误处理中间件
   * @returns {Function} Express错误处理中间件
   */
  createErrorHandler() {
    return (error, req, res, next) => {
      logger.error('Unhandled API error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });
      
      // 确定错误类型和状态码
      let statusCode = 500;
      let errorCode = ERROR_CODES.INTERNAL_ERROR;
      let message = 'Internal server error';
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        message = error.message;
      } else if (error.name === 'CastError') {
        statusCode = 400;
        errorCode = ERROR_CODES.VALIDATION_ERROR;
        message = 'Invalid parameter format';
      } else if (error.status) {
        statusCode = error.status;
      }
      
      this.sendErrorResponse(res, errorCode, message, {
        type: error.name,
        originalMessage: error.message
      }, statusCode);
    };
  }

  /**
   * 记录响应统计
   * @param {string} type - 响应类型
   * @param {number} responseTime - 响应时间
   */
  recordResponse(type, responseTime) {
    if (type === 'success') {
      this.stats.successfulRequests++;
    } else {
      this.stats.errorRequests++;
    }
    
    // 更新平均响应时间
    this.stats.averageResponseTime = (
      (this.stats.averageResponseTime * (this.stats.totalRequests - 1) + responseTime) / 
      this.stats.totalRequests
    );
  }

  /**
   * 获取API统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.totalRequests > 0 ? 
        (this.stats.successfulRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%',
      errorRate: this.stats.totalRequests > 0 ? 
        (this.stats.errorRequests / this.stats.totalRequests * 100).toFixed(2) + '%' : '0%'
    };
  }

  /**
   * 重置统计信息
   */
  resetStats() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      errorRequests: 0,
      averageResponseTime: 0
    };
    
    logger.info('API response manager statistics reset');
  }
}

// 预定义的验证模式
const ValidationSchemas = {
  // 创建房间
  createRoom: {
    required: ['roomName', 'settings'],
    fields: {
      roomName: {
        type: 'string',
        validate: (value) => {
          if (value.length < 1 || value.length > 50) {
            return { valid: false, error: 'Room name must be 1-50 characters' };
          }
          return { valid: true, data: value };
        }
      },
      settings: {
        type: 'object',
        validate: (value) => Validator.validateRoomSettings(value)
      },
      password: {
        type: 'string',
        validate: (value) => {
          if (value && value.length < 4) {
            return { valid: false, error: 'Password must be at least 4 characters' };
          }
          return { valid: true, data: value };
        }
      }
    }
  },
  
  // 加入房间
  joinRoom: {
    required: ['roomId'],
    fields: {
      roomId: { type: 'playerId' },
      password: { type: 'string' }
    }
  },
  
  // 玩家动作
  playerAction: {
    required: ['action'],
    fields: {
      action: {
        type: 'string',
        validate: (value) => {
          const validActions = ['fold', 'check', 'call', 'raise', 'allin'];
          if (!validActions.includes(value)) {
            return { valid: false, error: 'Invalid action type' };
          }
          return { valid: true, data: value };
        }
      },
      amount: {
        type: 'number',
        validate: (value) => Validator.validateBetAmount(value)
      }
    }
  }
};

// 创建全局API响应管理器实例
const apiResponseManager = new APIResponseManager();

module.exports = { 
  APIResponseManager, 
  apiResponseManager, 
  ValidationSchemas 
};
