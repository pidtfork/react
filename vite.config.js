import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc"; // React SWC 插件 - 比Babel更快的React编译
import path from "path";
import tailwindcss from "@tailwindcss/vite"; // Tailwind CSS 插件
// import { visualizer } from 'rollup-plugin-visualizer' // 打包分析插件 - 需要分析包体积时启用，执行npm run build后生成report.html
// import compression from 'vite-plugin-compression' // gzip压缩插件 - 部署到生产环境时启用，减小文件体积提高加载速度
// import legacy from '@vitejs/plugin-legacy' // 兼容旧浏览器插件 - 需要支持IE11等旧浏览器时启用

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // 加载环境变量 - 开发环境使用.env.development，生产环境使用.env.production
  // 第三个参数为''时会加载所有环境变量，包括没有VITE_前缀的变量
  const env = loadEnv(mode, process.cwd(), "");
  const isProd = mode === "production"; // 判断是否是生产环境
  const isDev = mode === "development"; // 判断是否是开发环境

  return {
    // 插件配置 - 按需启用或禁用插件
    plugins: [
      react(), // React支持
      tailwindcss(), // Tailwind CSS支持
      // visualizer(), // 启用打包分析 - 对打包结果进行可视化分析，排查大文件
      // compression({
      //   threshold: 10240, // 仅压缩大于10kb的文件
      //   algorithm: 'gzip', // 压缩算法
      // }), // 启用gzip压缩 - 预压缩文件减轻服务器负担
      // legacy({ // 兼容旧浏览器 - 添加polyfills和转译，支持更多浏览器
      //   targets: ['defaults', 'not IE 11'],
      // }),
    ],

    // 路径别名配置 - 简化导入路径，避免../../../这样的相对路径
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"), // 基础路径别名
        "@components": path.resolve(__dirname, "./src/components"), // 组件路径
        "@assets": path.resolve(__dirname, "./src/assets"), // 资源文件路径
        "@utils": path.resolve(__dirname, "./src/utils"), // 工具函数路径
      },
    },

    // 开发服务器配置 - 本地开发时的服务器设置
    server: {
      // 指定端口，可通过.env文件配置
      port: env.VITE_PORT || 3000,
      // 自动打开浏览器并指定url后缀，开发时很方便
      open: env.VITE_OPEN !== "false" ? env.VITE_OPEN : false,
      // 允许局域网访问，方便手机等设备调试
      host: env.VITE_HOST || "0.0.0.0",
      // 代理配置 - 解决跨域问题，前端请求/api自动转发到目标服务器
      proxy: {
        // "/api": {
        //   target: env.VITE_API_URL, // 目标服务器地址，可在.env中配置
        //   changeOrigin: true, // 修改请求头中的host为目标URL
        //   secure: false, // 是否验证SSL证书，https接口需设为true
        //   rewrite: (path) => path.replace(/^\/api/, ""), // 路径重写，去除/api前缀
        // },
        // // 多代理配置示例 - 不同路径前缀代理到不同服务器
        // '/upload': {
        //   target: env.VITE_UPLOAD_URL || 'http://localhost:8000',
        //   changeOrigin: true,
        //   rewrite: (path) => path.replace(/^\/upload/, '')
        // }
      },
      // CORS配置 - 允许跨域请求
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },

    // 构建配置 - 生产环境打包设置
    build: {
      // 输出目录 - 构建产物的目录
      outDir: "dist",

      // 部署路径前缀 - 非根目录部署时必须配置，如'/admin/'
      // 可在.env文件中配置，方便不同环境使用不同路径
      base: env.VITE_BASE_URL || "/",

      // CSS代码拆分 - true时按需加载CSS，false时合并为一个文件
      // cssCodeSplit: true,

      // 是否生成manifest.json，用于后端集成时
      // manifest: true,

      // 代码压缩方式
      // 'terser': 压缩率高但较慢，适合生产环境追求更小体积
      // 'esbuild': 速度快但压缩率略低，开发构建适用（默认）
      // false: 不压缩，用于调试
      minify: "esbuild",

      // terser配置 - 使用terser压缩时的选项
      terserOptions: {
        compress: {
          // 生产环境下移除console和debugger，开发环境保留方便调试
          drop_console: isProd, // 自动检测生产环境
          drop_debugger: isProd,
        },
      },

      // 高级打包配置 - 大型项目优化时启用
      // rollupOptions: {
      //   output: {
      //     // 静态资源分类打包 - 便于CDN缓存控制
      //     chunkFileNames: 'assets/js/[name]-[hash].js',
      //     entryFileNames: 'assets/js/[name]-[hash].js',
      //     assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      //     // 代码分块策略 - 分离第三方库，提高缓存命中率
      //     manualChunks: {
      //       vendor: ['react', 'react-dom'], // 基础库单独打包
      //       // ui: ['antd'] // UI库单独打包，如使用antd
      //     }
      //   }
      // }
    },

    // 全局常量定义 - 在代码中直接使用，无需import
    // 常见用途：版本号、环境标识、特性开关
    // 使用方法：直接在代码中引用，如console.log(__APP_VERSION__)
    // 注意：字符串值必须用JSON.stringify包裹
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version), // 应用版本号
      __APP_ENV__: JSON.stringify(env.VITE_ENV || "development"), // 环境标识
      // __API_URL__: JSON.stringify(env.VITE_API_URL), // API地址 - 可根据需要添加
      // __FEATURE_FLAG__: env.VITE_FEATURE_FLAG === 'true', // 特性开关 - 布尔值不需要stringify
    },
  };
});
