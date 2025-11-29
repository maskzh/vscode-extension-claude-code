import * as vscode from 'vscode';
import { TerminalManager } from './terminal-manager';

export async function activate(context: vscode.ExtensionContext) {
  console.log('Claude Code Terminal Extension Activated');

  const terminalManager = TerminalManager.getInstance();

  terminalManager.initialize(context);
  await terminalManager.initializeDefaultCommands();

  const terminalDisposables = [
    vscode.commands.registerCommand('claude-code-terminal.qwen', async () => {
      await terminalManager.executeTerminalCommand('qwen');
    }),
    vscode.commands.registerCommand('claude-code-terminal.kimi', async () => {
      await terminalManager.executeTerminalCommand('kimi');
    }),
    vscode.commands.registerCommand(
      'claude-code-terminal.deepseek',
      async () => {
        await terminalManager.executeTerminalCommand('deepseek');
      }
    ),
    vscode.commands.registerCommand(
      'claude-code-terminal.minimax',
      async () => {
        await terminalManager.executeTerminalCommand('minimax');
      }
    ),
    vscode.commands.registerCommand('claude-code-terminal.zhipu', async () => {
      await terminalManager.executeTerminalCommand('zhipu');
    }),
    vscode.commands.registerCommand('claude-code-terminal.copilot', async () => {
      await terminalManager.executeTerminalCommand('copilot');
    }),
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

  console.log('All terminal commands have been registered.');
}

export function deactivate() {
  console.log('Claude Code Terminal Extension Disabled');
}
