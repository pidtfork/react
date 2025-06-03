function use(zoidiosClinet) {
  // 可以在这里添加拦截器或其他客户端配置
}

// 统一的请求方法，返回固定格式的响应对象
async function request(zodiosClient, ...args) {
  try {
    const response = await zodiosClient.request(...args);
    return {
      success: true,
      data: response,
      error: null,
      code: null,
      message: null,
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error,
      code: error.code || "UNKNOWN_ERROR",
      message: error.message || "请求失败",
    };
  }
}

export default {
  BASE_URL: "http://127.0.0.1:4523/m1/6480516-0-default",
  apiPerfix: {},
  config: {},
  use,
  request,
};
