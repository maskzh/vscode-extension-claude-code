import * as vscode from 'vscode';
import { TerminalManager } from './terminal-manager';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Claude Code Integration Extension Activated');

  const terminalManager = TerminalManager.getInstance();

  terminalManager.initialize(context);
  await terminalManager.initializeDefaultCommands();

  const terminalDisposables = [
    vscode.commands.registerCommand('claudeCodeIntegration.qwen', async () => {
      await terminalManager.executeTerminalCommand('qwen');
    }),
    vscode.commands.registerCommand('claudeCodeIntegration.kimi', async () => {
      await terminalManager.executeTerminalCommand('kimi');
    }),
    vscode.commands.registerCommand(
      'claudeCodeIntegration.deepseek',
      async () => {
        await terminalManager.executeTerminalCommand('deepseek');
      }
    ),
    vscode.commands.registerCommand(
      'claudeCodeIntegration.minimax',
      async () => {
        await terminalManager.executeTerminalCommand('minimax');
      }
    ),
    vscode.commands.registerCommand('claudeCodeIntegration.zhipu', async () => {
      await terminalManager.executeTerminalCommand('zhipu');
    }),
    vscode.commands.registerCommand(
      'claudeCodeIntegration.copilot',
      async () => {
        await terminalManager.executeTerminalCommand('copilot');
      }
    ),
    vscode.commands.registerCommand(
      'claudeCodeIntegration.custom',
      async () => {
        await terminalManager.executeTerminalCommand('custom');
      }
    ),
  ];

  const configureDisposable = vscode.commands.registerCommand(
    'claudeCodeIntegration.configure',
    async () => {
      await terminalManager.showConfiguration();
    }
  );

  context.subscriptions.push(configureDisposable, ...terminalDisposables);

  console.log('All terminal commands have been registered.');
}

export function deactivate() {
  console.log('Claude Code Integration Extension Disabled');
}
