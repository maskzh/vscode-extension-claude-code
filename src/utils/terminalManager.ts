import * as vscode from 'vscode';
import { TerminalCommand } from '../types';
import { ConfigManager, ServiceType } from './configManager';
import { i18n } from './i18n';
import { IconManager } from './iconManager';

export class TerminalManager {
  private static instance: TerminalManager;
  private terminalCommands: Map<string, TerminalCommand> = new Map();
  private configManager: ConfigManager;
  public iconManager: IconManager;

  private constructor() {
    this.configManager = ConfigManager.getInstance();
    this.iconManager = IconManager.getInstance();
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

    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isServiceConfigured('qwen'),
        this.configManager.isServiceConfigured('kimi'),
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
        id: 'custom',
        title: 'Custom Code',
        enabled: customConfigured,
        order: 3,
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

    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.configManager.isServiceConfigured('qwen'),
        this.configManager.isServiceConfigured('kimi'),
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
        iconPath: this.iconManager.getIconPath(id as ServiceType),
        location: { viewColumn: vscode.ViewColumn.Beside },
      });

      terminal.show();

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

  private updateContexts() {
    console.log(i18n.t('terminal.updatingContexts'));
    const terminalIds = ['qwen', 'kimi', 'custom'];

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
    items.push(
      ...commands.map((cmd) => {
        let statusIcon = '$(circle-outline)';
        let detail = '';

        statusIcon = cmd.enabled ? '$(check)' : '$(key)';
        detail = cmd.enabled
          ? i18n.t('common.configured')
          : i18n.t('common.notConfigured');

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

    if (selection.label.includes('$(gear)')) {
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

  private async showTerminalConfiguration(
    command: TerminalCommand
  ): Promise<void> {
    await this.configManager.configureApiKey(command.id as ServiceType);
  }
}
