function use(zodiosClient) {
  // 可以在这里添加拦截器或其他客户端配置
}

export default {
  BASE_URL: import.meta.env.VITE_API_BASE_URL,
  // 文件名:前缀
  apiPrefix: {},
  config: {
    // zodios 配置选项
    // timeout: 10000,
    // headers: {
    //   "Content-Type": "application/json"
    // }
  },
  use,
};