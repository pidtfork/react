// openapi.js

import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import $RefParser from "@apidevtools/json-schema-ref-parser";

// 配置
const OPENAPI_DIR = "openapi";
const OUTPUT_DIR = "src/api";
const API_FACTORY_IMPORT = "@/api/factory";

// 确保输出目录存在
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 解析单个 OpenAPI 文件
async function parseOpenAPIFile(filePath) {
  try {
    // 读取文件
    const rawContent = fs.readFileSync(filePath, "utf-8");
    const parsed = yaml.load(rawContent);

    // 解析 $ref
    const dereferenced = await $RefParser.dereference(parsed);

    // 获取 API 名称和前缀
    const apiName = dereferenced.info?.['x-name'] || dereferenced.info?.title || "untitled";
    const prefix = dereferenced.info?.['x-prefix'] || '/';
    
    const apiDefs = [];

    for (const [routePath, pathItem] of Object.entries(dereferenced.paths || {})) {
      // 处理路径级别的参数
      const pathParameters = pathItem.parameters || [];
      
      for (const [method, operation] of Object.entries(pathItem)) {
        // 跳过非操作属性（如 parameters, summary 等）
        if (typeof operation !== 'object' || !operation.responses) {
          continue;
        }

        // 合并路径参数和操作参数
        const allParameters = [
          ...pathParameters,
          ...(operation.parameters || [])
        ];

        // 解析参数
        const parameters = allParameters.map((param) => ({
          name: param.name,
          type: param.in.charAt(0).toUpperCase() + param.in.slice(1),
          required: param.required || false,
          schema: param.schema || {}
        }));

        // 解析请求体
        let requestBody = null;
        let requestContentType = null;
        if (operation.requestBody?.content) {
          const content = operation.requestBody.content;
          const contentTypes = Object.keys(content);
          
          // 优先选择 JSON 格式，其次是其他格式
          const selectedType = contentTypes.find(mime => mime.includes('json')) || contentTypes[0];
          if (selectedType) {
            requestBody = content[selectedType].schema || null;
            requestContentType = selectedType;
          }
        }

        // 解析响应
        let response = null;
        let responseContentType = null;
        const responses = operation.responses || {};
        
        // 查找成功响应（2xx）
        const successCode = Object.keys(responses).find(code => /^2\d{2}$/.test(code));
        if (successCode && responses[successCode].content) {
          const content = responses[successCode].content;
          const contentTypes = Object.keys(content);
          
          // 优先选择 JSON 格式，其次是其他格式
          const selectedType = contentTypes.find(mime => mime.includes('json')) || contentTypes[0];
          if (selectedType) {
            response = content[selectedType].schema || null;
            responseContentType = selectedType;
          }
        }

        // 添加前缀到路径
        const fullPath = prefix === '/' ? routePath : `${prefix}${routePath}`;

        apiDefs.push({
          method,
          path: fullPath,
          id: operation.operationId || `${method}_${routePath.replace(/[{}\/]/g, '_')}`,
          parameters,
          requestBody,
          requestContentType,
          response,
          responseContentType
        });
      }
    }

    return {
      name: apiName,
      prefix,
      apiDefs
    };
  } catch (error) {
    console.error(`解析文件 ${filePath} 失败:`, error.message);
    return null;
  }
}

// 生成 API 文件内容
function generateApiFileContent(name, apiDefs) {
  const apiDefsStr = JSON.stringify(apiDefs, null, 2);

  return `// ${name}.js - 自动生成的文件
import createApi from "${API_FACTORY_IMPORT}";

// 解析openapi
const apiDefs = ${apiDefsStr};

// 创建 API 实例
const { api, hooks } = createApi(apiDefs);

// 导出普通函数版本Api
export const ${name}Api = api;

// 导出 Hook 版本
export const ${name}ApiHooks = hooks;

// 解构导出具体方法，方便使用
export const {
${apiDefs.map(def => `  ${def.id}`).join(',\n')}
} = api;

export const {
${apiDefs.map(def => `  use${def.id.charAt(0).toUpperCase() + def.id.slice(1)}`).join(',\n')}
} = hooks;
`;
}

// 将名称转换为合法的文件名和变量名
function sanitizeName(name) {
  // 只保留字母数字，其他转下划线，然后转驼峰
  return name
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .split('_')
    .map((word, index) => 
      index === 0 
        ? word.toLowerCase() 
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

// 主函数
async function generateAllApis() {
  console.log("开始生成 API 文件...");
  
  // 确保输出目录存在
  ensureDir(OUTPUT_DIR);

  // 获取所有 OpenAPI 文件
  const files = fs.readdirSync(OPENAPI_DIR).filter(file => 
    file.endsWith('.yaml') || file.endsWith('.yml') || file.endsWith('.json')
  );

  if (files.length === 0) {
    console.log(`在 ${OPENAPI_DIR} 目录下没有找到 OpenAPI 文件`);
    return;
  }

  console.log(`找到 ${files.length} 个 OpenAPI 文件`);

  // 处理每个文件
  for (const file of files) {
    const filePath = path.join(OPENAPI_DIR, file);
    console.log(`\n处理文件: ${file}`);

    const result = await parseOpenAPIFile(filePath);
    if (!result || result.apiDefs.length === 0) {
      console.log(`  - 跳过：没有有效的 API 定义`);
      continue;
    }

    const { name, prefix, apiDefs } = result;
    
    // 生成文件名（使用 x-name）
    const fileName = sanitizeName(name);
    const outputPath = path.join(OUTPUT_DIR, `${fileName}.js`);

    // 生成文件内容
    const content = generateApiFileContent(fileName, apiDefs);

    // 写入文件
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`  ✓ 生成文件: ${outputPath}`);
    console.log(`  - API名称: ${name}`);
    console.log(`  - 路径前缀: ${prefix}`);
    console.log(`  - 包含 ${apiDefs.length} 个 API 定义`);
  }

  console.log("\n✨ API 文件生成完成!");
}

// 运行脚本
generateAllApis().catch(error => {
  console.error("生成失败:", error);
  process.exit(1);
});