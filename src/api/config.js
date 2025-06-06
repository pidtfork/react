function use(zodiosClient) {
  // 可以在这里添加拦截器或其他客户端配置
}

export default {
  BASE_URL: "http://127.0.0.1:4523/m1/6480516-0-default",
  apiPerfix: {},
  config: {
    // zodios 配置选项
    // timeout: 10000,
    // headers: {
    //   "Content-Type": "application/json"
    // }
  },
  use,
};