import { useState, useCallback } from "react";

/**
 * 创建API状态管理Hook
 * @param {Object} customFields - 自定义字段，会与基础状态合并
 * @returns {Object} 包含所有状态字段和更新方法的对象
 */
function createAPIStateHook(customFields = {}) {
  // 基础API状态定义 - 涵盖API请求生命周期的所有状态
  const baseState = {
    loading        : false,  // 加载状态：是否正在进行API请求
    success        : false,  // 成功状态：请求是否成功完成
    message        : "",     // 消息文本：用户友好的提示信息
    error          : null,   // 通用错误：网络错误、服务器错误等
    lastUpdated    : null,   // 更新时间：最后一次状态更新的时间戳
    statusCode     : null,   // 状态码：HTTP响应状态码
    isTimeout      : false,  // 超时标识：请求是否因超时而失败
    validationError: null,   // 验证错误：所有验证相关的错误信息
    requestError   : null,   // 请求错误：请求参数验证失败的错误
    bodyError      : null,   // 请求体错误：请求体格式或内容验证错误
    responseError  : null,   // 响应错误：响应数据格式或内容验证错误
    ...customFields,         // 自定义字段：业务特定的状态字段
  };

  // 创建响应式状态
  const [apiState, setApiState] = useState(baseState);

  /**
   * 状态更新函数
   * 接收一个函数来修改状态，确保状态的不可变更新
   * @param {Function} stateUpdater - 状态更新函数，接收当前状态的可变副本
   */
  const set = useCallback((stateUpdater) => {
    setApiState((currentState) => {
      // 创建状态的浅拷贝，避免直接修改原状态
      const newState = { ...currentState };
      // 执行状态更新逻辑
      stateUpdater(newState);
      return newState;
    });
  }, []);

  // 构建返回对象，包含所有状态字段
  const stateProxy = {};
  
  // 动态添加所有状态字段到返回对象
  Object.keys(baseState).forEach((fieldName) => {
    stateProxy[fieldName] = apiState[fieldName];
  });

  return {
    ...stateProxy,           // 展开所有状态字段
    set,             // 状态更新方法
  };
}

export default createAPIStateHook;


// TypeScript 类型定义
/**
 * @typedef {Object} BaseAPIState
 * @property {boolean} loading - 加载状态
 * @property {boolean} success - 成功状态
 * @property {string} message - 消息文本
 * @property {any} error - 通用错误
 * @property {number|null} lastUpdated - 更新时间
 * @property {number|null} statusCode - HTTP状态码
 * @property {boolean} isTimeout - 超时标识
 * @property {any} validationError - 验证错误
 * @property {any} requestError - 请求错误
 * @property {any} bodyError - 请求体错误
 * @property {any} responseError - 响应错误
 */

/**
 * @typedef {Object} APIStateResult
 * @property {boolean} loading - 加载状态
 * @property {boolean} success - 成功状态
 * @property {string} message - 消息文本
 * @property {any} error - 通用错误
 * @property {number|null} lastUpdated - 更新时间
 * @property {number|null} statusCode - HTTP状态码
 * @property {boolean} isTimeout - 超时标识
 * @property {any} validationError - 验证错误
 * @property {any} requestError - 请求错误
 * @property {any} bodyError - 请求体错误
 * @property {any} responseError - 响应错误
 * @property {function} set - 状态更新方法
 */

// TypeScript 用户可以使用的完整类型定义
export const APIStateTypes = {
  /**
   * 基础API状态接口
   * @typedef BaseAPIState
   */
  BaseAPIState: /** @type {BaseAPIState} */ ({}),
  
  /**
   * API状态Hook返回结果接口
   * @typedef APIStateResult
   */
  APIStateResult: /** @type {APIStateResult} */ ({}),
  
  /**
   * 状态更新函数类型
   * @typedef {function(BaseAPIState): void} StateUpdater
   */
  StateUpdater: /** @type {function(BaseAPIState): void} */ (null),
  
  /**
   * createAPIStateHook函数类型
   * @typedef {function(Object): APIStateResult} createAPIStateHook
   */
  createAPIStateHook: /** @type {function(Object): APIStateResult} */ (null)
};

// 如果在TypeScript环境中，导出实际的类型定义
if (typeof exports !== 'undefined' && typeof module !== 'undefined') {
  // CommonJS 环境
  module.exports = createAPIStateHook;
  module.exports.APIStateTypes = APIStateTypes;
  module.exports.default = createAPIStateHook;
} else if (typeof define === 'function' && define.amd) {
  // AMD 环境
  define([], function() {
    return { default: createAPIStateHook, APIStateTypes };
  });
}