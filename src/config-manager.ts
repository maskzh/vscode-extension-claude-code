import * as vscode from 'vscode';
import { ServiceConfig, ServiceType } from './types';
import { i18n } from './utils/i18n';

enum ConfigKeys {
  COMMAND = 'command',
  ENV = 'env',
  BASE_URL = 'ANTHROPIC_BASE_URL',
  AUTH_TOKEN = 'ANTHROPIC_AUTH_TOKEN',
}

interface BaseServiceConfig {
  displayName: string;
}

const BASE_SERVICE_CONFIGS: Record<ServiceType, BaseServiceConfig> = {
  qwen: { displayName: 'Qwen' },
  kimi: { displayName: 'Kimi' },
  deepseek: { displayName: 'DeepSeek' },
  zhipu: { displayName: 'Zhipu' },
  copilot: { displayName: 'GitHub Copilot' },
  minimax: { displayName: 'Minimax' },
  doubao: { displayName: 'Doubao' },
  custom: { displayName: 'Custom' },
};

const createServiceConfig = (serviceType: ServiceType): ServiceConfig => ({
  displayName: BASE_SERVICE_CONFIGS[serviceType].displayName,
  secretKey: `claudeCodeIntegration.${serviceType}.env.${ConfigKeys.AUTH_TOKEN}`,
  defaultCommand: 'claude',
});

const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = Object.fromEntries(
  Object.keys(BASE_SERVICE_CONFIGS).map((serviceType) => [
    serviceType as ServiceType,
    createServiceConfig(serviceType as ServiceType),
  ])
) as Record<ServiceType, ServiceConfig>;

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configSection = 'claudeCodeIntegration';
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

  getCommand(service: ServiceType): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>(
      `${service}.${ConfigKeys.COMMAND}`,
      SERVICE_CONFIGS[service].defaultCommand
    );
  }

  async getEnv(service: ServiceType): Promise<Record<string, string>> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const env = config.get<Record<string, string>>(
      `${service}.${ConfigKeys.ENV}`
    );
    const secretToken = await this.getAuthToken(service);

    const merged = { ...(env && Object.keys(env).length > 0 ? env : {}) };

    if (secretToken) {
      merged[ConfigKeys.AUTH_TOKEN] = secretToken;
    }

    return merged;
  }

  async getAuthToken(service: ServiceType): Promise<string> {
    if (!this.context) {
      console.warn(i18n.t('config.notInitialized'));
      return '';
    }
    const serviceConfig = SERVICE_CONFIGS[service];
    return (await this.context.secrets.get(serviceConfig.secretKey)) || '';
  }

  async setAuthToken(service: ServiceType, token: string): Promise<void> {
    if (!this.context) {
      console.warn(i18n.t('config.notInitialized'));
      return;
    }
    const serviceConfig = SERVICE_CONFIGS[service];
    if (token.trim()) {
      await this.context.secrets.store(serviceConfig.secretKey, token);
    } else {
      await this.context.secrets.delete(serviceConfig.secretKey);
    }
    this.triggerSecretsChangeCallbacks();
  }

  async isServiceConfigured(service: ServiceType): Promise<boolean> {
    const hasToken = await this.hasAuthToken(service);
    const env = await this.getEnv(service);
    const hasBaseUrl =
      typeof env[ConfigKeys.BASE_URL] === 'string' &&
      env[ConfigKeys.BASE_URL].trim().length > 0;
    const command = this.getCommand(service);

    return (hasToken && hasBaseUrl) || this.isValidCommand(command);
  }

  async hasAuthToken(service: ServiceType): Promise<boolean> {
    const token = await this.getAuthToken(service);
    return this.isValidApiKey(token);
  }

  async configureApiKey(service: ServiceType): Promise<void> {
    const serviceConfig = SERVICE_CONFIGS[service];
    const currentKey = await this.getAuthToken(service);
    const maskedKey = this.maskApiKey(currentKey);

    const apiKey = await vscode.window.showInputBox({
      prompt: i18n.t('config.inputApiKey', serviceConfig.displayName),
      value: '',
      placeHolder: maskedKey || 'sk-xxxxxxxxxxxxxxxxxxxx',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey !== undefined) {
      await this.setAuthToken(service, apiKey);
      const message = apiKey.trim()
        ? i18n.t('config.apiKeySaved', serviceConfig.displayName)
        : i18n.t('config.apiKeyCleared', serviceConfig.displayName);
      vscode.window.showInformationMessage(message);
    }
  }

  private isValidApiKey(apiKey: string): boolean {
    return apiKey.trim().length > 0;
  }

  private maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return `${apiKey.substring(0, 8)}${'*'.repeat(
      Math.max(0, apiKey.length - 8)
    )}`;
  }

  isValidCommand(command: string): boolean {
    const trimmed = command.trim();
    return trimmed.length > 0 && trimmed !== 'claude' && !trimmed.includes(' ');
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
