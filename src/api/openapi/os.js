import { z } from "zod";

const Error = z.object({ code: z.string(), message: z.string() }).passthrough();

export const schemas = {
  Error,
};

export const api = [
  {
    method: "get",
    path: "/cpu/info",
    alias: "getCpuInfo",
    requestFormat: "json",
    response: z
      .object({ model: z.string(), cores: z.number().int() })
      .passthrough(),
    errors: [
      {
        status: 400,
        description: `请求错误`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/os/version",
    alias: "getOsVersion",
    requestFormat: "json",
    response: z.object({ version: z.string() }).passthrough(),
    errors: [
      {
        status: 400,
        description: `请求错误`,
        schema: Error,
      },
    ],
  },
];
