// 此文件由生成器自动创建，请勿手动修改
// 基于 OpenAPI 规范生成的 API 客户端汇总文件

import { makeApi, mergeApis, Zodios } from "@zodios/core";
import config from "./config";

// 动态导入所有生成的 OpenAPI 模块
import osApi from "@/api/openapi/os";

// 构建 endpoints 数组
const endpoints = [
  ...(config.apiPrefix.os ? mergeApis({ [config.apiPrefix.os]: osApi }) : makeApi(osApi)),
];
// 创建 Zodios 客户端实例
const zodiosClient = new Zodios(config.BASE_URL, endpoints, config.config);

// 应用配置钩子
config.use(zodiosClient);

/**
 * 统一请求处理函数
 * @param {string} method - 请求方法
 * @param {string} url - 请求URL
 * @param {Object} requestOptions - 请求选项
 * @param {Object} hookState - 组件状态Hook对象
 * @returns {Promise} 请求结果Promise
 */
const handleRequest = async (method, url, requestOptions = {}, hookState = null) => {
  // 提取请求配置
  const { params, data, ...options } = requestOptions;
  
  // 如果提供了状态钩子，设置loading状态
  if (hookState) {
    hookState.set(state => {
      state.loading = true;
      state.error = null;
      state.message = "请求中...";
      state.lastUpdated = new Date();
    });
  }

  try {
    // 执行请求
    const response = await zodiosClient.request({
      method,
      url,
      params,
      data,
      ...options
    });
    
    // 更新成功状态
    if (hookState) {
      hookState.set(state => {
        state.loading = false;
        state.success = true;
        state.message = "操作成功";
        state.lastUpdated = new Date();
        state.statusCode = 200;
      });
    }

    return {
      success: true,
      data: response,
      error: null,
      message: "操作成功",
    };
  } catch (error) {
    // 获取错误信息
    const errorMsg = error.message || "操作失败";
    const statusCode = error.response?.status || 500;
    
    // 检查是否超时错误
    const isTimeout = error.code === 'ECONNABORTED' || errorMsg.includes('timeout');
    
    // 更新错误状态
    if (hookState) {
      hookState.set(state => {
        state.loading = false;
        state.success = false;
        state.error = error;
        state.message = errorMsg;
        state.lastUpdated = new Date();
        state.statusCode = statusCode;
        state.isTimeout = isTimeout;
        
        // 根据错误类型设置特定错误
        if (error.validation) {
          state.validationError = error.validation;
          
          // 细分验证错误类型
          if (error.validation.type === 'request') {
            state.requestError = error.validation;
          } else if (error.validation.type === 'body') {
            state.bodyError = error.validation;
          } else if (error.validation.type === 'response') {
            state.responseError = error.validation;
          }
        }
      });
    }

    return {
      success: false,
      data: null,
      error,
      message: errorMsg,
    };
  }
};

/**
 * 批量请求处理函数 - 支持聚合API
 * @param {Array} requests - 请求配置数组
 * @param {Object} hookState - 组件状态Hook对象
 * @returns {Promise} 聚合结果Promise
 */
const handleBatchRequests = async (requests, hookState = null) => {
  // 如果提供了状态钩子，设置loading状态
  if (hookState) {
    hookState.set(state => {
      state.loading = true;
      state.error = null;
      state.message = "批量请求中...";
      state.lastUpdated = new Date();
    });
  }

  try {
    // 执行所有请求
    const results = await Promise.all(
      requests.map(req => {
        const { method, url, ...options } = req;
        return handleRequest(method, url, options);
      })
    );
    
    // 检查是否所有请求都成功
    const allSuccess = results.every(r => r.success);
    
    // 合并结果数据
    const aggregatedData = results.map(r => r.data);
    
    // 更新成功状态
    if (hookState) {
      hookState.set(state => {
        state.loading = false;
        state.success = allSuccess;
        state.message = allSuccess ? "批量操作成功" : "部分请求失败";
        state.lastUpdated = new Date();
        
        // 如果有失败的请求，设置错误信息
        if (!allSuccess) {
          const failedResults = results.filter(r => !r.success);
          state.error = failedResults[0].error;
        }
      });
    }

    return {
      success: allSuccess,
      data: aggregatedData,
      results: results,
      message: allSuccess ? "批量操作成功" : "部分请求失败",
    };
  } catch (error) {
    // 更新错误状态
    if (hookState) {
      hookState.set(state => {
        state.loading = false;
        state.success = false;
        state.error = error;
        state.message = error.message || "批量操作失败";
        state.lastUpdated = new Date();
      });
    }

    return {
      success: false,
      data: null,
      error: error,
      message: error.message || "批量操作失败",
    };
  }
};

/**
 * 创建API方法
 * @param {string} method - 请求方法
 * @param {string} url - 请求URL
 * @returns {Function} API方法
 */
const createApiMethod = (method, url) => {
  return (requestOptions = {}, hookState = null) => {
    return handleRequest(method, url, requestOptions, hookState);
  };
};


// 导出 API 方法对象
const osPrefix = config.apiPrefix.os ? config.apiPrefix.os: "";

export const os = {
  getCpuInfo: createApiMethod("get", osPrefix + "/cpu/info"),
  getOsVersion: createApiMethod("get", osPrefix + "/os/version"),
};

// 批量请求方法
export const batch = handleBatchRequests;

// 导出zodios客户端实例供高级用户使用
export { zodiosClient };
