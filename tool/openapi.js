#!/usr/bin/env zx

// 仅在 Windows 系统上使用 PowerShell
if (os.platform() === 'win32') {
  usePowerShell();
}

// 固定配置
const OPENAPI_DIR = path.join(process.cwd(), 'openapi');
const OUTPUT_DIR = path.join(process.cwd(), 'src/api/openapi');
const API_INDEX_FILE = path.join(process.cwd(), 'src/api/api.js');

echo(chalk.blue('OpenAPI 目录:'), OPENAPI_DIR);
echo(chalk.blue('输出目录:'), OUTPUT_DIR);
echo(chalk.blue('汇总文件:'), API_INDEX_FILE);

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

export const api = [
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
      '--default-status',`auto-correct`
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
* 生成 API 汇总文件
* @param {Array} successFiles 成功生成的文件列表
*/
async function generateApiIndex(successFiles) {
 if (successFiles.length === 0) {
   echo(chalk.yellow('⚠️  没有成功生成的文件，跳过汇总文件创建'));
   return;
 }
 
 const now = new Date();
 const timestamp = now.toLocaleString('zh-CN', {
   year: 'numeric',
   month: '2-digit',
   day: '2-digit',
   hour: '2-digit',
   minute: '2-digit',
   second: '2-digit'
 });
 
 // 生成导入语句和变量名映射
 const imports = successFiles.map(file => {
   const varName = file.filename.replace(/[-\s]/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
   const capitalizedVarName = varName.charAt(0).toUpperCase() + varName.slice(1);
   return {
     fileName: file.filename,
     schemasVar: `${file.filename}`,
     apiVar: `${capitalizedVarName}Api`,
     importStatement: `import { schemas as ${file.filename}, api as ${capitalizedVarName}Api } from '@/api/openapi/${file.filename}';`
   };
 });
 
 const importStatements = imports.map(imp => imp.importStatement).join('\n');
 
 // 生成 schemas 汇总对象
 const schemasEntries = imports.map(imp => 
   `  ${imp.schemasVar}`
 ).join(',\n');
 
 // 生成 api 汇总数组
 const apiEntries = imports.map(imp => 
   `  ...${imp.apiVar}`
 ).join(',\n');
 
 const indexContent = `// 此文件由生成器自动创建，请勿手动修改
// 生成时间: ${timestamp}
// 基于 OpenAPI 规范生成的 API 客户端汇总文件

${importStatements}

// 汇总所有 schemas
export const schemas = {
${schemasEntries}
};

// 汇总所有 api
export const api = [
${apiEntries}
];`;
 
 await fs.writeFile(API_INDEX_FILE, indexContent, 'utf8');
 echo(chalk.green(`📄 汇总文件已生成: ${path.basename(API_INDEX_FILE)}`));
}

/**
 * 主函数
 */
async function main() {
  let tempTemplatePath;
  
  try {
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