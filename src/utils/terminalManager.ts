import * as vscode from 'vscode';
import { TerminalCommand } from '../types';
import { ConfigManager, ServiceType } from './configManager';
import { i18n } from './i18n';

/** 终端管理器 */
export class TerminalManager {
  private static instance: TerminalManager;
  private terminalCommands: Map<string, TerminalCommand> = new Map();
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
    console.log(i18n.t('terminal.initializingCommands'));

    // 异步获取配置状态
    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isServiceConfigured('qwen'),
        this.configManager.isServiceConfigured('kimi'),
        this.configManager.isServiceConfigured('custom'),
      ]);

    // 固定的 AI 模型终端配置
    const fixedCommands: TerminalCommand[] = [
      {
        id: 'claude',
        title: 'Claude Code',
        enabled: true, // Claude 始终显示
        order: 1,
      },
      {
        id: 'qwen',
        title: 'Qwen Code',
        enabled: qwenConfigured, // 根据API Key决定
        order: 2,
      },
      {
        id: 'kimi',
        title: 'Kimi Code',
        enabled: kimiConfigured, // 根据API Key决定
        order: 3,
      },
      {
        id: 'custom',
        title: 'Custom Code',
        enabled: customConfigured, // 根据API Key决定
        order: 4,
      },
    ];

    // 添加固定命令
    fixedCommands.forEach((cmd) => {
      console.log(
        `${i18n.t('terminal.addingFixedCommand')}: ${cmd.id} - ${
          cmd.title
        } (enabled: ${cmd.enabled})`
      );
      this.terminalCommands.set(cmd.id, cmd);
    });

    // 不再需要加载额外的自定义终端

    console.log(
      `${i18n.t('terminal.totalCommandsAdded')} ${
        this.terminalCommands.size
      } 个命令`
    );
    this.updateContexts();

    // 监听配置变化
    this.configManager.onConfigurationChanged(() => {
      this.refreshAITerminals();
    });
  }

  /** 刷新终端的显示状态 */
  private async refreshAITerminals() {
    console.log(i18n.t('terminal.configChanged'));

    // 异步获取配置状态
    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isServiceConfigured('qwen'),
        this.configManager.isServiceConfigured('kimi'),
        this.configManager.isServiceConfigured('custom'),
      ]);

    // 更新 Qwen 终端状态
    const qwenTerminal = this.terminalCommands.get('qwen');
    if (qwenTerminal) {
      qwenTerminal.enabled = qwenConfigured;
      console.log(
        `Qwen${i18n.t('terminal.terminalStatus')}: ${qwenTerminal.enabled}`
      );
    }

    // 更新 Kimi 终端状态
    const kimiTerminal = this.terminalCommands.get('kimi');
    if (kimiTerminal) {
      kimiTerminal.enabled = kimiConfigured;
      console.log(
        `Kimi${i18n.t('terminal.terminalStatus')}: ${kimiTerminal.enabled}`
      );
    }

    // 更新自定义终端状态
    const customTerminal = this.terminalCommands.get('custom');
    if (customTerminal) {
      customTerminal.enabled = customConfigured;
      console.log(
        `Custom${i18n.t('terminal.terminalStatus')}: ${customTerminal.enabled}`
      );
    }

    // 更新上下文
    this.updateContexts();
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
      vscode.window.showErrorMessage(
        `${i18n.t('terminal.commandNotFound')} ${id}`
      );
      return;
    }

    try {
      // 直接在编辑器区域创建终端，不需要先创建文件和分割视图
      const terminal = vscode.window.createTerminal({
        name: command.title,
        location: { viewColumn: vscode.ViewColumn.Beside },
      });

      terminal.show();

      // 根据终端类型构造带环境变量的命令
      let fullCommand = 'claude';
      const serviceType = id as ServiceType;
      if (['qwen', 'kimi', 'custom'].includes(serviceType)) {
        const _baseUrl = this.configManager.getBaseUrl(serviceType);
        const _apiKey = await this.configManager.getApiKey(serviceType);
        const _command = this.configManager.getCommand(serviceType);

        fullCommand = [
          _apiKey && `export ANTHROPIC_BASE_URL=${_baseUrl}`,
          _apiKey && `export ANTHROPIC_AUTH_TOKEN=${_apiKey}`,
          _command || fullCommand,
        ]
          .filter(Boolean)
          .join(' && ');
      }

      terminal.sendText(fullCommand);
      console.log(
        `${i18n.t('terminal.executingCommand')}: ${
          command.title
        } - ${fullCommand}`
      );
    } catch (error) {
      console.error(
        `${i18n.t('terminal.executionFailed')}: ${command.title}`,
        error
      );
      vscode.window.showErrorMessage(
        `${i18n.t('terminal.executionFailed')}: ${command.title}`
      );
    }
  }

  /** 更新VS Code上下文 */
  private updateContexts() {
    console.log(i18n.t('terminal.updatingContexts'));
    const terminalIds = ['claude', 'qwen', 'kimi', 'custom'];

    terminalIds.forEach((terminalId) => {
      const command = this.terminalCommands.get(terminalId);
      const isVisible = command?.enabled || false;

      console.log(
        `${i18n.t(
          'terminal.settingContext'
        )}: claudeExtension.${terminalId}.visible = ${isVisible}`
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
        label: i18n.t('terminal.openSettings'),
        description: i18n.t('terminal.viewConfigOptions'),
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
          detail = i18n.t('common.alwaysAvailable');
        } else {
          statusIcon = cmd.enabled ? '$(check)' : '$(key)';
          detail = cmd.enabled
            ? i18n.t('common.configured')
            : i18n.t('common.notConfigured');
        }

        return {
          label: `${statusIcon} ${cmd.title}`,
          description: '',
          detail,
          command: cmd,
        } as vscode.QuickPickItem & { command: TerminalCommand };
      })
    );

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: i18n.t('terminal.selectTerminalToConfigure'),
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
    await this.configManager.configureApiKey(command.id as ServiceType);
  }
}
