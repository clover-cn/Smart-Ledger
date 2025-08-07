import prompts from 'prompts';
import { spawn } from 'child_process';
import { resolve } from 'path';

interface ProjectConfig {
  name: string;
  displayName: string;
  path: string;
  commands: {
    [key: string]: string;
  };
}

const projects: ProjectConfig[] = [
  {
    name: 'jizhang-jingling-mp',
    displayName: '📱 记账精灵小程序',
    path: 'jizhang-jingling-mp',
    commands: {
      'H5构建': 'build:h5',
      '微信小程序': 'build:mp-weixin',
      '支付宝小程序': 'build:mp-alipay',
      '百度小程序': 'build:mp-baidu',
      'QQ小程序': 'build:mp-qq',
      '头条小程序': 'build:mp-toutiao',
      '全部构建': 'build'
    }
  },
  {
    name: 'smart-accounting-mcp',
    displayName: '🤖 智能记账 MCP 服务器',
    path: 'smart-accounting-mcp',
    commands: {
      '构建': 'build'
    }
  }
];

async function main() {
  console.log('🔨 智能记账系统构建工具');
  console.log('');

  try {
    // 选择项目
    const projectResponse = await prompts({
      type: 'select',
      name: 'project',
      message: '选择要构建的项目:',
      choices: projects.map(project => ({
        title: project.displayName,
        value: project.name
      }))
    });

    if (!projectResponse.project) {
      console.log('❌ 已取消操作');
      process.exit(0);
    }

    const selectedProject = projects.find(p => p.name === projectResponse.project);
    if (!selectedProject) {
      console.log('❌ 项目未找到');
      process.exit(1);
    }

    // 选择命令
    const commandResponse = await prompts({
      type: 'select',
      name: 'command',
      message: `选择 ${selectedProject.displayName} 的构建类型:`,
      choices: Object.entries(selectedProject.commands).map(([key, value]) => ({
        title: key,
        value: value
      }))
    });

    if (!commandResponse.command) {
      console.log('❌ 已取消操作');
      process.exit(0);
    }

    // 构建项目
    console.log(`🔨 正在构建 ${selectedProject.displayName} - ${Object.keys(selectedProject.commands).find(k => selectedProject.commands[k] === commandResponse.command)}`);
    console.log('');

    const projectPath = resolve(process.cwd(), selectedProject.path);
    const child = spawn('pnpm', ['run', commandResponse.command], {
      cwd: projectPath,
      stdio: 'inherit',
      shell: true
    });

    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ 构建完成');
      } else {
        console.log(`❌ 构建失败，退出码: ${code}`);
        process.exit(code);
      }
    });

  } catch (error) {
    if (error.message === 'User force closed the prompt with 0 null') {
      console.log('\n❌ 已取消操作');
      process.exit(0);
    }
    console.error('❌ 构建失败:', error);
    process.exit(1);
  }
}

main();