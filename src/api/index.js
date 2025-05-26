import axios from "axios";

const http = axios.create({
  // 使用 import.meta.env 访问环境变量
  baseURL: import.meta.env.VITE_API_BASE_URL || "/",
  timeout: 5000,
});

// 查看所有环境变量
console.log("查看所有环境变量");
console.log(import.meta.env);

// 简单的请求拦截器
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 简单的响应拦截器
http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // if (error.response?.status === 401) {
    //   // 处理未登录状态
    //   localStorage.removeItem("token");
    //   window.location.href = "/login";
    // }
    return Promise.reject(error);
  }
);

export default http;
