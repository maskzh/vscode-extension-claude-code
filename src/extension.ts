import * as vscode from 'vscode';
import { TerminalManager } from './utils/terminalManager';

/**
 * 扩展激活时调用
 */
export async function activate(context: vscode.ExtensionContext) {
  console.log('Claude Code Terminal Extension Activated');

  // 初始化终端管理器
  const terminalManager = TerminalManager.getInstance();
  terminalManager.initialize(context);
  await terminalManager.initializeDefaultCommands();

  // 扩展已自动激活，无需手动激活命令

  // 注册终端命令处理函数
  const terminalDisposables = [
    vscode.commands.registerCommand('claude-code-terminal.claude', async () => {
      await terminalManager.executeTerminalCommand('claude');
    }),
    vscode.commands.registerCommand('claude-code-terminal.qwen', async () => {
      await terminalManager.executeTerminalCommand('qwen');
    }),
    vscode.commands.registerCommand('claude-code-terminal.kimi', async () => {
      await terminalManager.executeTerminalCommand('kimi');
    }),
    vscode.commands.registerCommand('claude-code-terminal.custom', async () => {
      await terminalManager.executeTerminalCommand('custom');
    }),
  ];

  // 注册配置命令
  const configureDisposable = vscode.commands.registerCommand(
    'claude-code-terminal.configureTerminals',
    async () => {
      await terminalManager.showConfiguration();
    }
  );

  context.subscriptions.push(configureDisposable, ...terminalDisposables);

  console.log('All terminal commands have been registered.');
}

/**
 * 扩展停用时调用
 */
export function deactivate() {
  console.log('Claude Code Terminal Extension Disabled');
}
