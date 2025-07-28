import * as vscode from 'vscode';
import { TerminalCommand } from '../types';
import { ConfigManager } from './configManager';

/** 终端管理器 */
export class TerminalManager {
  private static instance: TerminalManager;
  private terminalCommands: Map<string, TerminalCommand> = new Map();
  private readonly maxSlots = 4;
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  /** 初始化，传入 ExtensionContext */
  initialize(context: vscode.ExtensionContext): void {
    this.configManager.initialize(context);
  }

  /** 获取单例实例 */
  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  /** 初始化默认终端命令 */
  async initializeDefaultCommands() {
    console.log('初始化默认终端命令...');

    // 异步获取配置状态
    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isQwenConfigured(),
        this.configManager.isKimiConfigured(),
        this.configManager.isCustomConfigured(),
      ]);

    // 固定的 AI 模型终端配置
    const fixedCommands: TerminalCommand[] = [
      {
        id: 'claude',
        title: 'Claude Code',
        icon: 'claude', // 使用自定义SVG图标
        command: 'claude',
        terminalName: 'Claude Code',
        enabled: true, // Claude 始终显示
        order: 1,
      },
      {
        id: 'qwen',
        title: 'Qwen Code',
        icon: 'qwen', // 使用自定义SVG图标
        command: 'claude',
        terminalName: 'Qwen Code',
        enabled: qwenConfigured, // 根据API Key决定
        order: 2,
      },
      {
        id: 'kimi',
        title: 'Kimi Code',
        icon: 'kimi', // 使用自定义SVG图标
        command: 'claude',
        terminalName: 'Kimi Code',
        enabled: kimiConfigured, // 根据API Key决定
        order: 3,
      },
      {
        id: 'custom',
        title: 'Custom Code',
        icon: '$(terminal)', // 使用codicon图标
        command: 'claude',
        terminalName: 'Custom Code',
        enabled: customConfigured, // 根据API Key决定
        order: 4,
      },
    ];

    // 添加固定命令
    fixedCommands.forEach((cmd) => {
      console.log(
        `添加固定命令: ${cmd.id} - ${cmd.title} (enabled: ${cmd.enabled})`
      );
      this.terminalCommands.set(cmd.id, cmd);
    });

    // 不再需要加载额外的自定义终端

    console.log(`总共添加了 ${this.terminalCommands.size} 个命令`);
    this.updateContexts();

    // 监听配置变化
    this.configManager.onConfigurationChanged(() => {
      this.refreshAITerminals();
    });
  }

  /** 刷新终端的显示状态 */
  private async refreshAITerminals() {
    console.log('配置变化，刷新终端状态...');

    // 异步获取配置状态
    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isQwenConfigured(),
        this.configManager.isKimiConfigured(),
        this.configManager.isCustomConfigured(),
      ]);

    // 更新 Qwen 终端状态
    const qwenTerminal = this.terminalCommands.get('qwen');
    if (qwenTerminal) {
      qwenTerminal.enabled = qwenConfigured;
      console.log(`Qwen终端状态: ${qwenTerminal.enabled}`);
    }

    // 更新 Kimi 终端状态
    const kimiTerminal = this.terminalCommands.get('kimi');
    if (kimiTerminal) {
      kimiTerminal.enabled = kimiConfigured;
      console.log(`Kimi终端状态: ${kimiTerminal.enabled}`);
    }

    // 更新自定义终端状态
    const customTerminal = this.terminalCommands.get('custom');
    if (customTerminal) {
      customTerminal.enabled = customConfigured;
      console.log(`Custom终端状态: ${customTerminal.enabled}`);
    }

    // 更新上下文
    this.updateContexts();
  }

  /** 添加终端命令（仅限 custom） */
  addTerminalCommand(command: TerminalCommand): boolean {
    // 只允许修改 custom 终端
    if (command.id !== 'custom') {
      vscode.window.showWarningMessage('只能自定义 Custom 终端');
      return false;
    }

    this.terminalCommands.set('custom', command);
    this.updateContexts();
    return true;
  }

  /** 移除终端命令（仅限 custom） */
  removeTerminalCommand(id: string): boolean {
    if (['claude', 'qwen', 'kimi'].includes(id)) {
      vscode.window.showWarningMessage('不能删除固定的 AI 终端');
      return false;
    }

    if (id === 'custom' && this.terminalCommands.has(id)) {
      const customTerminal = this.terminalCommands.get(id)!;
      customTerminal.enabled = false;
      this.updateContexts();
      return true;
    }
    return false;
  }

  /** 更新终端命令 */
  updateTerminalCommand(
    id: string,
    command: Partial<TerminalCommand>
  ): boolean {
    // 对于前三个终端，只允许修改 enabled 状态（通过 API Key 配置控制）
    if (['claude', 'qwen', 'kimi'].includes(id)) {
      if (id === 'claude') {
        // Claude 终端始终显示，不允许禁用
        return false;
      }
      // qwen 和 kimi 的状态由 API Key 控制，不允许直接修改
      return false;
    }

    const existing = this.terminalCommands.get(id);
    if (existing) {
      this.terminalCommands.set(id, { ...existing, ...command });
      this.updateContexts();
      return true;
    }
    return false;
  }

  /** 获取终端命令 */
  getTerminalCommand(id: string): TerminalCommand | undefined {
    return this.terminalCommands.get(id);
  }

  /** 获取所有终端命令 */
  getAllCommands(): TerminalCommand[] {
    return Array.from(this.terminalCommands.values()).sort(
      (a, b) => a.order - b.order
    );
  }

  /** 执行终端命令 */
  async executeTerminalCommand(id: string): Promise<void> {
    const command = this.terminalCommands.get(id);
    if (!command || !command.enabled) {
      vscode.window.showErrorMessage(`终端命令 ${id} 未找到或已禁用`);
      return;
    }

    try {
      // 直接在编辑器区域创建终端，不需要先创建文件和分割视图
      const terminal = vscode.window.createTerminal({
        name: command.terminalName || command.title,
        location: vscode.TerminalLocation.Editor,
      });

      terminal.show();

      // 根据终端类型构造带环境变量的命令
      let fullCommand = command.command;
      if (id === 'qwen') {
        const baseUrl = this.configManager.getQwenBaseUrl();
        const apiKey = await this.configManager.getQwenApiKey();
        fullCommand = `export ANTHROPIC_BASE_URL=${baseUrl} && export ANTHROPIC_AUTH_TOKEN=${apiKey} && ${command.command}`;
      } else if (id === 'kimi') {
        const baseUrl = this.configManager.getKimiBaseUrl();
        const apiKey = await this.configManager.getKimiApiKey();
        fullCommand = `export ANTHROPIC_BASE_URL=${baseUrl} && export ANTHROPIC_AUTH_TOKEN=${apiKey} && ${command.command}`;
      } else if (id === 'custom') {
        const baseUrl = this.configManager.getCustomBaseUrl();
        const apiKey = await this.configManager.getCustomApiKey();
        if (baseUrl && apiKey) {
          fullCommand = `export ANTHROPIC_BASE_URL=${baseUrl} && export ANTHROPIC_AUTH_TOKEN=${apiKey} && ${command.command}`;
        }
      }
      // Claude 终端使用默认命令

      terminal.sendText(fullCommand);

      console.log(`执行终端命令: ${command.title} - ${fullCommand}`);
    } catch (error) {
      console.error(`执行终端命令失败: ${command.title}`, error);
      vscode.window.showErrorMessage(`执行终端命令失败: ${command.title}`);
    }
  }

  /** 更新VS Code上下文 */
  private updateContexts() {
    console.log('更新上下文...');
    const terminalIds = ['claude', 'qwen', 'kimi', 'custom'];

    terminalIds.forEach((terminalId) => {
      const command = this.terminalCommands.get(terminalId);
      const isVisible = command?.enabled || false;

      console.log(
        `设置上下文: claudeExtension.${terminalId}.visible = ${isVisible}`
      );
      vscode.commands.executeCommand(
        'setContext',
        `claudeExtension.${terminalId}.visible`,
        isVisible
      );
    });
  }

  /** 显示配置界面 */
  async showConfiguration(): Promise<void> {
    const items: vscode.QuickPickItem[] = [
      {
        label: '$(gear) 打开设置页面',
        description: '查看配置选项（API Key 为只读）',
        detail: 'Open VS Code Settings (API Keys are read-only)',
      },
      {
        label: '$(key) 快速配置 API Key',
        description: '快速设置 Qwen、Kimi 和 Custom 的 API Key',
        detail: 'Quick API Key Setup',
      },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      {
        label: '$(info) 终端状态',
        description: '查看所有终端的当前状态',
        detail: 'View Terminal Status',
      },
    ];

    // 添加所有终端命令的状态显示
    const commands = this.getAllCommands();
    items.push(
      ...commands.map((cmd) => {
        let statusIcon = '$(circle-outline)';
        let detail = '';

        if (cmd.id === 'claude') {
          statusIcon = '$(check)';
          detail = 'Claude 终端 - 始终可用';
        } else if (cmd.id === 'qwen') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? 'Qwen 终端 - 已配置 API Key'
            : 'Qwen 终端 - 需要配置 API Key';
        } else if (cmd.id === 'kimi') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? 'Kimi 终端 - 已配置 API Key'
            : 'Kimi 终端 - 需要配置 API Key';
        } else if (cmd.id === 'custom') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? 'Custom 终端 - 已配置 API Key'
            : 'Custom 终端 - 需要配置 API Key';
        }

        return {
          label: `${statusIcon} ${cmd.title}`,
          description: cmd.command,
          detail,
          command: cmd,
        } as vscode.QuickPickItem & { command: TerminalCommand };
      })
    );

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: '选择配置选项',
    });

    if (!selection) return;

    if (selection.label.includes('打开设置页面')) {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'ClaudeCodeTerminal'
      );
    } else if (selection.label.includes('快速配置 API Key')) {
      await this.configManager.showApiKeyConfiguration();
    } else if (selection.label.includes('终端状态')) {
      await this.showTerminalStatus();
    } else {
      const item = selection as vscode.QuickPickItem & {
        command: TerminalCommand;
      };
      if (item.command) {
        await this.showTerminalInfo(item.command);
      }
    }
  }

  /** 显示终端状态概览 */
  private async showTerminalStatus(): Promise<void> {
    const commands = this.getAllCommands();
    let statusInfo = '**终端状态概览**\n\n';

    commands.forEach((cmd) => {
      const status = cmd.enabled ? '✅ 启用' : '❌ 禁用';
      statusInfo += `• **${cmd.title}**: ${status}\n`;
      statusInfo += `  - 命令: \`${cmd.command}\`\n`;

      if (cmd.id === 'qwen' && !cmd.enabled) {
        statusInfo += `  - 需要配置 Qwen API Key\n`;
      } else if (cmd.id === 'kimi' && !cmd.enabled) {
        statusInfo += `  - 需要配置 Kimi API Key\n`;
      } else if (cmd.id === 'custom' && !cmd.enabled) {
        statusInfo += `  - 需要配置 Custom API Key\n`;
      }
      statusInfo += '\n';
    });

    statusInfo += '\n💡 **提示**: 点击"打开设置页面"可以配置所有选项';

    await vscode.window.showInformationMessage(statusInfo, { modal: true });
  }

  /** 显示终端信息 */
  private async showTerminalInfo(command: TerminalCommand): Promise<void> {
    let info = `**${command.title}**\n\n`;
    info += `• 命令: \`${command.command}\`\n`;
    info += `• 状态: ${command.enabled ? '✅ 启用' : '❌ 禁用'}\n`;

    if (command.id === 'claude') {
      info += `• 说明: Claude 终端始终可用，无需额外配置\n`;
    } else if (command.id === 'qwen') {
      const qwenConfigured = await this.configManager.isQwenConfigured();
      info += `• 说明: Qwen 终端需要配置 API Key 才能显示\n`;
      info += `• API Key: ${qwenConfigured ? '✅ 已配置' : '❌ 未配置'}\n`;
      if (!qwenConfigured) {
        info += `\n💡 点击"快速配置 API Key"设置 Qwen API Key`;
      }
    } else if (command.id === 'kimi') {
      const kimiConfigured = await this.configManager.isKimiConfigured();
      info += `• 说明: Kimi 终端需要配置 API Key 才能显示\n`;
      info += `• API Key: ${kimiConfigured ? '✅ 已配置' : '❌ 未配置'}\n`;
      if (!kimiConfigured) {
        info += `\n💡 点击"快速配置 API Key"设置 Kimi API Key`;
      }
    } else if (command.id === 'custom') {
      const customConfigured = await this.configManager.isCustomConfigured();
      info += `• 说明: Custom 终端需要配置 API Key 才能显示\n`;
      info += `• API Key: ${customConfigured ? '✅ 已配置' : '❌ 未配置'}\n`;
      if (!customConfigured) {
        info += `\n💡 点击"快速配置 API Key"设置 Custom API Key`;
      }
    }

    await vscode.window.showInformationMessage(info, { modal: true });
  }
}
