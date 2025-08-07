const { spawn } = require('child_process');
const { resolve } = require('path');
const { existsSync } = require('fs');
const readline = require('readline');

const projects = [
  {
    name: 'jizhang-jingling-mp',
    displayName: '📱 记账精灵小程序',
    path: 'jizhang-jingling-mp',
    packageManager: 'pnpm', // 使用 pnpm
    commands: {
      'H5开发': 'dev:h5',
      '微信小程序': 'dev:mp-weixin',
      '支付宝小程序': 'dev:mp-alipay',
      '百度小程序': 'dev:mp-baidu',
      'QQ小程序': 'dev:mp-qq',
      '头条小程序': 'dev:mp-toutiao'
    }
  },
  {
    name: 'smart-accounting-mcp',
    displayName: '🤖 智能记账 MCP 服务器',
    path: 'smart-accounting-mcp',
    packageManager: 'auto', // 自动检测包管理器
    commands: {
      '开发模式': 'dev',
      '构建': 'build',
      '启动': 'start'
    }
  }
];

// 检测项目使用的包管理器
function detectPackageManager(projectPath) {
  const fullPath = resolve(process.cwd(), projectPath);
  
  if (existsSync(resolve(fullPath, 'package-lock.json'))) {
    return 'npm';
  }
  if (existsSync(resolve(fullPath, 'yarn.lock'))) {
    return 'yarn';
  }
  if (existsSync(resolve(fullPath, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  
  // 默认使用 npm
  return 'npm';
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function selectProject() {
  console.log('🎉 欢迎使用智能记账系统开发环境');
  console.log('');
  console.log('选择要启动的项目:');
  
  projects.forEach((project, index) => {
    console.log(`${index + 1}. ${project.displayName}`);
  });
  console.log('0. 退出');
  console.log('');

  const answer = await question('请输入序号 (0-' + projects.length + '): ');
  const choice = parseInt(answer);
  
  if (choice === 0) {
    console.log('❌ 已取消操作');
    rl.close();
    return null;
  }
  
  if (choice < 1 || choice > projects.length) {
    console.log('❌ 无效选择');
    rl.close();
    return null;
  }
  
  return projects[choice - 1];
}

async function selectCommand(project) {
  console.log('');
  console.log(`选择 ${project.displayName} 的运行模式:`);
  
  const commandEntries = Object.entries(project.commands);
  commandEntries.forEach(([key, value], index) => {
    console.log(`${index + 1}. ${key}`);
  });
  console.log('0. 返回');
  console.log('');

  const answer = await question('请输入序号 (0-' + commandEntries.length + '): ');
  const choice = parseInt(answer);
  
  if (choice === 0) {
    return null;
  }
  
  if (choice < 1 || choice > commandEntries.length) {
    console.log('❌ 无效选择');
    return null;
  }
  
  return commandEntries[choice - 1];
}

async function runProject(project, commandEntry) {
  const [displayName, command] = commandEntry;
  console.log('');
  console.log(`🚀 正在启动 ${project.displayName} - ${displayName}`);
  
  // 确定使用的包管理器
  let packageManager = project.packageManager;
  if (packageManager === 'auto') {
    packageManager = detectPackageManager(project.path);
    console.log(`📦 检测到项目使用 ${packageManager} 作为包管理器`);
  }
  console.log('');

  const projectPath = resolve(process.cwd(), project.path);
  const child = spawn(packageManager, ['run', command], {
    cwd: projectPath,
    stdio: 'inherit',
    shell: true
  });

  // 处理 Ctrl+C
  process.on('SIGINT', () => {
    console.log('\n⏹️  正在停止服务...');
    child.kill('SIGINT');
    rl.close();
    process.exit(0);
  });

  child.on('close', (code) => {
    if (code !== 0) {
      console.log(`❌ 进程退出，退出码: ${code}`);
    }
    rl.close();
  });
}

async function main() {
  try {
    const selectedProject = await selectProject();
    if (!selectedProject) return;

    const selectedCommand = await selectCommand(selectedProject);
    if (!selectedCommand) {
      rl.close();
      return;
    }

    await runProject(selectedProject, selectedCommand);
  } catch (error) {
    console.error('❌ 启动失败:', error);
    rl.close();
    process.exit(1);
  }
}

main();