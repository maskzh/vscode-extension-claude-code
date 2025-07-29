import * as vscode from 'vscode';

type I18nKey =
  | 'common.alwaysAvailable'
  | 'common.configured'
  | 'common.notConfigured'
  | 'common.clickToReconfigure'
  | 'common.clickToConfigure'
  | 'terminal.initializingCommands'
  | 'terminal.addingFixedCommand'
  | 'terminal.totalCommandsAdded'
  | 'terminal.configChanged'
  | 'terminal.terminalStatus'
  | 'terminal.executingCommand'
  | 'terminal.commandNotFound'
  | 'terminal.executionFailed'
  | 'terminal.updatingContexts'
  | 'terminal.settingContext'
  | 'terminal.openSettings'
  | 'terminal.viewConfigOptions'
  | 'terminal.selectTerminalToConfigure'
  | 'config.notInitialized'
  | 'config.inputApiKey'
  | 'config.apiKeySaved'
  | 'config.apiKeyCleared'
  | 'config.configCallbackFailed';

interface I18nMessages {
  [key: string]: string;
}

export class I18nManager {
  private static instance: I18nManager;
  private messages: I18nMessages = {};
  private currentLocale: string = 'en';

  private constructor() {
    this.detectLocale();
    this.loadMessages();
  }

  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  private detectLocale(): void {
    const locale = vscode.env.language;
    this.currentLocale = locale.startsWith('zh') ? 'zh-cn' : 'en';
  }

  private loadMessages(): void {
    if (this.currentLocale === 'zh-cn') {
      this.messages = {
        'common.alwaysAvailable': '始终可用',
        'common.configured': '已配置 API Key，点击重新配置',
        'common.notConfigured': '点击配置 API Key',
        'common.clickToReconfigure': '点击重新配置',
        'common.clickToConfigure': '点击配置 API Key',

        'terminal.initializingCommands': '初始化默认终端命令...',
        'terminal.addingFixedCommand': '添加固定命令',
        'terminal.totalCommandsAdded': '总共添加了',
        'terminal.configChanged': '配置变化，刷新终端状态...',
        'terminal.terminalStatus': '终端状态',
        'terminal.executingCommand': '执行终端命令',
        'terminal.commandNotFound': '终端命令未找到或已禁用',
        'terminal.executionFailed': '执行终端命令失败',
        'terminal.updatingContexts': '更新上下文...',
        'terminal.settingContext': '设置上下文',
        'terminal.openSettings': '$(gear) 打开设置',
        'terminal.viewConfigOptions': '查看配置选项',
        'terminal.selectTerminalToConfigure': '选择要配置或查看的终端',

        'config.notInitialized': 'ConfigManager not initialized with context',
        'config.inputApiKey': '🔐 输入 {0} API Key (输入内容将被隐藏)',
        'config.apiKeySaved': '{0} API Key 已保存',
        'config.apiKeyCleared': '{0} API Key 已清空',
        'config.configCallbackFailed': '配置变化回调执行失败:',
      };
    } else {
      this.messages = {
        'common.alwaysAvailable': 'Always Available',
        'common.configured': 'API Key configured, click to reconfigure',
        'common.notConfigured': 'Click to configure API Key',
        'common.clickToReconfigure': 'Click to reconfigure',
        'common.clickToConfigure': 'Click to configure API Key',

        'terminal.initializingCommands':
          'Initializing default terminal commands...',
        'terminal.addingFixedCommand': 'Adding fixed command',
        'terminal.totalCommandsAdded': 'Total commands added',
        'terminal.configChanged':
          'Configuration changed, refreshing terminal status...',
        'terminal.terminalStatus': 'Terminal status',
        'terminal.executingCommand': 'Executing terminal command',
        'terminal.commandNotFound': 'Terminal command not found or disabled',
        'terminal.executionFailed': 'Failed to execute terminal command',
        'terminal.updatingContexts': 'Updating contexts...',
        'terminal.settingContext': 'Setting context',
        'terminal.openSettings': '$(gear) Open Settings',
        'terminal.viewConfigOptions': 'View configuration options',
        'terminal.selectTerminalToConfigure':
          'Select terminal to configure or view',

        'config.notInitialized': 'ConfigManager not initialized with context',
        'config.inputApiKey': '🔐 Enter {0} API Key (input will be hidden)',
        'config.apiKeySaved': '{0} API Key saved',
        'config.apiKeyCleared': '{0} API Key cleared',
        'config.configCallbackFailed': 'Configuration change callback failed:',
      };
    }
  }

  t(key: I18nKey, ...args: string[]): string {
    let message = this.messages[key] || key;

    args.forEach((arg, index) => {
      message = message.replace(`{${index}}`, arg);
    });

    return message;
  }

  getCurrentLocale(): string {
    return this.currentLocale;
  }
}

export const i18n = I18nManager.getInstance();
