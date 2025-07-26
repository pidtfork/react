
// ========== 默认 HTTP 请求发送器 ==========
// 基于原生 fetch 的默认实现，可以替换为其他请求库（如 axios、Electron IPC 等）

const baseURL = import.meta.env.VITE_API_URL || "";
/**
 * 默认的请求发送器
 * @param {Object} apiDef - API 定义对象，包含 method、url 和 requestContentType
 * @param {Object} body - 请求体数据
 * @returns {Promise} 响应数据
 */
async function defaultSendRequest(apiDef, body) {
  const { method, url, requestContentType } = apiDef;
  const isPostMethod = ["post", "put", "patch", "options", "trace"].includes(method.toLowerCase());
  const isGetMethod = ["get", "delete", "head"].includes(method.toLowerCase());

  try {
    let finalUrl = `${baseURL}${url}`;
    let requestInit = {
      method,
      credentials: "include", // 携带 cookies
    };

    // 根据内容类型设置请求头和体
    if (isPostMethod && body) {
      if (requestContentType?.includes('multipart/form-data')) {
        // 文件上传：使用 FormData，不设置 Content-Type（浏览器自动设置边界）
        requestInit.body = body instanceof FormData ? body : body;
      } else {
        // JSON 数据
        requestInit.headers = { "Content-Type": "application/json" };
        requestInit.body = JSON.stringify(body);
      }
    } else if (isGetMethod && body) {
      // GET/DELETE 使用查询参数
      const searchParams = new URLSearchParams();
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, value);
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        finalUrl += (url.includes('?') ? '&' : '?') + queryString;
      }
    }

    const response = await fetch(finalUrl, requestInit);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // 根据响应类型解析
    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return await response.json();
    } else if (contentType?.includes("application/octet-stream")) {
      return response; // 返回 Response 对象用于文件下载
    } else {
      return await response.text();
    }

  } catch (error) {
    console.error("HTTP 请求发送失败:", error);
    throw error;
  }
}



export default defaultSendRequest