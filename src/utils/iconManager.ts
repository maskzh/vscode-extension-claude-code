import * as vscode from 'vscode';

export type ServiceType = 'claude' | 'qwen' | 'kimi';

export class IconManager {
  private static instance: IconManager;

  private constructor() {}

  static getInstance(): IconManager {
    if (!IconManager.instance) {
      IconManager.instance = new IconManager();
    }
    return IconManager.instance;
  }

  getUseColorIcons(): boolean {
    const config = vscode.workspace.getConfiguration('ClaudeCodeTerminal');
    return config.get<boolean>('useColorIcons', false);
  }

  getIconPath(serviceType: ServiceType): { light: string; dark: string } {
    const useColorIcons = this.getUseColorIcons();

    if (useColorIcons) {
      const colorIconPath = `./icons/${serviceType}-color.svg`;
      return {
        light: colorIconPath,
        dark: colorIconPath,
      };
    } else {
      return {
        light: `./icons/${serviceType}.svg`,
        dark: `./icons/${serviceType}-dark.svg`,
      };
    }
  }

  /** 监听配置变更事件 */
  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('ClaudeCodeTerminal.useColorIcons')) {
        callback();
      }
    });
  }
}
