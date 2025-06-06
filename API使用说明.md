# API 使用说明文档

本项目中的 API 客户端是通过 `openapi-zod-client` 工具根据多个 OpenAPI 文件自动生成的。

生成的每个模块基于 `@zodios/core` 构建，具备以下特性：

* 使用 Zod 在运行时校验请求参数与响应数据
* 自动推导 TypeScript 类型，调用时类型提示完整
* 每个 API 方法本质上都是调用 `zodios.request()`，只是自动添加了对应的 `method` 和 `url` 字段

## 模块导入

```ts
import { launch, batch } from "@/api";
import createAPIStateHook from "@/api/apiHooks";
```

## API 方法调用

所有 API 方法都是异步函数，支持两个参数：

```ts
const result = await apiModule.methodName(requestOptions, hookState);
```

### 参数说明

**requestOptions** (可选) - 请求配置对象，遵循 [Zodios RequestOptions](https://www.zodios.org/docs/client#request-options) 结构：

| 参数名 | 类型 | 说明 |
|--------|------|------|
| `data` | `any` | 请求体内容，用于 POST、PUT、PATCH |
| `params` | `Record<string, string \| number>` | 路径参数，如 `/process/:pid` 中的 `pid` |
| `queries` | `Record<string, string \| number \| string[] \| number[]>` | 查询参数，自动拼接到 URL |
| `headers` | `Record<string, string>` | 自定义请求头，如 Authorization、Content-Type |
| `baseURL` | `string` | 覆盖默认 API 根路径 |
| `signal` | `AbortSignal` | 用于取消请求（AbortController） |
| `timeout` | `number` | 请求超时毫秒数，默认无超时 |
| `auth` | `object` | 基本认证（用户名密码） |
| `responseType` | `string` | 响应格式，如 `"json"`、`"text"`、`"blob"` 等 |

**hookState** (可选) - API状态管理钩子，用于React组件中跟踪请求状态

### 返回格式

```ts
{
  success: boolean,     // 请求是否成功
  data: any,           // 响应数据
  error: Error | null, // 错误信息
  message: string      // 描述信息
}
```

## 在React组件中使用

### 基础用法（无状态跟踪）

```tsx
import { apiModule } from "@/api";

function DataList() {
  const [data, setData] = useState([]);
  
  const loadData = async () => {
    const { success, data } = await apiModule.getData();
    if (success) {
      setData(data);
    }
  };
  
  return (
    <button onClick={loadData}>
      加载数据
    </button>
  );
}
```

### 使用状态钩子（推荐）

```tsx
import { apiModule } from "@/api";
import createAPIStateHook from "@/api/apiHooks";

function DataManager() {
  const apiState = createAPIStateHook();
  const [data, setData] = useState([]);
  
  const loadData = async () => {
    const { success, data } = await apiModule.getData({}, apiState);
    if (success) {
      setData(data);
    }
  };
  
  return (
    <div>
      <button onClick={loadData} disabled={apiState.loading}>
        {apiState.loading ? "加载中..." : "加载数据"}
      </button>
      
      {apiState.error && (
        <div className="error">
          错误: {apiState.message}
        </div>
      )}
      
      {apiState.success && (
        <div className="success">
          操作成功！最后更新: {apiState.lastUpdated?.toLocaleString()}
        </div>
      )}
    </div>
  );
}
```

### 自定义状态字段

```tsx
const apiState = createAPIStateHook({
  totalCount: 0,
  currentPage: 1,
  hasMore: false
});

// 在API调用后更新自定义状态
const { success, data } = await apiModule.getData({ queries: { page: 1 } }, apiState);
if (success) {
  apiState.set(state => {
    state.totalCount = data.total;
    state.currentPage = data.page;
    state.hasMore = data.hasMore;
  });
}
```

## API状态钩子详解

### 状态字段

```ts
{
  // 基础状态
  loading: boolean,         // 请求加载中
  success: boolean,         // 请求成功
  message: string,          // 提示信息
  error: Error | null,      // 通用错误
  lastUpdated: Date | null, // 最后更新时间
  statusCode: number | null,// HTTP状态码
  isTimeout: boolean,       // 是否超时
  
  // 验证错误详情
  validationError: any,     // 所有验证错误
  requestError: any,        // 请求参数错误
  bodyError: any,           // 请求体错误
  responseError: any        // 响应数据错误
}
```

### 状态更新方法

```tsx
apiState.set(state => {
  state.loading = false;
  state.success = true;
  state.message = "操作完成";
  state.customField = "自定义值";
});
```

## 批量请求

使用 `batch` 方法执行多个并发请求：

```tsx
import { batch } from "@/api";

const syncData = async () => {
  const { success, data, results } = await batch([
    {
      method: "get",
      url: "/endpoint1",
      params: { id: "123" }
    },
    {
      method: "post", 
      url: "/endpoint2",
      data: { name: "test" }
    },
    {
      method: "get",
      url: "/endpoint3"
    }
  ], apiState);
  
  if (success) {
    const [result1, result2, result3] = data;
    // 处理批量结果
  }
};
```

### 批量请求状态收集示例

```tsx
function BatchOperations() {
  const batchState = createAPIStateHook({
    completedCount: 0,
    failedCount: 0,
    progressPercent: 0
  });

  const executeBatch = async () => {
    const requests = [
      { method: "get", url: "/data/1" },
      { method: "get", url: "/data/2" },
      { method: "post", url: "/process", data: { action: "start" } }
    ];

    const { success, data, results } = await batch(requests, batchState);
    
    // 更新批量操作统计
    batchState.set(state => {
      state.completedCount = results.filter(r => r.success).length;
      state.failedCount = results.filter(r => !r.success).length;
      state.progressPercent = 100;
    });

    return { success, aggregatedData: data, individualResults: results };
  };

  return (
    <div>
      <button onClick={executeBatch} disabled={batchState.loading}>
        执行批量操作
      </button>
      
      {batchState.loading && (
        <div>
          批量请求进行中... 
          完成: {batchState.completedCount} 
          失败: {batchState.failedCount}
        </div>
      )}
      
      {batchState.success && (
        <div>
          批量操作完成！进度: {batchState.progressPercent}%
        </div>
      )}
    </div>
  );
}
```

### 批量请求返回格式
```ts
{
  success: boolean,      // 所有请求是否都成功
  data: any[],          // 各请求的响应数据数组
  results: any[],       // 各请求的完整结果数组
  message: string       // 聚合状态信息
}
```

## 与Zustand Store集成

在Store中使用API和状态钩子：

```ts
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { apiModule, batch } from "@/api";

const useStore = create(immer((set, get) => ({
  data: [],
  
  fetchData: async (hookState = null) => {
    const { success, data } = await apiModule.getData({}, hookState);
    if (success && data) {
      set(state => {
        state.data = data;
      });
    }
  },
  
  // 复杂业务逻辑示例
  performComplexOperation: async (id, hookState = null) => {
    try {
      // 串行请求
      const { success: getSuccess, data: itemData } = 
        await apiModule.getItem({ params: { id } }, hookState);
      
      if (!getSuccess) throw new Error("获取数据失败");
      
      const { success: processSuccess } = 
        await apiModule.processItem({ params: { id } }, hookState);
      
      if (!processSuccess) throw new Error("处理失败");
      
      set(state => {
        state.currentItem = itemData;
      });
      
      return { success: true, message: "操作成功" };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
})));
```

## 最佳实践

### 错误处理
```tsx
const handleOperation = async () => {
  const { success, error, message, statusCode } = await apiModule.createItem({
    data: itemData
  }, apiState);
  
  if (!success) {
    // 根据错误类型处理
    if (apiState.isTimeout) {
      showMessage("请求超时，请重试");
    } else if (statusCode === 401) {
      redirectToLogin();
    } else if (apiState.validationError) {
      showValidationErrors(apiState.validationError);
    } else {
      showMessage(message);
    }
  }
};
```

### 加载状态管理
```tsx
return (
  <div>
    <button 
      onClick={loadData} 
      disabled={apiState.loading}
      className={apiState.loading ? 'loading' : ''}
    >
      {apiState.loading ? (
        <>
          <Spinner /> 加载中...
        </>
      ) : (
        '加载数据'
      )}
    </button>
    
    {apiState.error && (
      <ErrorMessage 
        message={apiState.message}
        onRetry={loadData}
      />
    )}
  </div>
);
```

### 参数验证
```tsx
// 请求前验证参数
const createItem = async (itemData) => {
  if (!itemData.name?.trim()) {
    apiState.set(state => {
      state.error = new Error("名称不能为空");
      state.message = "名称不能为空";
    });
    return;
  }
  
  const result = await apiModule.createItem({ data: itemData }, apiState);
  return result;
};
```

## 调试技巧

### 监控API状态
```tsx
useEffect(() => {
  console.log('API State:', {
    loading: apiState.loading,
    success: apiState.success,
    error: apiState.error?.message,
    statusCode: apiState.statusCode,
    lastUpdated: apiState.lastUpdated
  });
}, [apiState.lastUpdated]);
```

### 错误详情
```tsx
if (apiState.validationError) {
  console.log('验证错误详情:', {
    type: apiState.validationError.type,
    requestError: apiState.requestError,
    bodyError: apiState.bodyError,
    responseError: apiState.responseError
  });
}
```