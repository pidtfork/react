#!/usr/bin/env zx

// 仅在 Windows 系统上使用 PowerShell
if (os.platform() === 'win32') {
  usePowerShell();
}

// 全局配置
const PREFIX = '';  //
const PAGES_DIR = path.join(process.cwd(), 'src/pages');
const CONFIG_PATH = path.join(process.cwd(), 'src/routes/config.js');

echo(chalk.blue('路由前缀:'), PREFIX || '(无)');
echo(chalk.blue('Pages 目录:'), PAGES_DIR);
echo(chalk.blue('配置文件路径:'), CONFIG_PATH);

/**
 * 递归获取目录下所有大写开头的 .jsx 文件
 * @param {string} dir 目录路径
 * @param {string} basePath 基础路径（用于保持相对路径结构）
 * @returns {Promise<Array>} 文件信息数组
 */
function getJsxFiles(dir, basePath = '') {
  return new Promise(async (resolve, reject) => {
    const files = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);
        
        if (entry.isDirectory()) {
          // 递归处理子目录
          const subFiles = await getJsxFiles(fullPath, relativePath);
          files.push(...subFiles);
        } else if (entry.isFile() && entry.name.endsWith('.jsx')) {
          // 检查文件名是否以大写字母开头
          if (/^[A-Z]/.test(entry.name)) {
            const componentName = path.basename(entry.name, '.jsx');
            const importPath = `@/pages/${relativePath.replace(/\\/g, '/').replace('.jsx', '')}`;
            
            // 生成路由路径（保持目录结构，将路径转换为小写）
            let routePath;
            if (componentName === 'Home' && basePath === '') {
              routePath = PREFIX ? `${PREFIX}/` : '/';
            } else {
              const pathWithoutExt = relativePath.replace('.jsx', '');
              const normalizedPath = `/${pathWithoutExt.replace(/\\/g, '/').toLowerCase()}`;
              routePath = PREFIX ? `${PREFIX}${normalizedPath}` : normalizedPath;
            }
            
            files.push({
              componentName,
              importPath,
              routePath,
              key: relativePath.replace(/\\/g, '/').replace('.jsx', '').toLowerCase().replace(/\//g, '_')
            });
          }
        }
      }
      
      resolve(files);
    } catch (error) {
      echo(chalk.red(`读取目录 ${dir} 时出错: ${error.message}`));
      reject(error);
    }
  });
}

/**
 * 生成路由配置文件内容
 * @param {Array} files 文件信息数组
 * @returns {string} 配置文件内容
 */
function generateConfigContent(files) {
  // 生成 import 语句
  const imports = files.map(file => 
    `import ${file.componentName} from '${file.importPath}';`
  ).join('\n');
  
  // 生成路由数组
  const routes = files.map(file => 
    `  { key: '${file.key}', path: '${file.routePath}', component: ${file.componentName}}`
  ).join(',\n');
  
  const prefixComment = PREFIX ? `\n// 路由前缀: ${PREFIX}` : '';
  
  return `// 此文件由生成器自动创建，请勿手动修改
${prefixComment}
${imports}

export const routes = [
${routes}
];`;
}

/**
 * 主函数
 */
async function main() {
  try {
    // 检查 pages 目录是否存在
    if (!(await fs.pathExists(PAGES_DIR))) {
      echo(chalk.red(`❌ 错误: Pages 目录不存在: ${PAGES_DIR}`));
      process.exit(1);
    }
    
    // 获取所有符合条件的 JSX 文件
    echo(chalk.cyan('🔍 正在扫描 JSX 文件...'));
    const files = await getJsxFiles(PAGES_DIR);
    
    if (files.length === 0) {
      echo(chalk.yellow('⚠️  警告: 未找到任何大写开头的 .jsx 文件'));
      return;
    }
    
    echo(chalk.green(`📁 找到 ${files.length} 个组件文件:`));
    files.forEach(file => {
      echo(chalk.gray(`  - ${file.componentName} -> ${file.routePath}`));
    });
    
    // 生成配置文件内容
    const configContent = generateConfigContent(files);
    
    // 确保配置文件目录存在
    await fs.ensureDir(path.dirname(CONFIG_PATH));
    
    // 写入配置文件
    await fs.writeFile(CONFIG_PATH, configContent, 'utf8');
    
    echo(chalk.green(`✅ 路由配置文件已生成: ${CONFIG_PATH}`));
    
  } catch (error) {
    echo(chalk.red(`❌ 生成路由配置时出错: ${error.message}`));
    process.exit(1);
  }
}

// 运行主函数
main();
