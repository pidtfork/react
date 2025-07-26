// apiFactory.js - 统一的 API 工厂文件
// 用于创建标准化的 API 方法和对应的 React Hooks

import { useState, useCallback, useRef, useEffect } from "react";
import Ajv from "ajv";
import addFormats from "ajv-formats";
import defaultSendRequest from "@/api/factory/request"

// ========== AJV JSON Schema 校验实例初始化 ==========
const ajv = new Ajv({
  allErrors: true, // 返回所有错误，而不是第一个错误
  strict: false, // 允许非严格模式
  coerceTypes: true, // 自动类型转换
  useDefaults: true, // 使用默认值
});
addFormats(ajv); // 添加格式校验支持（如 date、email 等）

// ========== 校验器缓存管理 ==========
// 避免重复编译相同的 schema，提高性能
const validatorCache = new Map();

/**
 * 获取或创建 JSON Schema 校验器
 * @param {Object} schema - JSON Schema 对象
 * @param {string} cacheKey - 缓存键名
 * @returns {Function|null} 校验器函数
 */
function getValidator(schema, cacheKey) {
  if (!schema) return null;

  // 从缓存中获取已编译的校验器
  if (validatorCache.has(cacheKey)) {
    return validatorCache.get(cacheKey);
  }

  // 编译新的校验器并缓存
  const validator = ajv.compile(schema);
  validatorCache.set(cacheKey, validator);
  return validator;
}


// ========== URL 动态生成工具 ==========
/**
 * 根据路径模板和参数生成完整的 URL
 * @param {string} pathTemplate - 路径模板，如 "/api/users/{id}"
 * @param {Array} parameters - 参数定义数组
 * @param {Object} params - 实际参数值
 * @returns {string} 完整的 URL
 */
function generateUrl(pathTemplate, parameters, params = {}) {
  let url = pathTemplate;

  // 替换路径参数（Path Parameters）
  // 例如：将 "/api/users/{id}" 中的 {id} 替换为实际值
  for (const param of parameters || []) {
    if (param.type === "Path") {
      if (!(param.name in params)) {
        throw new Error(`缺少必需的路径参数：${param.name}`);
      }
      url = url.replace(
        `{${param.name}}`,
        encodeURIComponent(params[param.name])
      );
    }
  }

  // 拼接查询参数（Query Parameters）
  // 例如：?page=1&size=10
  const query = (parameters || [])
    .filter((param) => param.type === "Query" && param.name in params)
    .map(
      (param) =>
        `${encodeURIComponent(param.name)}=${encodeURIComponent(
          params[param.name]
        )}`
    )
    .join("&");

  return query ? `${url}?${query}` : url;
}

// ========== API 方法创建器 ==========
/**
 * 根据 API 定义创建具体的 API 调用方法
 * @param {Object} def - API 定义对象
 * @param {Function} sendRequest - 请求发送器函数
 * @returns {Function} API 调用方法
 */
function createApiMethod(def, sendRequest) {
  const { id, method, path, requestBody, response, parameters = [], requestContentType, responseContentType } = def;

  // 只对 JSON 内容类型启用 AJV 验证，跳过文件上传/下载的验证
  const shouldValidateRequest = requestContentType?.includes('json') && requestBody;
  const shouldValidateResponse = responseContentType?.includes('json') && response;

  // 预编译校验器
  const validateRequest = shouldValidateRequest ? getValidator(requestBody, `${id}_request`) : null;
  const validateResponse = shouldValidateResponse ? getValidator(response, `${id}_response`) : null;

  /**
   * 实际的 API 调用方法
   * @param {Object} params - URL 参数（路径参数和查询参数）
   * @param {Object} body - 请求体数据
   * @returns {Object} 标准化的响应对象 { data, success, message, error }
   */
  return async function (params = {}, body = {}) {
    try {
      // 生成完整的请求 URL
      const url = generateUrl(path, parameters, params);

      // 仅对 JSON 请求进行校验
      if (validateRequest && !validateRequest(body)) {
        const error = new Error("请求体数据格式验证失败");
        error.validationErrors = validateRequest.errors;
        error.code = "VALIDATION_ERROR";
        throw error;
      }

      // 传递内容类型信息给请求发送器
      const apiDefWithContentType = { method, url, requestContentType, responseContentType };
      const responseData = await sendRequest(apiDefWithContentType, body);

      // 仅对 JSON 响应进行校验
      if (validateResponse && !validateResponse(responseData)) {
        const error = new Error("响应数据格式验证失败");
        error.validationErrors = validateResponse.errors;
        error.code = "RESPONSE_VALIDATION_ERROR";
        throw error;
      }

      return {
        data: responseData,
        success: true,
        message: "请求执行成功",
        error: null,
      };
    } catch (error) {
      const formattedError = error.code
        ? error
        : {
            code: "REQUEST_ERROR",
            message: error.message || "请求执行失败",
            originalError: error,
          };

      return {
        data: null,
        success: false,
        message: formattedError.message,
        error: formattedError,
      };
    }
  };
}

// ========== React Hook 创建器 ==========
/**
 * 为 API 方法创建对应的 React Hook
 * @param {Function} apiMethod - API 调用方法
 * @returns {Function} React Hook 函数
 */
function createApiHook(apiMethod) {
  /**
   * 生成的 React Hook
   * @returns {Object} Hook 状态对象，包含响应式的状态和调用方法
   */
  return function useApi() {
    // 响应数据状态
    const [data, setData] = useState(null);
    // 加载状态
    const [loading, setLoading] = useState(false);
    // 错误信息状态
    const [error, setError] = useState(null);
    // 成功状态 - 新增
    const [success, setSuccess] = useState(false);
    // 消息状态 - 新增
    const [message, setMessage] = useState("");

    // 组件挂载状态引用，防止内存泄漏
    const isMountedRef = useRef(true);

    // 组件卸载时标记为未挂载
    useEffect(() => {
      return () => {
        isMountedRef.current = false;
      };
    }, []);

    /**
     * API 调用方法
     * @param {Object} params - URL 参数
     * @param {Object} body - 请求体数据
     * @returns {Promise<Object>} API 调用结果
     */
    const call = useCallback(
      async (params = {}, body = {}) => {
        // 开始请求时重置状态
        setLoading(true);
        setError(null);
        setSuccess(false);
        setMessage("");

        // 执行 API 调用
        const result = await apiMethod(params, body);

        // 只有在组件仍然挂载时才更新状态，防止内存泄漏
        if (isMountedRef.current) {
          if (result.success) {
            // 请求成功时的状态更新
            setData(result.data);
            setError(null);
            setSuccess(true);
            setMessage(result.message || "操作成功");
          } else {
            // 请求失败时的状态更新
            setData(null);
            setError(result.error);
            setSuccess(false);
            setMessage(result.message || "操作失败");
          }
          setLoading(false);
        }

        return result;
      },
      [apiMethod]
    );

    // 返回响应式状态和调用方法
    return {
      data, // 响应数据
      loading, // 加载状态
      error, // 错误信息
      success, // 成功状态 - 新增
      message, // 消息文本 - 新增
      call, // API 调用方法
    };
  };
}

// ========== 主函数：API 工厂 ==========
/**
 * 根据 API 定义数组创建完整的 API 对象和 Hooks
 * @param {Array} apiDefs - API 定义数组
 * @param {Function} customSendRequest - 自定义请求发送器（可选）
 * @returns {Object} 包含 api 方法和 hooks 的对象
 */
export function createApi(apiDefs, customSendRequest) {
  // 参数验证
  if (!Array.isArray(apiDefs)) {
    throw new Error("apiDefs 参数应为数组类型");
  }

  // 使用自定义请求发送器或默认实现
  const sendRequest = customSendRequest || defaultSendRequest;

  // 初始化返回对象
  const api = {}; // 存储所有 API 方法
  const hooks = {}; // 存储所有对应的 React Hooks

  // 遍历 API 定义，创建对应的方法和 Hook
  for (const def of apiDefs) {
    // 验证 API 定义的有效性
    if (!def.id || typeof def.id !== "string") {
      console.warn("忽略无效的 API 定义，缺少有效的 id 字段：", def);
      continue;
    }

    // 创建 API 调用方法
    const apiMethod = createApiMethod(def, sendRequest);
    api[def.id] = apiMethod;

    // 创建对应的 React Hook
    // 命名规则：use + 首字母大写的 API ID
    const hookName = `use${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`;
    hooks[hookName] = createApiHook(apiMethod);
  }

  return { api, hooks };
}

// 导出主函数
export default createApi;