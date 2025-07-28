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

  /** 检查 API Key 是否有效（简单非空检查） */
  isValidApiKey(apiKey: string): boolean {
    return apiKey.trim().length > 0;
  }

  /** 检查 Qwen 是否已配置 */
  async isQwenConfigured(): Promise<boolean> {
    const apiKey = await this.getQwenApiKey();
    return this.isValidApiKey(apiKey);
  }

  /** 检查 Kimi 是否已配置 */
  async isKimiConfigured(): Promise<boolean> {
    const apiKey = await this.getKimiApiKey();
    return this.isValidApiKey(apiKey);
  }

  /** 显示配置 API Key 的界面 */
  async showApiKeyConfiguration(): Promise<void> {
    const [qwenConfigured, kimiConfigured, customConfigured] =
      await Promise.all([
        this.isQwenConfigured(),
        this.isKimiConfigured(),
        this.isCustomConfigured(),
      ]);

    const options = [
      {
        label: `$(key) 配置 Qwen API Key ${qwenConfigured ? '✅' : '❌'}`,
        value: 'qwen',
        detail: '通过安全输入框配置 Qwen API Key',
      },
      {
        label: `$(key) 配置 Kimi API Key ${kimiConfigured ? '✅' : '❌'}`,
        value: 'kimi',
        detail: '通过安全输入框配置 Kimi API Key',
      },
      {
        label: `$(key) 配置 Custom API Key ${customConfigured ? '✅' : '❌'}`,
        value: 'custom',
        detail: '通过安全输入框配置 Custom API Key',
      },
      { label: '', kind: vscode.QuickPickItemKind.Separator },
      {
        label: '$(gear) 打开设置页面',
        value: 'settings',
        detail:
          '查看其他配置选项（API Key 已从设置页面移除，仅能通过上述安全方式配置）',
      },
    ];

    const selection = await vscode.window.showQuickPick(options, {
      placeHolder: '选择要配置的 API Key',
    });

    if (!selection) return;

    switch (selection.value) {
      case 'qwen':
        await this.configureQwenApiKey();
        break;
      case 'kimi':
        await this.configureKimiApiKey();
        break;
      case 'custom':
        await this.configureCustomApiKey();
        break;
      case 'settings':
        await vscode.commands.executeCommand(
          'workbench.action.openSettings',
          'ClaudeCodeTerminal'
        );
        break;
    }
  }

  /** 配置 Qwen API Key */
  private async configureQwenApiKey(): Promise<void> {
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
  private async configureKimiApiKey(): Promise<void> {
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
  private async configureCustomApiKey(): Promise<void> {
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

  /** 检查 Custom 是否已配置 */
  async isCustomConfigured(): Promise<boolean> {
    const apiKey = await this.getCustomApiKey();
    return this.isValidApiKey(apiKey);
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
