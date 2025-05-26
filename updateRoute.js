// generate-routes-recursive.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// 获取当前文件的目录
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 默认配置
const DEFAULT_CONFIG = {
  pagesDir: path.resolve(__dirname, './src/pages'),
  configPath: path.resolve(__dirname, './src/routes/config.js'),
  homeAsRoot: true,
  routePrefix: ''
};

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { ...DEFAULT_CONFIG };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--root') {
      options.homeAsRoot = false;
    } else if (arg === '--prefix' && i + 1 < args.length) {
      options.routePrefix = args[++i];
      // 确保前缀以斜杠开头且不以斜杠结尾
      if (!options.routePrefix.startsWith('/')) {
        options.routePrefix = '/' + options.routePrefix;
      }
      if (options.routePrefix.endsWith('/')) {
        options.routePrefix = options.routePrefix.slice(0, -1);
      }
    } else if (arg === '--pages-dir' && i + 1 < args.length) {
      options.pagesDir = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--output' && i + 1 < args.length) {
      options.configPath = path.resolve(process.cwd(), args[++i]);
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

// 打印帮助信息
function printHelp() {
  console.log(`
路由生成器 - 根据页面文件生成路由配置

用法:
  node updateRoute.js [选项]

选项:
  --root                 不将Home页面转换为根路径
  --prefix <前缀>        为所有路由添加前缀
  --pages-dir <目录>     指定页面目录路径 (默认: ./src/pages)
  --output <文件路径>    指定输出配置文件路径 (默认: ./src/routes/config.js)
  --help                显示此帮助信息
  `);
}

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 读取文件中的第一行注释
function getFirstComment(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    // 查找第一个非空行
    for (const line of lines) {
      const trimmedLine = line.trim();
      // 检查是否是单行注释或多行注释的开始
      if (trimmedLine.startsWith('//')) {
        // 提取单行注释内容
        return trimmedLine.substring(2).trim();
      } else if (trimmedLine.startsWith('/*')) {
        // 提取多行注释第一行内容
        const commentContent = trimmedLine.substring(2).trim();
        // 如果多行注释在同一行结束，去掉结束标记
        if (commentContent.endsWith('*/')) {
          return commentContent.substring(0, commentContent.length - 2).trim();
        }
        return commentContent;
      }
      
      // 如果遇到非空行且不是注释，则返回空字符串
      if (trimmedLine && !trimmedLine.startsWith('import') && !trimmedLine.startsWith('export')) {
        break;
      }
    }
    
    return '';
  } catch (error) {
    console.error(`读取文件 ${filePath} 时出错:`, error);
    return '';
  }
}

// 递归获取所有页面文件
function getPageFilesRecursively(dir, baseDir = '', routes = [], options) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 递归处理子目录
      getPageFilesRecursively(fullPath, path.join(baseDir, file), routes, options);
    } else if (
      (file.endsWith('.jsx')) && // 只处理JSX文件
      /^[A-Z]/.test(file) // 只处理大写字母开头的文件
    ) {
      const fileInfo = path.parse(file);
      const name = fileInfo.name;
      
      // 构建导入路径，保持相对结构
      const importPathDir = baseDir ? `${baseDir}/` : '';
      const importPath = `@/pages/${importPathDir}${name}`;
      
      // 构建路由路径
      let routePath;
      
      if (name === 'Home' && options.homeAsRoot) {
        // 如果是Home文件且开启了homeAsRoot选项，路由路径为目录路径
        routePath = baseDir ? `/${baseDir.toLowerCase()}` : '/';
      } else {
        // 否则路由路径为目录路径 + 文件名（小写）
        routePath = baseDir 
          ? `/${baseDir.toLowerCase()}/${name.toLowerCase()}` 
          : `/${name.toLowerCase()}`;
      }
      
      // 添加路由前缀
      if (options.routePrefix) {
        // 特殊处理根路径
        if (routePath === '/') {
          routePath = options.routePrefix;
        } else {
          routePath = options.routePrefix + routePath;
        }
      }
      
      // 生成键值
      const key = baseDir 
        ? `${baseDir.toLowerCase()}_${name.toLowerCase()}` 
        : name.toLowerCase();
      
      // 获取注释作为描述
      const description = getFirstComment(fullPath);
      
      routes.push({
        key,
        name,
        path: routePath,
        importPath,
        fullPath: importPathDir + name,
        description
      });
    }
  }
  
  return routes;
}

// 生成配置文件
function generateConfig(options) {
  // 确保目标目录存在
  const configDir = path.dirname(options.configPath);
  ensureDirectoryExists(configDir);
  
  // 递归获取所有页面文件
  const routes = getPageFilesRecursively(options.pagesDir, '', [], options);
  
  if (routes.length === 0) {
    console.log('没有找到符合条件的页面文件（大写字母开头的.jsx文件）');
    return;
  }
  
  // 生成导入语句
  const imports = routes.map(route => 
    `import ${route.name} from '${route.importPath}';`
  ).join('\n');
  
  // 生成路由数组
  const routesArray = routes.map(route => 
    `  { key: '${route.key}', path: '${route.path}', component: ${route.name}, description: '${route.description || ''}' }`
  ).join(',\n');
  
  // 生成最终的配置文件内容
  const configContent = `// 此文件由生成器自动创建，请勿手动修改
// 生成时间: ${new Date().toLocaleString()}
// 生成参数: ${JSON.stringify({
  homeAsRoot: options.homeAsRoot,
  routePrefix: options.routePrefix || '(无)'
})}
${imports}

export const routes = [
${routesArray}
];
`;
  
  // 写入配置文件
  fs.writeFileSync(options.configPath, configContent);
  console.log(`配置文件已生成: ${options.configPath}`);
  console.log(`共处理了 ${routes.length} 个组件文件`);
  console.log(`配置参数: Home页面作为根路径: ${options.homeAsRoot ? '是' : '否'}, 路由前缀: ${options.routePrefix || '(无)'}`);
}

// 主函数
function main() {
  const options = parseArgs();
  generateConfig(options);
}

// 执行主函数
main();