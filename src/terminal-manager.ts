import { join } from 'path';
import * as vscode from 'vscode';
import { ConfigManager } from './config-manager';
import { SERVICE_TYPES } from './constants';
import { ServiceType, TerminalCommand } from './types';
import { i18n } from './utils/i18n';

interface TerminalState {
  viewColumn?: vscode.ViewColumn;
  tab?: vscode.Tab;
  label?: string;
  isPending: boolean;
}

export class TerminalManager {
  private static instance: TerminalManager;
  private terminalCommands: Map<string, TerminalCommand> = new Map();
  private configManager: ConfigManager;
  private terminalState: TerminalState = { isPending: false };
  private disposables: vscode.Disposable[] = [];

  private constructor() {
    this.configManager = ConfigManager.getInstance();
  }

  initialize(context: vscode.ExtensionContext): void {
    this.configManager.initialize(context);

    const tabGroupListener = vscode.window.tabGroups.onDidChangeTabGroups(
      () => {
        this.syncTerminalState();
      }
    );

    this.disposables.push(tabGroupListener);
    context.subscriptions.push(...this.disposables);
  }

  static getInstance(): TerminalManager {
    if (!TerminalManager.instance) {
      TerminalManager.instance = new TerminalManager();
    }
    return TerminalManager.instance;
  }

  async initializeDefaultCommands() {
    console.log(i18n.t('terminal.initializingCommands'));

    const serviceStatuses = await this.getAllServiceStatuses();

    const commands = SERVICE_TYPES.map((serviceType, index) => ({
      id: serviceType,
      title: this.getServiceTitle(serviceType),
      enabled: serviceStatuses[serviceType],
      order: index + 1,
    }));

    commands.forEach((cmd) => {
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
      } commands`
    );
    this.updateContexts();

    this.configManager.onConfigurationChanged(() => {
      this.refreshAITerminals();
    });
  }

  private async getAllServiceStatuses(): Promise<Record<ServiceType, boolean>> {
    const results = await Promise.all(
      SERVICE_TYPES.map(async (serviceType) => {
        const isConfigured = await this.configManager.isServiceConfigured(
          serviceType
        );
        return [serviceType, isConfigured] as const;
      })
    );

    return Object.fromEntries(results) as Record<ServiceType, boolean>;
  }

  private getServiceTitle(serviceType: ServiceType): string {
    const titles: Record<ServiceType, string> = {
      qwen: 'Qwen Code',
      kimi: 'Kimi Code',
      deepseek: 'DeepSeek Code',
      zhipu: 'Zhipu Code',
      minimax: 'Minimax Code',
      copilot: 'GitHub Copilot Code',
      custom: 'Custom Code',
    };
    return titles[serviceType];
  }

  private async refreshAITerminals() {
    console.log(i18n.t('terminal.configChanged'));

    const serviceStatuses = await this.getAllServiceStatuses();

    SERVICE_TYPES.forEach((serviceType) => {
      const terminal = this.terminalCommands.get(serviceType);
      if (terminal) {
        terminal.enabled = serviceStatuses[serviceType];
        console.log(
          `${this.getServiceTitle(serviceType)}${i18n.t(
            'terminal.terminalStatus'
          )}: ${terminal.enabled}`
        );
      }
    });

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
      const targetColumn = this.getTargetViewColumn();

      if (!this.terminalState.label) {
        this.terminalState.isPending = true;
        this.terminalState.viewColumn = targetColumn;
        this.terminalState.label = command.title;
      }

      const env = await this.configManager.getEnv(id as ServiceType);
      const terminal = vscode.window.createTerminal({
        name: command.title,
        iconPath: this.getIconPath(id as ServiceType),
        location: { viewColumn: targetColumn },
        env: env
      });

      terminal.show();
      this.captureTerminalTab(command.title);

      const fullCommand = await this.buildCommand(id as ServiceType);
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

  private async buildCommand(serviceType: ServiceType): Promise<string> {
    const customCommand = this.configManager.getCommand(serviceType);

    if (this.configManager.isValidCommand(customCommand)) {
      return customCommand;
    }

    return customCommand || 'claude';
  }

  private getTargetViewColumn(): vscode.ViewColumn {
    this.syncTerminalState();
    return this.terminalState.viewColumn ?? vscode.ViewColumn.Beside;
  }

  private captureTerminalTab(label: string): void {
    if (this.terminalState.label && !this.terminalState.isPending) return;

    const targetLabel = this.terminalState.label || label;

  const capture = (retry = false) => {
      const found = this.findTerminalTab(targetLabel);
      if (found) {
        this.terminalState.viewColumn = found.group.viewColumn;
        this.terminalState.label = targetLabel;
        this.terminalState.tab = found.tab;
        this.terminalState.isPending = false;
      } else if (!retry) {
        setTimeout(() => capture(true), 50);
      }
    };

    capture();
  }

  private findTerminalTab(
    label: string
  ): { tab: vscode.Tab; group: vscode.TabGroup } | undefined {
    for (const group of vscode.window.tabGroups.all) {
      const tab = group.tabs.find(
        (item) =>
          item.label === label && item.input instanceof vscode.TabInputTerminal
      );
      if (tab) return { tab, group };
    }
    return undefined;
  }

  private syncTerminalState(): void {
    if (!this.terminalState.label) return;

    if (this.terminalState.tab) {
      const matchByRef = vscode.window.tabGroups.all.find((group) =>
        group.tabs.some((tab) => tab === this.terminalState.tab)
      );

      if (matchByRef) {
        this.terminalState.viewColumn = matchByRef.viewColumn;
        this.terminalState.isPending = false;
        return;
      }
    }

    const found = this.findTerminalTab(this.terminalState.label);
    if (found) {
      this.terminalState.viewColumn = found.group.viewColumn;
      this.terminalState.tab = found.tab;
      this.terminalState.isPending = false;
      return;
    }

    if (this.terminalState.isPending) return;

    this.terminalState = { isPending: false };
  }

  private updateContexts(): void {
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
        'claudeCodeIntegration'
      );
    } else {
      const item = selection as vscode.QuickPickItem & {
        command: TerminalCommand;
      };
      if (item.command) {
        await this.configManager.configureApiKey(
          item.command.id as ServiceType
        );
      }
    }
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

  dispose(): void {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
