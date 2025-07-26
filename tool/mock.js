#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import yaml from 'js-yaml';

const OPENAPI_DIR = 'openapi';
const TEMP_DIR = '.temp';
const DEFAULT_PORT = 4010;

/**
 * 合并多个 OpenAPI 文件
 */
async function mergeOpenAPIFiles() {
  const files = await fs.readdir(OPENAPI_DIR);
  const yamlFiles = files.filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
  
  if (!yamlFiles.length) {
    throw new Error('未找到 OpenAPI 文件');
  }

  console.log(`发现 ${yamlFiles.length} 个 OpenAPI 文件`);

  // 基础合并配置
  const merged = {
    openapi: '3.1.0',
    info: {
      title: 'Mock API Server',
      version: '1.0.0'
    },
    servers: [{ url: `http://localhost:${DEFAULT_PORT}` }],
    paths: {},
    components: { schemas: {} }
  };

  // 逐个合并文件
  for (const file of yamlFiles) {
    const content = await fs.readFile(path.join(OPENAPI_DIR, file), 'utf8');
    const spec = yaml.load(content);
    
    const prefix = spec.info?.['x-prefix'] || '/';
    console.log(`合并 ${file} (前缀: ${prefix})`);

    // 合并路径（添加前缀）
    if (spec.paths) {
      for (const [pathKey, pathValue] of Object.entries(spec.paths)) {
        const fullPath = prefix === '/' ? pathKey : `${prefix}${pathKey}`;
        merged.paths[fullPath] = pathValue;
      }
    }

    // 合并 schemas
    if (spec.components?.schemas) {
      Object.assign(merged.components.schemas, spec.components.schemas);
    }
  }

  // 创建临时目录和文件
  await fs.mkdir(TEMP_DIR, { recursive: true });
  const mergedFile = path.join(TEMP_DIR, 'merged-api.yaml');
  await fs.writeFile(mergedFile, yaml.dump(merged), 'utf8');
  
  console.log(`合并完成: ${Object.keys(merged.paths).length} 个路径`);
  return mergedFile;
}

/**
 * 启动 Prism Mock 服务器
 */
function startPrismServer(specFile, port = DEFAULT_PORT) {
  return new Promise((resolve, reject) => {
    console.log(`启动 Mock 服务器: http://localhost:${port}`);
    
    // 尝试不同的启动方式
    const isWindows = process.platform === 'win32';
    const command = isWindows ? 'npx.cmd' : 'npx';
    
    const prism = spawn(command, [
      '@stoplight/prism-cli', 'mock',
      specFile,
      '--port', port.toString(),
      '--dynamic'
    ], {
      stdio: 'inherit',
      shell: true
    });

    prism.on('error', (error) => {
      console.error('启动 Prism 失败，请确保已安装 @stoplight/prism-cli:');
      console.error('npm install -g @stoplight/prism-cli');
      console.error('或者: pnpm add -D @stoplight/prism-cli');
      reject(error);
    });
    
    prism.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Prism 退出码: ${code}`));
      }
    });

    // 简单延迟后认为启动成功
    setTimeout(() => resolve(prism), 2000);
  });
}

/**
 * 清理临时文件
 */
async function cleanup() {
  try {
    await fs.rm(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {
    // 忽略清理错误
  }
}

/**
 * 主函数
 */
async function main() {
  const port = process.argv[2] || DEFAULT_PORT;
  
  try {
    // 合并 OpenAPI 文件
    const mergedFile = await mergeOpenAPIFiles();
    
    // 启动服务器
    const server = await startPrismServer(mergedFile, port);
    
    // 处理退出信号
    process.on('SIGINT', async () => {
      console.log('\n停止 Mock 服务器...');
      server.kill();
      await cleanup();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('启动失败:', error.message);
    await cleanup();
    process.exit(1);
  }
}

main();