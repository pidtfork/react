#!/usr/bin/env zx

// 仅在 Windows 系统上使用 PowerShell
if (os.platform() === 'win32') {
  usePowerShell();
}

// 固定配置
const OPENAPI_DIR = path.join(process.cwd(), 'openapi');
const OUTPUT_DIR = path.join(process.cwd(), 'src/api/openapi');
const API_INDEX_FILE = path.join(process.cwd(), 'src/api/index.js');
const CONFIG_FILE = path.join(process.cwd(), 'src/api/config.js');

echo(chalk.blue('OpenAPI 目录:'), OPENAPI_DIR);
echo(chalk.blue('输出目录:'), OUTPUT_DIR);
echo(chalk.blue('API 文件:'), API_INDEX_FILE);
echo(chalk.blue('配置文件:'), CONFIG_FILE);

// 定义 Handlebars 模板内容
const templateContent = `import { z } from "zod";

{{#if imports}}
{{#each imports}}
import { {{{@key}}} } from "./{{{this}}}"
{{/each}}
{{/if}}


{{#if types}}
{{#each types}}
{{{this}}};
{{/each}}
{{/if}}


{{#each schemas}}
const {{@key}}{{#if (lookup ../emittedType @key)}}: z.ZodType<{{@key}}>{{/if}} = {{{this}}};
{{/each}}

{{#ifNotEmptyObj schemas}}
export const schemas = {
{{#each schemas}}
	{{@key}},
{{/each}}
};
{{/ifNotEmptyObj}}

export default [
{{#each endpoints}}
	{
		method: "{{method}}",
		path: "{{path}}",
		{{#if @root.options.withAlias}}
		{{#if alias}}
		alias: "{{alias}}",
		{{/if}}
		{{/if}}
		{{#if description}}
		description: \`{{description}}\`,
		{{/if}}
		{{#if requestFormat}}
		requestFormat: "{{requestFormat}}",
		{{/if}}
		{{#if parameters}}
		parameters: [
			{{#each parameters}}
			{
				name: "{{name}}",
				{{#if description}}
				description: \`{{description}}\`,
				{{/if}}
				{{#if type}}
				type: "{{type}}",
				{{/if}}
				schema: {{{schema}}}
			},
			{{/each}}
		],
		{{/if}}
		response: {{{response}}},
		{{#if errors.length}}
		errors: [
			{{#each errors}}
			{
				{{#ifeq status "default" }}
				status: "default",
				{{else}}
				status: {{status}},
				{{/ifeq}}
				{{#if description}}
				description: \`{{description}}\`,
				{{/if}}
				schema: {{{schema}}}
			},
			{{/each}}
		]
		{{/if}}
	},
{{/each}}
];
`;


// 默认 config.js 内容
const defaultConfigContent = `function use(zoidiosClinet) {
  // 可以在这里添加拦截器或其他客户端配置
}

// 统一的请求方法，返回固定格式的响应对象
async function request(zodiosClient, ...args) {
  try {
    const response = await zodiosClient.request(...args);
    return {
      success: true,
      data: response,
      error: null,
      code: null,
      message: null
    };
  } catch (error) {
    return {
      success: false,
      data: null,
      error: error,
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || '请求失败'
    };
  }
}

export default {
  BASE_URL: "/",
  apiPerfix: {},
  config: {
    axiosConfig: {},
  },
  use,
  request,
};`;

/**
 * 检查并创建 config.js 文件
 */
async function ensureConfigFile() {
  try {
    const configExists = await fs.pathExists(CONFIG_FILE);
    
    if (!configExists) {
      echo(chalk.yellow('⚠️  config.js 不存在，创建默认配置文件...'));
      
      // 确保目录存在
      await fs.ensureDir(path.dirname(CONFIG_FILE));
      
      // 写入默认配置内容
      await fs.writeFile(CONFIG_FILE, defaultConfigContent, 'utf8');
      
      echo(chalk.green('✅ 已创建默认 config.js 文件'));
    } else {
      echo(chalk.green('✅ config.js 文件已存在'));
    }
  } catch (error) {
    echo(chalk.red(`❌ 处理 config.js 文件时出错: ${error.message}`));
    throw error;
  }
}

/**
 * 获取目录下所有 OpenAPI 规范文件
 * @param {string} dir 目录路径
 * @returns {Promise<Array>} 文件列表
 */
async function getOpenApiFiles(dir) {
  const files = [];
  const supportedExts = ['.json', '.yaml', '.yml'];
  
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (supportedExts.includes(ext)) {
          const fullPath = path.join(dir, entry.name);
          const filename = path.basename(entry.name, ext);
          files.push({
            name: entry.name,
            fullPath,
            filename,
            outputName: `${filename}.js`
          });
        }
      }
    }
  } catch (error) {
    echo(chalk.red(`读取目录 ${dir} 时出错: ${error.message}`));
    throw error;
  }
  
  return files;
}

/**
 * 生成单个 API 文件
 * @param {Object} file 文件信息
 * @param {string} tempTemplatePath 临时模板路径
 * @returns {Promise<boolean>} 是否成功
 */
async function generateApiFile(file, tempTemplatePath) {
  try {
    const outputPath = path.join(OUTPUT_DIR, file.outputName);
    
    echo(chalk.cyan(`🔄 正在处理: ${file.name}`));
    
    // 构建命令参数
    const args = [
      file.fullPath,
      '-o', outputPath,
      '-t', tempTemplatePath,
      '--default-status', 'auto-correct'
    ];
    
    // 执行命令
    await $`openapi-zod-client ${args}`;
    
    echo(chalk.green(`  ✅ 已生成: ${file.outputName}`));
    return true;
    
  } catch (error) {
    echo(chalk.red(`  ❌ 生成失败: ${file.name}`));
    echo(chalk.red(`     错误: ${error.message}`));
    return false;
  }
}

/**
 * 解析生成的 API 文件获取 API 端点信息
 * @param {Object} file 文件信息
 * @returns {Promise<Array>} API 端点信息数组
 */
async function parseApiFileEndpoints(file) {
  try {
    const outputPath = path.join(OUTPUT_DIR, file.outputName);
    
    // 动态导入生成的 API 文件
    const moduleUrl = `file://${outputPath}`;
    const apiModule = await import(moduleUrl);
    
    // 获取默认导出的 API 数组
    const apiArray = apiModule.default;
    
    if (!Array.isArray(apiArray)) {
      echo(chalk.yellow(`⚠️  文件 ${file.outputName} 的默认导出不是数组`));
      return [];
    }
    
    // 提取每个端点的 method, path, alias 信息
    const endpoints = apiArray
      .filter(endpoint => endpoint && typeof endpoint === 'object')
      .map(endpoint => ({
        method: endpoint.method,
        path: endpoint.path,
        alias: endpoint.alias
      }))
      .filter(endpoint => endpoint.method && endpoint.path && endpoint.alias);
    
    return endpoints;
  } catch (error) {
    echo(chalk.yellow(`⚠️  动态导入文件 ${file.outputName} 时出错: ${error.message}`));
    return [];
  }
}

/**
 * 生成 API 汇总文件
 * @param {Array} successFiles 成功生成的文件列表
 */
async function generateApiIndex(successFiles) {
  if (successFiles.length === 0) {
    echo(chalk.yellow('⚠️  没有成功生成的文件，跳过汇总文件创建'));
    return;
  }

  echo(chalk.cyan('🔍 正在解析 API 文件的端点信息...'));
  
  // 解析每个文件的端点信息
  const apiModules = [];
  for (const file of successFiles) {
    const endpoints = await parseApiFileEndpoints(file);
    apiModules.push({
      filename: file.filename,
      endpoints,
      varName: file.filename.replace(/[-\s]/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
    });
  }
  
  // 生成导入语句
  const importStatements = apiModules
    .map(module => `import ${module.varName}Api from "@/api/openapi/${module.filename}";`)
    .join('\n');
  
  // 生成 endpoints 数组
  const endpointsEntries = apiModules
    .map(module => `  ...(config.apiPerfix.${module.varName} ? mergeApis({ [config.apiPerfix.${module.varName}]: ${module.varName}Api }) : makeApi(${module.varName}Api)),`)
    .join('\n');
  
  // 生成 API 导出对象
  const apiExports = [];
  for (const module of apiModules) {
    if (module.endpoints.length > 0) {
      const methods = module.endpoints
        .map(endpoint => `  ${endpoint.alias}: (data) => request( data, { method: "${endpoint.method}", url: "${endpoint.path}" }),`)
        .join('\n');
      
      apiExports.push(`export const ${module.varName} = {\n${methods}\n};`);
    }
  }
  
  const apiExportsString = apiExports.join('\n\n');
  
  const indexContent = `// 此文件由生成器自动创建，请勿手动修改
// 基于 OpenAPI 规范生成的 API 客户端汇总文件

import { makeApi, mergeApis, Zodios } from "@zodios/core";
import config from "./config";

// 动态导入所有生成的 OpenAPI 模块
${importStatements}

// 构建 endpoints 数组
const endpoints = [
${endpointsEntries}
];

// 创建 Zodios 客户端实例
const zoidiosClinet = new Zodios(config.BASE_URL, endpoints, config.config);

// 应用配置钩子
config.use(zoidiosClinet);

// 统一的请求方法，通过 config.request 实现
const request = (data,req) => {
  if (data != undefined && typeof data != "object") {
    throw "zodios request 请求参数错误"
  }
  return config.request(zoidiosClinet, {...data,...req})
};

// 导出 API 方法对象
${apiExportsString}`;
  
  await fs.writeFile(API_INDEX_FILE, indexContent, 'utf8');
  echo(chalk.green(`📄 API 汇总文件已生成: ${path.basename(API_INDEX_FILE)}`));
  
  // 输出统计信息
  const totalEndpoints = apiModules.reduce((sum, module) => sum + module.endpoints.length, 0);
  echo(chalk.green(`📊 统计信息:`));
  echo(chalk.green(`   模块数量: ${apiModules.length}`));
  echo(chalk.green(`   API 方法: ${totalEndpoints}`));
}

/**
 * 主函数
 */
async function main() {
  let tempTemplatePath;
  
  try {
    // 检查并创建 config.js 文件
    await ensureConfigFile();
    
    // 检查 OpenAPI 目录是否存在
    if (!(await fs.pathExists(OPENAPI_DIR))) {
      echo(chalk.red(`❌ 错误: OpenAPI 目录不存在: ${OPENAPI_DIR}`));
      process.exit(1);
    }
    
    // 获取所有 OpenAPI 文件
    echo(chalk.cyan('🔍 正在扫描 OpenAPI 文件...'));
    const files = await getOpenApiFiles(OPENAPI_DIR);
    
    if (files.length === 0) {
      echo(chalk.yellow('⚠️  警告: 未找到任何 OpenAPI 规范文件 (.json, .yaml, .yml)'));
      return;
    }
    
    echo(chalk.green(`📁 找到 ${files.length} 个 OpenAPI 文件:`));
    files.forEach(file => {
      echo(chalk.gray(`  - ${file.name} -> ${file.outputName}`));
    });
    
    // 确保输出目录为空。如果目录不为空，则删除目录内容。如果目录不存在，则创建该目录。不会删除目录本身。
    await fs.emptyDir(OUTPUT_DIR);
    
    // 创建临时模板文件
    tempTemplatePath = path.join(os.tmpdir(), `openapi-template-${Date.now()}.hbs`);
    await fs.writeFile(tempTemplatePath, templateContent, 'utf8');
    echo(chalk.blue('📝 临时模板文件已创建'));
    
    // 生成所有 API 文件
    echo(chalk.cyan('\n🚀 开始生成 API 文件...'));
    const results = [];
    
    for (const file of files) {
      const success = await generateApiFile(file, tempTemplatePath);
      if (success) {
        results.push(file);
      }
    }
    
    // 生成汇总文件
    echo(chalk.cyan('\n📋 生成汇总文件...'));
    await generateApiIndex(results);
    
    // 输出统计信息
    const successCount = results.length;
    const totalCount = files.length;
    
    echo(chalk.green(`\n✅ 处理完成:`));
    echo(chalk.green(`   成功: ${successCount}/${totalCount} 个文件`));
    
    if (successCount < totalCount) {
      echo(chalk.yellow(`   失败: ${totalCount - successCount} 个文件`));
    }
    
  } catch (error) {
    echo(chalk.red(`❌ 生成过程中出错: ${error.message}`));
    process.exit(1);
  } finally {
    // 清理临时文件
    if (tempTemplatePath) {
      try {
        await fs.remove(tempTemplatePath);
        echo(chalk.gray('🧹 已清理临时模板文件'));
      } catch (cleanupError) {
        echo(chalk.yellow(`⚠️  警告: 清理临时文件失败: ${cleanupError.message}`));
      }
    }
  }
}

// 运行主函数
main();