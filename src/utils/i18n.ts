import * as vscode from 'vscode';

/** 语言键类型 */
type I18nKey =
  // 通用
  | 'common.alwaysAvailable'
  | 'common.configured'
  | 'common.notConfigured'
  | 'common.clickToReconfigure'
  | 'common.clickToConfigure'

  // 终端管理器
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

  // 配置管理器
  | 'config.notInitialized'
  | 'config.inputApiKey'
  | 'config.apiKeySaved'
  | 'config.apiKeyCleared'
  | 'config.configCallbackFailed';

/** 语言包接口 */
interface I18nMessages {
  [key: string]: string;
}

/** i18n 管理器 */
export class I18nManager {
  private static instance: I18nManager;
  private messages: I18nMessages = {};
  private currentLocale: string = 'en';

  private constructor() {
    this.detectLocale();
    this.loadMessages();
  }

  /** 获取单例实例 */
  static getInstance(): I18nManager {
    if (!I18nManager.instance) {
      I18nManager.instance = new I18nManager();
    }
    return I18nManager.instance;
  }

  /** 检测当前语言环境 */
  private detectLocale(): void {
    const locale = vscode.env.language;
    this.currentLocale = locale.startsWith('zh') ? 'zh-cn' : 'en';
  }

  /** 加载语言包 */
  private loadMessages(): void {
    if (this.currentLocale === 'zh-cn') {
      this.messages = {
        // 通用
        'common.alwaysAvailable': '始终可用',
        'common.configured': '已配置 API Key，点击重新配置',
        'common.notConfigured': '点击配置 API Key',
        'common.clickToReconfigure': '点击重新配置',
        'common.clickToConfigure': '点击配置 API Key',

        // 终端管理器
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

        // 配置管理器
        'config.notInitialized': 'ConfigManager not initialized with context',
        'config.inputApiKey': '🔐 输入 {0} API Key (输入内容将被隐藏)',
        'config.apiKeySaved': '{0} API Key 已保存',
        'config.apiKeyCleared': '{0} API Key 已清空',
        'config.configCallbackFailed': '配置变化回调执行失败:',
      };
    } else {
      this.messages = {
        // 通用
        'common.alwaysAvailable': 'Always Available',
        'common.configured': 'API Key configured, click to reconfigure',
        'common.notConfigured': 'Click to configure API Key',
        'common.clickToReconfigure': 'Click to reconfigure',
        'common.clickToConfigure': 'Click to configure API Key',

        // 终端管理器
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

        // 配置管理器
        'config.notInitialized': 'ConfigManager not initialized with context',
        'config.inputApiKey': '🔐 Enter {0} API Key (input will be hidden)',
        'config.apiKeySaved': '{0} API Key saved',
        'config.apiKeyCleared': '{0} API Key cleared',
        'config.configCallbackFailed': 'Configuration change callback failed:',
      };
    }
  }

  /** 获取本地化文本 */
  t(key: I18nKey, ...args: string[]): string {
    let message = this.messages[key] || key;

    // 简单的参数替换
    args.forEach((arg, index) => {
      message = message.replace(`{${index}}`, arg);
    });

    return message;
  }

  /** 获取当前语言环境 */
  getCurrentLocale(): string {
    return this.currentLocale;
  }
}

/** 导出全局 i18n 实例 */
export const i18n = I18nManager.getInstance();
