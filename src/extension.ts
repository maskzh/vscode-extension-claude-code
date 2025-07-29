import * as vscode from 'vscode';
import { IconManager } from './utils/iconManager';
import { TerminalManager } from './utils/terminalManager';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Claude Code Terminal Extension Activated');

  const terminalManager = TerminalManager.getInstance();
  const iconManager = IconManager.getInstance();

  terminalManager.initialize(context);
  await terminalManager.initializeDefaultCommands();

  const terminalDisposables = [
    vscode.commands.registerCommand('claude-code-terminal.qwen', async () => {
      await terminalManager.executeTerminalCommand('qwen');
    }),
    vscode.commands.registerCommand(
      'claude-code-terminal.qwen.color',
      async () => {
        await terminalManager.executeTerminalCommand('qwen');
      }
    ),
    vscode.commands.registerCommand('claude-code-terminal.kimi', async () => {
      await terminalManager.executeTerminalCommand('kimi');
    }),
    vscode.commands.registerCommand(
      'claude-code-terminal.kimi.color',
      async () => {
        await terminalManager.executeTerminalCommand('kimi');
      }
    ),
    vscode.commands.registerCommand('claude-code-terminal.custom', async () => {
      await terminalManager.executeTerminalCommand('custom');
    }),
  ];

  const configureDisposable = vscode.commands.registerCommand(
    'claude-code-terminal.configure',
    async () => {
      await terminalManager.showConfiguration();
    }
  );

  context.subscriptions.push(configureDisposable, ...terminalDisposables);

  updateIconModeContext(iconManager);

  const iconConfigDisposable = iconManager.onConfigurationChanged(() => {
    updateIconModeContext(iconManager);
  });

  context.subscriptions.push(iconConfigDisposable);

  console.log('All terminal commands have been registered.');
}

function updateIconModeContext(iconManager: IconManager) {
  const useColorIcons = iconManager.getUseColorIcons();
  vscode.commands.executeCommand(
    'setContext',
    'claudeExtension.useColorIcons',
    useColorIcons
  );
}

export function deactivate() {
  console.log('Claude Code Terminal Extension Disabled');
}
