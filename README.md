# React

基于 React 19 和 OpenAPI 规范的现代化前端应用开发框架。

## 项目概述

本项目采用最新的前端技术栈，通过 OpenAPI 规范驱动的开发模式，实现了从 API 定义到前端代码的自动化生成。项目强调开发效率和代码质量，通过自动化工具链减少重复工作，让开发者专注于业务逻辑实现。

## 技术特性

### 核心架构

项目基于 React 19 和 Vite 6 构建，采用 TailwindCSS 4 作为样式解决方案，集成了 shadcn/ui 组件库提供丰富的 UI 组件。状态管理使用 Zustand 5 配合 immer 中间件，确保状态更新的不可变性。路由方案选择轻量级的 Wouter 3。

### 开发流程

项目采用 API 优先的开发模式。开发者首先编写 OpenAPI 3.1.0 规范文件，通过自动化工具生成类型安全的 API 调用代码。生成的代码包含了 AJV 数据验证，确保运行时数据的正确性。这种方式保证了前后端接口的一致性，大幅减少了接口联调的工作量。

### 代码组织

项目采用清晰的目录结构，将页面组件、业务组件、UI 组件、状态管理和 API 调用代码分离。通过自动化路由生成工具，页面组件能够自动映射为应用路由。项目制定了严格的代码规范，包括组件大小限制、命名规范和文件组织方式，确保代码的可维护性。

## 快速开始

### 环境要求

- Node.js 18.0 或更高版本
- pnpm 8.0 或更高版本

### 安装依赖

```bash
git clone https://github.com/pidtfork/react
cd react
pnpm install
```

### 开发流程

首先，在 `openapi` 目录下创建或修改 OpenAPI 规范文件：

```bash
# 生成 API 代码
pnpm openapi

# 启动开发服务器
pnpm dev
```

开发服务器会自动生成路由配置并启动应用。如果需要使用模拟数据进行开发：

```bash
# 在新的终端窗口启动 mock 服务
pnpm mock
```

### 构建部署

```bash
# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview
```

## 项目结构

```
.
├── openapi/              # OpenAPI 规范文件
├── src/
│   ├── api/              # 自动生成的 API 调用代码
│   ├── components/       # 组件库
│   │   ├── common/       # 业务组件
│   │   └── ui/           # UI 基础组件
│   ├── pages/            # 页面组件
│   ├── routes/           # 路由配置
│   └── stores/           # 状态管理
├── tool/                 # 构建工具脚本
└── package.json
```

## 开发指南

### API 开发

在 `openapi` 目录下创建 YAML 格式的 OpenAPI 规范文件。运行 `pnpm openapi` 命令后，工具会自动生成对应的 API 调用函数和 React Hooks。生成的代码包含完整的类型定义和数据验证逻辑。

### 页面开发

在 `src/pages` 目录下创建页面组件。页面组件会自动被路由系统识别并生成对应的路由配置。复杂页面可以创建同名目录，将子组件和相关逻辑文件组织在一起。

### 状态管理

对于需要跨页面共享的状态或复杂的业务逻辑，在 `src/stores` 目录下创建对应的 Store。Store 使用 Zustand 和 immer 实现，提供简洁的 API 和不可变状态更新。

## 可用脚本

- `pnpm dev` - 启动开发服务器
- `pnpm build` - 构建生产版本
- `pnpm preview` - 预览生产构建
- `pnpm openapi` - 根据 OpenAPI 规范生成 API 代码
- `pnpm route` - 生成路由配置
- `pnpm mock` - 启动 mock 服务器

## 相关文档

详细的开发规范请参考 `项目开发规范.md` 文件。

## 许可证

GPL v3