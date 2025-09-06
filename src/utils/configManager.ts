import * as vscode from 'vscode';
import { i18n } from './i18n';

export type ServiceType = 'qwen' | 'kimi' | 'deepseek' | 'copilot' | 'custom';

type ServiceConfig = {
  defaultBaseUrl: string;
  defaultCommand: string;
  displayName: string;
  secretKey: string;
  configPrefix: string;
};

const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  qwen: {
    defaultBaseUrl:
      'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
    defaultCommand: 'claude',
    displayName: 'Qwen',
    secretKey: 'ClaudeCodeTerminal.qwen.apiKey',
    configPrefix: 'qwen',
  },
  kimi: {
    defaultBaseUrl: 'https://api.moonshot.cn/anthropic',
    defaultCommand: 'claude',
    displayName: 'Kimi',
    secretKey: 'ClaudeCodeTerminal.kimi.apiKey',
    configPrefix: 'kimi',
  },
  deepseek: {
    defaultBaseUrl: 'https://api.deepseek.com/anthropic',
    defaultCommand: 'claude',
    displayName: 'DeepSeek',
    secretKey: 'ClaudeCodeTerminal.deepseek.apiKey',
    configPrefix: 'deepseek',
  },
  copilot: {
    defaultBaseUrl: 'https://api.github.com/copilot/anthropic',
    defaultCommand: 'claude',
    displayName: 'GitHub Copilot',
    secretKey: 'ClaudeCodeTerminal.copilot.apiKey',
    configPrefix: 'copilot',
  },
  custom: {
    defaultBaseUrl: '',
    defaultCommand: 'claude',
    displayName: 'Custom',
    secretKey: 'ClaudeCodeTerminal.custom.apiKey',
    configPrefix: 'custom',
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configSection = 'ClaudeCodeTerminal';
  private context: vscode.ExtensionContext | null = null;
  private secretsChangeCallbacks: (() => void)[] = [];

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  initialize(context: vscode.ExtensionContext): void {
    this.context = context;
  }

  getBaseUrl(service: ServiceType): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const serviceConfig = SERVICE_CONFIGS[service];
    return config.get<string>(
      `${serviceConfig.configPrefix}.baseUrl`,
      serviceConfig.defaultBaseUrl
    );
  }

  getCommand(service: ServiceType): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const serviceConfig = SERVICE_CONFIGS[service];
    return config.get<string>(
      `${serviceConfig.configPrefix}.command`,
      serviceConfig.defaultCommand
    );
  }

  async getApiKey(service: ServiceType): Promise<string> {
    if (!this.context) {
      console.warn(i18n.t('config.notInitialized'));
      return '';
    }
    const serviceConfig = SERVICE_CONFIGS[service];
    return (await this.context.secrets.get(serviceConfig.secretKey)) || '';
  }

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

  async isServiceConfigured(service: ServiceType): Promise<boolean> {
    const apiKey = await this.getApiKey(service);
    const command = this.getCommand(service);
    const baseUrl = this.getBaseUrl(service);
    
    // For copilot, if it has a default baseUrl, consider it configured
    if (service === 'copilot' && baseUrl && baseUrl !== '') {
      return true;
    }
    
    return this.isValidApiKey(apiKey) || this.isValidCommand(command);
  }

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

  isValidApiKey(apiKey: string): boolean {
    return apiKey.trim().length > 0;
  }

  isValidCommand(command: string): boolean {
    return command.trim().length > 0 && command !== 'claude';
  }

  onConfigurationChanged(callback: () => void): vscode.Disposable {
    this.secretsChangeCallbacks.push(callback);

    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        callback();
      }
    });
  }

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
