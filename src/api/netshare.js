// netshare.js - 自动生成的文件
import createApi from "@/api/factory";

// 解析openapi
const apiDefs = [
  {
    "method": "get",
    "path": "/api/server-info",
    "id": "getServerInfo",
    "parameters": [],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "object",
      "properties": {
        "ip": {
          "type": "string",
          "format": "ipv4",
          "example": "192.168.1.100"
        },
        "port": {
          "type": "integer",
          "minimum": 1,
          "maximum": 65535,
          "example": 3000
        }
      },
      "required": [
        "ip",
        "port"
      ]
    },
    "responseContentType": "application/json"
  },
  {
    "method": "get",
    "path": "/api/clipboard",
    "id": "getClipboard",
    "parameters": [],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "content": {
            "type": "string"
          },
          "time": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "id",
          "content",
          "time"
        ]
      }
    },
    "responseContentType": "application/json"
  },
  {
    "method": "post",
    "path": "/api/clipboard",
    "id": "saveClipboard",
    "parameters": [],
    "requestBody": {
      "type": "object",
      "properties": {
        "content": {
          "type": "string"
        }
      },
      "required": [
        "content"
      ]
    },
    "requestContentType": "application/json",
    "response": {
      "type": "object",
      "properties": {
        "id": {
          "type": "string"
        },
        "content": {
          "type": "string"
        },
        "time": {
          "type": "string",
          "format": "date-time"
        }
      },
      "required": [
        "id",
        "content",
        "time"
      ]
    },
    "responseContentType": "application/json"
  },
  {
    "method": "delete",
    "path": "/api/clipboard/{id}",
    "id": "deleteClipboard",
    "parameters": [
      {
        "name": "id",
        "type": "Path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "object",
      "properties": {
        "success": {
          "type": "boolean"
        }
      }
    },
    "responseContentType": "application/json"
  },
  {
    "method": "get",
    "path": "/api/files",
    "id": "getFiles",
    "parameters": [],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "size": {
            "type": "integer"
          },
          "uploadTime": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "id",
          "name",
          "type",
          "size",
          "uploadTime"
        ]
      }
    },
    "responseContentType": "application/json"
  },
  {
    "method": "post",
    "path": "/api/files/upload",
    "id": "uploadFile",
    "parameters": [],
    "requestBody": {
      "type": "object",
      "properties": {
        "files": {
          "type": "string",
          "format": "binary"
        }
      }
    },
    "requestContentType": "multipart/form-data",
    "response": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": {
            "type": "string"
          },
          "name": {
            "type": "string"
          },
          "type": {
            "type": "string"
          },
          "size": {
            "type": "integer"
          },
          "uploadTime": {
            "type": "string",
            "format": "date-time"
          }
        },
        "required": [
          "id",
          "name",
          "type",
          "size",
          "uploadTime"
        ]
      }
    },
    "responseContentType": "application/json"
  },
  {
    "method": "delete",
    "path": "/api/files/{id}",
    "id": "deleteFile",
    "parameters": [
      {
        "name": "id",
        "type": "Path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "object",
      "properties": {
        "success": {
          "type": "boolean"
        }
      }
    },
    "responseContentType": "application/json"
  },
  {
    "method": "get",
    "path": "/api/files/{id}/download",
    "id": "downloadFile",
    "parameters": [
      {
        "name": "id",
        "type": "Path",
        "required": true,
        "schema": {
          "type": "string"
        }
      }
    ],
    "requestBody": null,
    "requestContentType": null,
    "response": {
      "type": "string",
      "format": "binary"
    },
    "responseContentType": "application/octet-stream"
  }
];

// 创建 API 实例
const { api, hooks } = createApi(apiDefs);

// 导出普通函数版本Api
export const netshareApi = api;

// 导出 Hook 版本
export const netshareApiHooks = hooks;

// 解构导出具体方法，方便使用
export const {
  getServerInfo,
  getClipboard,
  saveClipboard,
  deleteClipboard,
  getFiles,
  uploadFile,
  deleteFile,
  downloadFile
} = api;

export const {
  useGetServerInfo,
  useGetClipboard,
  useSaveClipboard,
  useDeleteClipboard,
  useGetFiles,
  useUploadFile,
  useDeleteFile,
  useDownloadFile
} = hooks;
