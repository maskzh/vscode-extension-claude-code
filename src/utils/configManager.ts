import * as vscode from 'vscode';

/** 配置管理器 */
export class ConfigManager {
  private static instance: ConfigManager;
  private readonly configSection = 'ClaudeCodeTerminal';
  private context: vscode.ExtensionContext | null = null;

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

  /** 获取 Qwen API Key */
  async getQwenApiKey(): Promise<string> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return '';
    }
    return (
      (await this.context.secrets.get('ClaudeCodeTerminal.qwen.apiKey')) || ''
    );
  }

  /** 获取 Kimi API Key */
  async getKimiApiKey(): Promise<string> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return '';
    }
    return (
      (await this.context.secrets.get('ClaudeCodeTerminal.kimi.apiKey')) || ''
    );
  }

  /** 获取 Qwen Base URL */
  getQwenBaseUrl(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>(
      'qwen.baseUrl',
      'https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy'
    );
  }

  /** 获取 Kimi Base URL */
  getKimiBaseUrl(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>(
      'kimi.baseUrl',
      'https://api.moonshot.cn/anthropic'
    );
  }

  /** 设置 Qwen API Key */
  async setQwenApiKey(apiKey: string): Promise<void> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return;
    }
    if (apiKey.trim()) {
      await this.context.secrets.store(
        'ClaudeCodeTerminal.qwen.apiKey',
        apiKey
      );
    } else {
      await this.context.secrets.delete('ClaudeCodeTerminal.qwen.apiKey');
    }
  }

  /** 设置 Kimi API Key */
  async setKimiApiKey(apiKey: string): Promise<void> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return;
    }
    if (apiKey.trim()) {
      await this.context.secrets.store(
        'ClaudeCodeTerminal.kimi.apiKey',
        apiKey
      );
    } else {
      await this.context.secrets.delete('ClaudeCodeTerminal.kimi.apiKey');
    }
  }

  /** 设置 Custom API Key */
  async setCustomApiKey(apiKey: string): Promise<void> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return;
    }
    if (apiKey.trim()) {
      await this.context.secrets.store(
        'ClaudeCodeTerminal.custom.apiKey',
        apiKey
      );
    } else {
      await this.context.secrets.delete('ClaudeCodeTerminal.custom.apiKey');
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

  /** 检查 Qwen 是否已配置 */
  async isQwenConfigured(): Promise<boolean> {
    const apiKey = await this.getQwenApiKey();
    const command = this.getQwenCommand();
    return this.isValidApiKey(apiKey) || this.isValidCommand(command);
  }

  /** 检查 Kimi 是否已配置 */
  async isKimiConfigured(): Promise<boolean> {
    const apiKey = await this.getKimiApiKey();
    const command = this.getKimiCommand();
    return this.isValidApiKey(apiKey) || this.isValidCommand(command);
  }

  /** 检查 Custom 是否已配置 */
  async isCustomConfigured(): Promise<boolean> {
    const apiKey = await this.getCustomApiKey();
    const command = this.getCustomCommand();
    return this.isValidApiKey(apiKey) || this.isValidCommand(command);
  }

  /** 配置 Qwen API Key */
  async configureQwenApiKey(): Promise<void> {
    const currentKey = await this.getQwenApiKey();
    const maskedKey = currentKey
      ? `${currentKey.substring(0, 8)}${'*'.repeat(
          Math.max(0, currentKey.length - 8)
        )}`
      : '';

    const apiKey = await vscode.window.showInputBox({
      prompt: '🔐 输入 Qwen API Key (输入内容将被隐藏)',
      value: '',
      placeHolder: maskedKey || 'sk-xxxxxxxxxxxxxxxxxxxx',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey !== undefined) {
      await this.setQwenApiKey(apiKey);
      if (apiKey.trim()) {
        vscode.window.showInformationMessage('Qwen API Key 已保存');
      } else {
        vscode.window.showInformationMessage('Qwen API Key 已清空');
      }
    }
  }

  /** 配置 Kimi API Key */
  async configureKimiApiKey(): Promise<void> {
    const currentKey = await this.getKimiApiKey();
    const maskedKey = currentKey
      ? `${currentKey.substring(0, 8)}${'*'.repeat(
          Math.max(0, currentKey.length - 8)
        )}`
      : '';

    const apiKey = await vscode.window.showInputBox({
      prompt: '🔐 输入 Kimi API Key (输入内容将被隐藏)',
      value: '',
      placeHolder: maskedKey || 'sk-xxxxxxxxxxxxxxxxxxxx',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey !== undefined) {
      await this.setKimiApiKey(apiKey);
      if (apiKey.trim()) {
        vscode.window.showInformationMessage('Kimi API Key 已保存');
      } else {
        vscode.window.showInformationMessage('Kimi API Key 已清空');
      }
    }
  }

  /** 配置 Custom API Key */
  async configureCustomApiKey(): Promise<void> {
    const currentKey = await this.getCustomApiKey();
    const maskedKey = currentKey
      ? `${currentKey.substring(0, 8)}${'*'.repeat(
          Math.max(0, currentKey.length - 8)
        )}`
      : '';

    const apiKey = await vscode.window.showInputBox({
      prompt: '🔐 输入 Custom API Key (输入内容将被隐藏)',
      value: '',
      placeHolder: maskedKey || 'sk-xxxxxxxxxxxxxxxxxxxx',
      password: true,
      ignoreFocusOut: true,
    });

    if (apiKey !== undefined) {
      await this.setCustomApiKey(apiKey);
      if (apiKey.trim()) {
        vscode.window.showInformationMessage('Custom API Key 已保存');
      } else {
        vscode.window.showInformationMessage('Custom API Key 已清空');
      }
    }
  }

  /** 获取 Custom API Key */
  async getCustomApiKey(): Promise<string> {
    if (!this.context) {
      console.warn('ConfigManager not initialized with context');
      return '';
    }
    return (
      (await this.context.secrets.get('ClaudeCodeTerminal.custom.apiKey')) || ''
    );
  }

  /** 获取 Custom Base URL */
  getCustomBaseUrl(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>('custom.baseUrl', '');
  }

  /** 获取 Qwen Command */
  getQwenCommand(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>('qwen.command', 'claude');
  }

  /** 获取 Kimi Command */
  getKimiCommand(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>('kimi.command', 'claude');
  }

  /** 获取 Custom Command */
  getCustomCommand(): string {
    const config = vscode.workspace.getConfiguration(this.configSection);
    return config.get<string>('custom.command', 'claude');
  }

  /** 监听配置变化 */
  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(this.configSection)) {
        callback();
      }
    });
  }
}
