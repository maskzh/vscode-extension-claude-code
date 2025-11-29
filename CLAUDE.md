# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a VS Code extension called "Claude Code Integration" that provides quick access to multiple Anthropic-compatible AI terminals (Qwen, Kimi, DeepSeek, Zhipu, Minimax, GitHub Copilot, Custom) directly from the editor title bar. The extension intelligently shows/hides icons based on configuration status.

## Architecture

### Core Components

- **extension.ts**: Main entry point that registers VS Code commands and initializes the extension
- **TerminalManager**: Singleton class that manages terminal creation, command execution, and UI state
- **ConfigManager**: Singleton class that handles configuration storage, API key management, and environment variables
- **I18nManager**: Internationalization support for English and Chinese locales

### Key Design Patterns

- **Singleton Pattern**: Both TerminalManager and ConfigManager use singleton pattern for centralized state management
- **Service Configuration**: Each AI service (Qwen, Kimi, etc.) has a predefined configuration in `config-manager.ts` with default base URLs and command settings
- **Secret Storage**: API keys are stored securely in VS Code's Secret Storage
- **Context-based UI**: Terminal icons are only shown when the corresponding service is properly configured

### Configuration System

- **Settings Structure**: Configuration is stored under `claudeCodeIntegration.{service}.{property}` in VS Code settings
- **Environment Variables**: Each service can have custom environment variables, with API keys stored securely
- **Command Override**: Users can specify custom commands that bypass the default environment injection
- **Fallback Logic**: If user configuration is empty, the system falls back to default values

## Development Commands

### Build and Development

```bash
# Compile TypeScript
npm run compile

# Watch for changes during development
npm run watch

# Run linting
npm run lint

# Package extension
npm run package

# Run tests
npm test
```

### Testing

```bash
# Run all tests
npm test

# Run linting before tests
npm run pretest
```

## Important Implementation Details

### Terminal Command Execution

- **Default Mode**: When no custom command is specified, the extension injects environment variables and runs `claude`
- **Custom Command Mode**: If a custom command is set, it's executed directly without environment injection
- **Terminal Creation**: Terminals are created in a side panel (`vscode.ViewColumn.Beside`) with service-specific icons

### Configuration Validation

- A service is considered "configured" if it has either:
  - A valid API key AND a non-empty base URL
  - A valid custom command (non-empty and not equal to "claude")
- Configuration changes trigger automatic UI updates via context variables

### Internationalization

- The extension automatically detects VS Code's language setting
- Supports English and Chinese (simplified)
- All UI strings are managed through the I18nManager class

## File Structure

```
src/
├── extension.ts          # Main extension entry point
├── terminal-manager.ts   # Terminal creation and command execution
├── config-manager.ts     # Configuration and API key management
├── types.ts              # TypeScript type definitions
├── constants.ts          # Application constants
└── utils/
    └── i18n.ts           # Internationalization support
```

## Service Configuration

Each AI service has predefined defaults:

- **Qwen**: `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy`
- **Kimi**: `https://api.moonshot.cn/anthropic`
- **DeepSeek**: `https://api.deepseek.com/anthropic`
- **Zhipu**: `https://open.bigmodel.cn/api/anthropic`
- **Minimax**: `https://api.minimax.io/anthropic`
- **GitHub Copilot**: `https://api.github.com/copilot/anthropic`
- **Custom**: Empty (user must provide)

## Common Development Tasks

### Adding a New AI Service

1. Add the service type to `SERVICE_TYPES` in `constants.ts`
2. Add service configuration to `SERVICE_CONFIGS` in `config-manager.ts`
3. Register the command in `extension.ts`
4. Add terminal command configuration in `terminal-manager.ts`
5. Add icons in the `icons/` directory (light and dark variants)

### Debugging

1. Open the project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension functionality in the new window
4. Check the Debug Console for extension logs

### Testing Configuration Changes

- Configuration changes automatically trigger terminal status updates
- Use the "Configure" command to test API key input and storage
- Monitor context variables to verify UI state changes