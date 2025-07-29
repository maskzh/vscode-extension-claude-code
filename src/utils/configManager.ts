import * as vscode from 'vscode';
import { i18n } from './i18n';

/** 服务类型 */
export type ServiceType = 'qwen' | 'kimi' | 'custom';

/** 服务配置 */
type ServiceConfig = {
  /** 默认 Base URL */
  defaultBaseUrl: string;
  /** 默认命令 */
  defaultCommand: string;
  /** 服务显示名称 */
  displayName: string;
  /** API Key 存储键 */
  secretKey: string;
  /** 配置键前缀 */
  configPrefix: string;
};

/** 服务配置映射 */
const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  qwen: {
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
    defaultCommand: 'claude',
    displayName: 'Qwen',
    secretKey: 'ClaudeCodeTerminal.qwen.apiKey',
    configPrefix: 'qwen'
  },
  kimi: {
    defaultBaseUrl: 'https://api.moonshot.cn/anthropic',
    defaultCommand: 'claude',
    displayName: 'Kimi',
    secretKey: 'ClaudeCodeTerminal.kimi.apiKey',
    configPrefix: 'kimi'
  },
  custom: {
    defaultBaseUrl: '',
    defaultCommand: 'claude',
    displayName: 'Custom',
    secretKey: 'ClaudeCodeTerminal.custom.apiKey',
    configPrefix: 'custom'
  }
};

/** 配置管理器 */
export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configSection = 'ClaudeCodeTerminal';
  private context: vscode.ExtensionContext | null = null;
  private secretsChangeCallbacks: (() => void)[] = [];

  /** 获取单例实例 */
  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  /** 初始化，传入 ExtensionContext 以使用 secrets API */
  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  /** 获取服务 Base URL */
  getBaseUrl(service: ServiceType): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const serviceConfig = SERVICE_CONFIGS[service];
    return config.get<string>(
      `${serviceConfig.configPrefix}.baseUrl`,
      serviceConfig.defaultBaseUrl
    );
  }

  /** 获取服务命令 */
  getCommand(service: ServiceType): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const serviceConfig = SERVICE_CONFIGS[service];
    return config.get<string>(
      `${serviceConfig.configPrefix}.command`,
      serviceConfig.defaultCommand
    );
  }

  /** 获取服务 API Key */
  async getApiKey(service: ServiceType): Promise<string> {
    if (!this.context) {
      console.warn(i18n.t('config.notInitialized'));
      return '';
    }
    const serviceConfig = SERVICE_CONFIGS[service];
    return (await this.context.secrets.get(serviceConfig.secretKey)) || '';
  }

  /** 设置服务 API Key */
  async setApiKey(service: ServiceType, apiKey: string): Promise<void> {
    if (!this.context) {
      console.warn(i18n.t('config.notInitialized'));
      return;
    }
    const serviceConfig = SERVICE_CONFIGS[service];
    if (apiKey.trim()) {
      await this.context.secrets.store(serviceConfig.secretKey, apiKey);
    } else {
      await this.context.secrets.delete(serviceConfig.secretKey);
    }
    this.triggerSecretsChangeCallbacks();
  }

  /** 检查服务是否已配置 */
  async isServiceConfigured(service: ServiceType): Promise<boolean> {
    const apiKey = await this.getApiKey(service);
    const command = this.getCommand(service);
    return this.isValidApiKey(apiKey) || this.isValidCommand(command);
  }

  /** 配置服务 API Key */
  async configureApiKey(service: ServiceType): Promise<void> {
    const serviceConfig = SERVICE_CONFIGS[service];
    const currentKey = await this.getApiKey(service);
    const maskedKey = currentKey
      ? `${currentKey.substring(0, 8)}${'*'.repeat(
          Math.max(0, currentKey.length - 8)
        )}`
      : '';

    const apiKey = await vscode.window.showInputBox({
      prompt: i18n.t('config.inputApiKey', serviceConfig.displayName),
      value: '',
      placeHolder: maskedKey || 'sk-xxxxxxxxxxxxxxxxxxxx',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey !== undefined) {
      await this.setApiKey(service, apiKey);
      if (apiKey.trim()) {
        vscode.window.showInformationMessage(
          i18n.t('config.apiKeySaved', serviceConfig.displayName)
        );
      } else {
        vscode.window.showInformationMessage(
          i18n.t('config.apiKeyCleared', serviceConfig.displayName)
        );
      }
    }
  }

  /** 检查 API Key 是否有效 */
  isValidApiKey(apiKey: string): boolean {
    return apiKey.trim().length > 0;
  }

  /** 检查 Command 是否有效 */
  isValidCommand(command: string): boolean {
    return command.trim().length > 0 && command !== 'claude';
  }

  /** 监听配置变化 */
  onConfigurationChanged(callback: () => void): vscode.Disposable {
    // 添加到 secrets 变化回调列表
    this.secretsChangeCallbacks.push(callback);

    // 返回 workspace 配置变化的监听器
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        callback();
      }
    });
  }

  /** 触发 secrets 变化回调 */
  private triggerSecretsChangeCallbacks(): void {
    this.secretsChangeCallbacks.forEach((callback) => {
      try {
        callback();
      } catch (error) {
        console.error(i18n.t('config.configCallbackFailed'), error);
      }
    });
  }
}
