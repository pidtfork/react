// 此文件由生成器自动创建，请勿手动修改
// 基于 OpenAPI 规范生成的 API 客户端汇总文件

import { makeApi, mergeApis, Zodios } from "@zodios/core";
import config from "./config";

// 动态导入所有生成的 OpenAPI 模块
import osApi from "@/api/openapi/os";

// 构建 endpoints 数组
const endpoints = [
  ...(config.apiPerfix.os ? mergeApis({ [config.apiPerfix.os]: osApi }) : makeApi(osApi)),
];

// 创建 Zodios 客户端实例
const zoidiosClinet = new Zodios(config.BASE_URL, endpoints, config.config);

// 应用配置钩子
config.use(zoidiosClinet);

// 统一的请求方法，通过 config.request 实现
const request = (data,req) => {
  if (data != undefined && typeof data != "object") {
    throw "zodios request 请求参数错误"
  }
  return config.request(zoidiosClinet, {...data,...req})
};

// 导出 API 方法对象
export const os = {
  getCpuInfo: (data) => request( data, { method: "get", url: "/cpu/info" }),
  getOsVersion: (data) => request( data, { method: "get", url: "/os/version" }),
};