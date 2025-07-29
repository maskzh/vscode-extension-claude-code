import { join } from 'path';
import * as vscode from 'vscode';
import { ServiceType } from '../types';

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

  getIconPath(
    serviceType: ServiceType
  ): { light: vscode.Uri; dark: vscode.Uri } | vscode.ThemeIcon {
    if (serviceType === 'custom') {
      return new vscode.ThemeIcon('terminal');
    }

    const useColorIcons = this.getUseColorIcons();

    if (useColorIcons) {
      const colorIconPath = vscode.Uri.file(
        join(__dirname, `../../icons/${serviceType}-color.svg`)
      );
      return { light: colorIconPath, dark: colorIconPath };
    } else {
      return {
        light: vscode.Uri.file(
          join(__dirname, `../../icons/${serviceType}.svg`)
        ),
        dark: vscode.Uri.file(
          join(__dirname, `../../icons/${serviceType}-dark.svg`)
        ),
      };
    }
  }

  onConfigurationChanged(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('ClaudeCodeTerminal.useColorIcons')) {
        callback();
      }
    });
  }
}
