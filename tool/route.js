#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 全局配置
const PREFIX = '';  // 路由前缀可配置为空或 '/app' 等
const PAGES_DIR = path.join(process.cwd(), 'src/pages');
const CONFIG_PATH = path.join(process.cwd(), 'src/routes/config.js');

console.log('\x1b[34m%s\x1b[0m', '路由前缀:', PREFIX || '(无)');
console.log('\x1b[34m%s\x1b[0m', 'Pages 目录:', PAGES_DIR);
console.log('\x1b[34m%s\x1b[0m', '配置文件路径:', CONFIG_PATH);

/**
 * 获取页面组件文件
 * - 规则：
 *   - 页面为大写开头的 .jsx 文件，或 index.jsx 位于大写开头目录中
 *   - 忽略页面子组件（小写 + 短横线）
 *   - Home 目录或 Home.jsx 对应根路径
 */
async function getRouteComponents(dir, basePath = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.join(basePath, entry.name);

    if (entry.isDirectory() && /^[A-Z]/.test(entry.name)) {
      // 大写开头的目录：查找 index.jsx 或递归继续找子页面
      const indexPath = path.join(fullPath, 'index.jsx');
      try {
        await fs.access(indexPath);
        const isHome = entry.name === 'Home' && basePath === '';
        const routePath = isHome ? (PREFIX || '/') : PREFIX + '/' + entry.name.toLowerCase();
        files.push({
          componentName: entry.name,
          importPath: `@/pages/${relativePath.replace(/\\/g, '/')}/index`,
          routePath,
          key: isHome ? 'home' : relativePath.replace(/\\/g, '/').toLowerCase().replace(/\//g, '_')
        });
      } catch {
        // 没有 index.jsx，递归查找子页面
        const subFiles = await getRouteComponents(fullPath, relativePath);
        files.push(...subFiles);
      }
    } else if (entry.isFile() && entry.name.endsWith('.jsx') && /^[A-Z]/.test(entry.name)) {
      // 单文件页面
      const componentName = path.basename(entry.name, '.jsx');
      const importPath = `@/pages/${relativePath.replace(/\\/g, '/').replace('.jsx', '')}`;
      const isHome = componentName === 'Home' && basePath === '';
      const routePath = isHome ? (PREFIX || '/') : PREFIX + '/' + componentName.toLowerCase();
      files.push({
        componentName,
        importPath,
        routePath,
        key: isHome ? 'home' : componentName.toLowerCase()
      });
    }
  }

  return files;
}

/**
 * 生成路由配置文件内容
 */
function generateConfigContent(files) {
  const imports = files.map(f => `import ${f.componentName} from '${f.importPath}';`).join('\n');
  const routes = files.map(f => `  { key: '${f.key}', path: '${f.routePath}', component: ${f.componentName} }`).join(',\n');
  const prefixComment = PREFIX ? `// 路由前缀: ${PREFIX}\n` : '';

  return `// 此文件由自动生成，请勿手动修改
${prefixComment}${imports}

export const routes = [
${routes}
];`;
}

/**
 * 主执行函数
 */
async function main() {
  try {
    await fs.access(PAGES_DIR);
  } catch {
    console.error('\x1b[31m%s\x1b[0m', `❌ Pages 目录不存在: ${PAGES_DIR}`);
    process.exit(1);
  }

  console.log('\x1b[36m%s\x1b[0m', '🔍 正在扫描页面组件...');
  const files = await getRouteComponents(PAGES_DIR);

  if (!files.length) {
    console.log('\x1b[33m%s\x1b[0m', '⚠️ 未找到任何页面组件');
    return;
  }

  console.log('\x1b[32m%s\x1b[0m', `📁 发现 ${files.length} 个页面组件:`);
  files.forEach(f => console.log('\x1b[90m%s\x1b[0m', `  - ${f.componentName} -> ${f.routePath}`));

  const content = generateConfigContent(files);
  await fs.mkdir(path.dirname(CONFIG_PATH), { recursive: true });
  await fs.writeFile(CONFIG_PATH, content, 'utf8');

  console.log('\x1b[32m%s\x1b[0m', `✅ 路由配置文件已生成: ${CONFIG_PATH}`);
}

main().catch(error => {
  console.error('\x1b[31m%s\x1b[0m', '生成失败:', error.message);
  process.exit(1);
});