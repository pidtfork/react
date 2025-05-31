# React Base 项目

这是一个基于 Vite + React 的现代化前端项目模板，集成了多个实用工具和最佳实践。

## 技术栈

- **构建工具：** Vite 6.x
- **前端框架：** React 19.x
- **路由管理：** Wouter 3.x
- **状态管理：** Zustand 5.x
- **数据请求：** Axios
- **样式解决方案：** TailwindCSS 4.x
- **UI组件：** shadcn/ui 2.5.x
- **工具库：** 
  - class-variance-authority：条件样式管理
  - clsx & tailwind-merge：类名合并
  - lucide-react：图标库

## 项目结构

```
├── src/
│   ├── api/          # API 接口和请求配置
│   ├── assets/       # 静态资源文件
│   ├── components/   # 公共组件
│   ├── hooks/        # 自定义 Hooks
│   ├── lib/          # 工具函数库
│   ├── pages/        # 页面组件
│   ├── routes/       # 路由配置
│   ├── stores/       # 状态管理
│   ├── App.jsx       # 应用入口布局页面
│   └── main.jsx      # 应用入口文件
```

## 环境变量配置

项目使用 `.env` 文件进行环境变量配置：

```bash
# 开发环境 (.env.development)
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_TITLE=Dev App

# 生产环境 (.env.production)
VITE_API_BASE_URL=https://api.production.com
VITE_APP_TITLE=Production App

# 预发环境 (.env.staging)
VITE_API_BASE_URL=https://api.staging.com
VITE_APP_TITLE=Staging App
```

注意：只有 `VITE_` 前缀的变量会被暴露给客户端代码。

## 开发指南

### 作为模板新建项目

degit 它的名字是 "de-git" 的缩写，意为“去 Git 化”。

它的主要目的是：从一个 Git 仓库下载文件，但不包括该仓库的 .git 历史记录。 换句话说，它只下载仓库的最新快照（也就是当前版本的文件内容）。

```bash
# my-new-project 为新项目名称
npm install -g degit
degit pidtfork/react my-new-project
# or
npx degit pidtfork/react my-new-project
```

### 安装依赖

```bash
pnpm install
```

### 更新路由配置

项目根目录下运行`updateRoute.js`脚本会自动将`./src/pages`目录下以大写开头的`.jsx`页面文件写入到`./src/routers/config.js`
同时保留目录结构到路由配置文件，默认将`Home.jsx`转换为根路径`/`
在启动开发服务器、构建生产版本、预览生产构建均会自动先执行更新路由配置脚本

```bash
$ node ./updateRoute.js --help

路由生成器 - 根据页面文件生成路由配置

用法:
  node generateRoute.js [选项]

选项:
  --root                 不将Home页面转换为根路径
  --prefix <前缀>        为所有路由添加前缀
  --pages-dir <目录>     指定页面目录路径 (默认: ./src/pages)
  --output <文件路径>    指定输出配置文件路径 (默认: ./src/routes/config.js)
  --help                显示此帮助信息
```

### 添加shadcn组件

```bash
pnpm dlx shadcn@latest add button
```

### 添加全部最新shadcn组件

```bash
pnpm dlx shadcn@latest add --all --overwrite
```


### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产构建

```bash
pnpm preview
```

## shadcn-ui组件全览

- shadcn已经移除了Toast组件

```bash
$ tree ./src/components/ui
./src/components/ui
|-- accordion.jsx
|-- alert-dialog.jsx
|-- alert.jsx
|-- aspect-ratio.jsx
|-- avatar.jsx
|-- badge.jsx
|-- breadcrumb.jsx
|-- button.jsx
|-- calendar.jsx
|-- card.jsx
|-- carousel.jsx
|-- chart.jsx
|-- checkbox.jsx
|-- collapsible.jsx
|-- command.jsx
|-- context-menu.jsx
|-- dialog.jsx
|-- drawer.jsx
|-- dropdown-menu.jsx
|-- form.jsx
|-- hover-card.jsx
|-- input-otp.jsx
|-- input.jsx
|-- label.jsx
|-- menubar.jsx
|-- navigation-menu.jsx
|-- pagination.jsx
|-- popover.jsx
|-- progress.jsx
|-- radio-group.jsx
|-- resizable.jsx
|-- scroll-area.jsx
|-- select.jsx
|-- separator.jsx
|-- sheet.jsx
|-- sidebar.jsx
|-- skeleton.jsx
|-- slider.jsx
|-- sonner.jsx
|-- switch.jsx
|-- table.jsx
|-- tabs.jsx
|-- textarea.jsx
|-- toggle-group.jsx
|-- toggle.jsx
└-- tooltip.jsx

0 directories, 46 files
```

## 特性

- 🚀 基于 Vite 的快速开发和构建
- 📦 开箱即用的 React 最佳实践
- 🎨 集成 TailwindCSS 的现代化样式解决方案
- 🔄 Axios 的数据请求方案
- 📱 响应式设计支持
- 🛠 完整的开发工具链和类型支持
- 🌐 灵活的路由配置
- 💾 简单高效的状态管理

## 路径别名

项目配置了 `@` 路径别名，指向 `src` 目录，可以用于简化导入路径：

```javascript
import { Button } from '@/components/ui/button'
```


## `assets` 和 `public` 的区别
          
在 React/Vite 项目中，`assets` 和 `public` 文件夹都用于存放静态资源，但它们有以下主要区别：

1. 构建处理方式：
   - `assets` 文件夹中的文件会经过 Vite 的构建处理：
     - 会被打包和优化（如压缩、hash命名等）
     - 支持模块导入（可以通过 import 语句引入）
     - 适合需要被构建工具处理的资源（如 SVG、图片等）

   - `public` 文件夹中的文件会被原样复制到构建目录：
     - 不会经过任何构建处理
     - 通过绝对路径访问（以 / 开头）
     - 适合不需要处理的静态资源（如 robots.txt、favicon.ico 等）

2. 使用场景：
   - `assets` 适合：
     - 需要在代码中 import 引用的资源
     - 需要经过构建优化的资源
     - 项目相关的图片、字体等资源

   - `public` 适合：
     - 不需要构建处理的文件
     - 需要保持原始文件名的资源
     - 需要通过绝对路径访问的文件
     - 大型静态资源（如视频）

3. 引用方式：
   - `assets` 中的文件：
   ```javascript
   import logo from '@/assets/logo.svg'
   ```

   - `public` 中的文件：
   ```html
   <img src="/logo.png" />
   <!-- 或者 -->
   <link rel="icon" href="/favicon.ico" />
   ```

建议：
- 优先使用 `assets` 目录，让构建工具帮助优化资源
- 只在必要时（如第三方静态资源、需要保持原始文件名）才使用 `public` 目录

        