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
        command: this.configManager.getQwenCommand(),
        terminalName: 'Qwen Code',
        enabled: qwenConfigured, // 根据API Key决定
        order: 2,
      },
      {
        id: 'kimi',
        title: 'Kimi Code',
        icon: 'kimi', // 使用自定义SVG图标
        command: this.configManager.getKimiCommand(),
        terminalName: 'Kimi Code',
        enabled: kimiConfigured, // 根据API Key决定
        order: 3,
      },
      {
        id: 'custom',
        title: 'Custom Code',
        icon: '$(terminal)', // 使用codicon图标
        command: this.configManager.getCustomCommand(),
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
      let _baseUrl = '';
      let _apiKey = '';
      let _command = '';
      if (id === 'qwen') {
        _baseUrl = this.configManager.getQwenBaseUrl();
        _apiKey = await this.configManager.getQwenApiKey();
        _command = this.configManager.getQwenCommand();
      } else if (id === 'kimi') {
        _baseUrl = this.configManager.getKimiBaseUrl();
        _apiKey = await this.configManager.getKimiApiKey();
        _command = this.configManager.getKimiCommand();
      } else if (id === 'custom') {
        _baseUrl = this.configManager.getCustomBaseUrl();
        _apiKey = await this.configManager.getCustomApiKey();
        _command = this.configManager.getCustomCommand();
      }
      fullCommand = [...(_apiKey ? [`export ANTHROPIC_BASE_URL=${_baseUrl}`, `export ANTHROPIC_AUTH_TOKEN=${_apiKey}`] : []), _command].join(' && ');
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
        description: '查看配置选项',
        detail: 'Open VS Code Settings',
      },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
    ];

    // 添加所有终端命令的状态显示
    const commands = this.getAllCommands();
    items.push(
      ...commands.map((cmd) => {
        let statusIcon = '$(circle-outline)';
        let detail = '';

        if (cmd.id === 'claude') {
          statusIcon = '$(check)';
          detail = '始终可用';
        } else if (cmd.id === 'qwen') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? '已配置 API Key，点击重新配置'
            : '点击配置 API Key';
        } else if (cmd.id === 'kimi') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? '已配置 API Key，点击重新配置'
            : '点击配置 API Key';
        } else if (cmd.id === 'custom') {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? '已配置 API Key，点击重新配置'
            : '点击配置 API Key';
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
      placeHolder: '选择要配置或查看的终端',
    });

    if (!selection) return;

    if (selection.label.includes('打开设置页面')) {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'ClaudeCodeTerminal'
      );
    } else {
      const item = selection as vscode.QuickPickItem & {
        command: TerminalCommand;
      };
      if (item.command) {
        await this.showTerminalConfiguration(item.command);
      }
    }
  }

  /** 显示终端配置界面 */
  private async showTerminalConfiguration(
    command: TerminalCommand
  ): Promise<void> {
    if (command.id === 'claude') return;
    // 对于其他终端，直接进行 API Key 配置
    if (command.id === 'qwen') {
      await this.configManager.configureQwenApiKey();
    } else if (command.id === 'kimi') {
      await this.configManager.configureKimiApiKey();
    } else if (command.id === 'custom') {
      await this.configManager.configureCustomApiKey();
    }
  }
}
