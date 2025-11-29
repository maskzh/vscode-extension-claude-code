import * as vscode from 'vscode';
import { ServiceConfig, ServiceType } from './types';
import { i18n } from './utils/i18n';

const SERVICE_CONFIGS: Record<ServiceType, ServiceConfig> = {
  qwen: {
    displayName: 'Qwen',
    secretKey: 'claude-code-terminal.qwen.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL:
        'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy',
    },
  },
  kimi: {
    displayName: 'Kimi',
    secretKey: 'claude-code-terminal.kimi.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: 'https://api.moonshot.cn/anthropic',
    },
  },
  deepseek: {
    displayName: 'DeepSeek',
    secretKey: 'claude-code-terminal.deepseek.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: 'https://api.deepseek.com/anthropic',
    },
  },
  zhipu: {
    displayName: 'Zhipu',
    secretKey: 'claude-code-terminal.zhipu.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: 'https://open.bigmodel.cn/api/anthropic',
    },
  },
  copilot: {
    displayName: 'GitHub Copilot',
    secretKey: 'claude-code-terminal.copilot.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: 'https://api.github.com/copilot/anthropic',
    },
  },
  minimax: {
    displayName: 'Minimax',
    secretKey: 'claude-code-terminal.minimax.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: 'https://api.minimax.io/anthropic',
    },
  },
  custom: {
    displayName: 'Custom',
    secretKey: 'claude-code-terminal.custom.env.ANTHROPIC_AUTH_TOKEN',
    defaultCommand: 'claude',
    defaultEnv: {
      ANTHROPIC_BASE_URL: '',
    },
  },
};

export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configSection = 'claude-code-terminal';
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
      `${service}.command`,
      SERVICE_CONFIGS[service].defaultCommand
    );
  }

  async getEnv(service: ServiceType): Promise<Record<string, string>> {
    const config = vscode.workspace.getConfiguration(this.configSection);
    const serviceConfig = SERVICE_CONFIGS[service];
    const env = config.get<Record<string, string>>(
      `${service}.env`,
      serviceConfig.defaultEnv
    );
    const secretToken = await this.getAuthToken(service);

    // 兜底：如果配置为空对象则回退到默认值，确保基础字段存在
    const merged = {
      ...serviceConfig.defaultEnv,
      ...(env && Object.keys(env).length > 0 ? env : {}),
    };

    // 使用 Secret Storage 中的 token 覆盖配置中的明文值
    if (secretToken) {
      merged.ANTHROPIC_AUTH_TOKEN = secretToken;
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
      typeof env.ANTHROPIC_BASE_URL === 'string' &&
      env.ANTHROPIC_BASE_URL.trim().length > 0;
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
      await this.setAuthToken(service, apiKey);
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
