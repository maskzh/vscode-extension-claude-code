import { join } from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './config-manager';
import { SERVICE_TYPES } from './constants';
import { ServiceType, TerminalCommand } from './types';
import { i18n } from './utils/i18n';

export class TerminalManager {
  private static instance: TerminalManager;
  private terminalCommands: Map<string, TerminalCommand> = new Map();
  private configManager: ConfigManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  initialize(context: vscode.ExtensionContext): void {
    this.configManager.initialize(context);
  }

  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  async initializeDefaultCommands() {
    console.log(i18n.t('terminal.initializingCommands'));

    const [
      qwenConfigured,
      kimiConfigured,
      deepseekConfigured,
      zhipuConfigured,
      minimaxConfigured,
      copilotConfigured,
      customConfigured,
    ] = await Promise.all([
      this.configManager.isServiceConfigured('qwen'),
      this.configManager.isServiceConfigured('kimi'),
      this.configManager.isServiceConfigured('deepseek'),
      this.configManager.isServiceConfigured('zhipu'),
      this.configManager.isServiceConfigured('minimax'),
      this.configManager.isServiceConfigured('copilot'),
      this.configManager.isServiceConfigured('custom'),
    ]);

    const fixedCommands: TerminalCommand[] = [
      {
        id: 'qwen',
        title: 'Qwen Code',
        enabled: qwenConfigured,
        order: 1,
      },
      {
        id: 'kimi',
        title: 'Kimi Code',
        enabled: kimiConfigured,
        order: 2,
      },
      {
        id: 'deepseek',
        title: 'DeepSeek Code',
        enabled: deepseekConfigured,
        order: 3,
      },
      {
        id: 'zhipu',
        title: 'Zhipu Code',
        enabled: zhipuConfigured,
        order: 4,
      },
      {
        id: 'minimax',
        title: 'Minimax Code',
        enabled: minimaxConfigured,
        order: 5,
      },
      {
        id: 'copilot',
        title: 'GitHub Copilot Code',
        enabled: copilotConfigured,
        order: 6,
      },
      {
        id: 'custom',
        title: 'Custom Code',
        enabled: customConfigured,
        order: 7,
      },
    ];

    fixedCommands.forEach((cmd) => {
      console.log(
        `${i18n.t('terminal.addingFixedCommand')}: ${cmd.id} - ${
          cmd.title
        } (enabled: ${cmd.enabled})`
      );
      this.terminalCommands.set(cmd.id, cmd);
    });

    console.log(
      `${i18n.t('terminal.totalCommandsAdded')} ${
        this.terminalCommands.size
      } 个命令`
    );
    this.updateContexts();

    this.configManager.onConfigurationChanged(() => {
      this.refreshAITerminals();
    });
  }

  private async refreshAITerminals() {
    console.log(i18n.t('terminal.configChanged'));

    const [
      qwenConfigured,
      kimiConfigured,
      deepseekConfigured,
      zhipuConfigured,
      minimaxConfigured,
      copilotConfigured,
      customConfigured,
    ] = await Promise.all([
      this.configManager.isServiceConfigured('qwen'),
      this.configManager.isServiceConfigured('kimi'),
      this.configManager.isServiceConfigured('deepseek'),
      this.configManager.isServiceConfigured('zhipu'),
      this.configManager.isServiceConfigured('minimax'),
      this.configManager.isServiceConfigured('copilot'),
      this.configManager.isServiceConfigured('custom'),
    ]);

    const qwenTerminal = this.terminalCommands.get('qwen');
    if (qwenTerminal) {
      qwenTerminal.enabled = qwenConfigured;
      console.log(
        `Qwen${i18n.t('terminal.terminalStatus')}: ${qwenTerminal.enabled}`
      );
    }

    const kimiTerminal = this.terminalCommands.get('kimi');
    if (kimiTerminal) {
      kimiTerminal.enabled = kimiConfigured;
      console.log(
        `Kimi${i18n.t('terminal.terminalStatus')}: ${kimiTerminal.enabled}`
      );
    }

    const deepseekTerminal = this.terminalCommands.get('deepseek');
    if (deepseekTerminal) {
      deepseekTerminal.enabled = deepseekConfigured;
      console.log(
        `DeepSeek${i18n.t('terminal.terminalStatus')}: ${
          deepseekTerminal.enabled
        }`
      );
    }

    const zhipuTerminal = this.terminalCommands.get('zhipu');
    if (zhipuTerminal) {
      zhipuTerminal.enabled = zhipuConfigured;
      console.log(
        `Zhipu${i18n.t('terminal.terminalStatus')}: ${zhipuTerminal.enabled}`
      );
    }

    const minimaxTerminal = this.terminalCommands.get('minimax');
    if (minimaxTerminal) {
      minimaxTerminal.enabled = minimaxConfigured;
      console.log(
        `Minimax${i18n.t('terminal.terminalStatus')}: ${
          minimaxTerminal.enabled
        }`
      );
    }

    const copilotTerminal = this.terminalCommands.get('copilot');
    if (copilotTerminal) {
      copilotTerminal.enabled = copilotConfigured;
      console.log(
        `Copilot${i18n.t('terminal.terminalStatus')}: ${
          copilotTerminal.enabled
        }`
      );
    }

    const customTerminal = this.terminalCommands.get('custom');
    if (customTerminal) {
      customTerminal.enabled = customConfigured;
      console.log(
        `Custom${i18n.t('terminal.terminalStatus')}: ${customTerminal.enabled}`
      );
    }

    this.updateContexts();
  }

  getAllCommands(): TerminalCommand[] {
    return Array.from(this.terminalCommands.values()).sort(
      (a, b) => a.order - b.order
    );
  }

  async executeTerminalCommand(id: string): Promise<void> {
    const command = this.terminalCommands.get(id);
    if (!command || !command.enabled) {
      vscode.window.showErrorMessage(
        `${i18n.t('terminal.commandNotFound')} ${id}`
      );
      return;
    }

    try {
      const terminal = vscode.window.createTerminal({
        name: command.title,
        iconPath: this.getIconPath(id as ServiceType),
        location: { viewColumn: vscode.ViewColumn.Beside },
      });

      terminal.show();

      let fullCommand = 'claude';
      const serviceType = id as ServiceType;
      if (SERVICE_TYPES.includes(serviceType)) {
        const _command = this.configManager.getCommand(serviceType);
        const hasCustomCommand = this.configManager.isValidCommand(_command);

        if (hasCustomCommand) {
          // 用户自定义了命令，直接使用，不注入 env 变量
          fullCommand = _command;
        } else {
          const _env = await this.configManager.getEnv(serviceType);
          const envExports = Object.entries(_env)
            .filter(([key, value]) => key && value !== undefined)
            .map(([key, value]) => `export ${key}=${value}`);

          fullCommand = [...envExports, _command || fullCommand]
            .filter(Boolean)
            .join(' && ');
        }
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

  private updateContexts() {
    console.log(i18n.t('terminal.updatingContexts'));
    SERVICE_TYPES.forEach((terminalId) => {
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

  async showConfiguration(): Promise<void> {
    const items: vscode.QuickPickItem[] = [
      {
        label: i18n.t('terminal.openSettings'),
        description: i18n.t('terminal.viewConfigOptions'),
        detail: 'Open VS Code Settings',
      },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
    ];

    const commands = this.getAllCommands();
    for (const cmd of commands) {
      const service = cmd.id as ServiceType;
      const hasToken = await this.configManager.hasAuthToken(service);
      const statusIcon = hasToken
        ? '$(check)'
        : cmd.enabled
          ? '$(terminal)'
          : '$(key)';
      const detail = hasToken
        ? i18n.t('common.configured')
        : cmd.enabled
          ? i18n.t('common.commandOnlyConfigured')
          : i18n.t('common.notConfigured');

      items.push({
        label: `${statusIcon} ${cmd.title}`,
        description: '',
        detail,
        command: cmd,
      } as vscode.QuickPickItem & { command: TerminalCommand });
    }

    const selection = await vscode.window.showQuickPick(items, {
      placeHolder: i18n.t('terminal.selectTerminalToConfigure'),
    });

    if (!selection) return;

    if (selection.label.includes('$(gear)')) {
      await vscode.commands.executeCommand(
        'workbench.action.openSettings',
        'claude-code-terminal'
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

  private async showTerminalConfiguration(
    command: TerminalCommand
  ): Promise<void> {
    await this.configManager.configureApiKey(command.id as ServiceType);
  }

  private getIconPath(
    serviceType: ServiceType
  ): { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon {
    if (serviceType === 'custom') {
      return new vscode.ThemeIcon('terminal');
    }

    return {
      light: vscode.Uri.file(join(__dirname, `../../icons/${serviceType}.svg`)),
      dark: vscode.Uri.file(
        join(__dirname, `../../icons/${serviceType}-dark.svg`)
      ),
    };
  }
}
