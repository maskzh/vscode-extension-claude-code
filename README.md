# Claude Code Terminal

[English](#english) | [中文](#中文)

---

# English

## Overview

Claude Code Terminal is a VS Code extension that enables seamless integration with Claude Code and other AI models (Qwen, Kimi) directly within your editor. Launch AI-powered coding assistance with a single click from the editor toolbar.

## Features

- **Multi-AI Model Support**: Claude, Qwen (通义千问), and Kimi (月之暗面)
- **One-Click Access**: Launch AI terminals directly from the editor toolbar
- **Customizable Commands**: Configure custom AI endpoints and commands
- **Flexible UI**: Toggle between color and monochrome icons
- **Multi-language Support**: English and Chinese interface support

## Installation

### From VS Code Marketplace

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Claude Code Terminal"
4. Click Install

### Manual Installation

1. Download the latest `.vsix` file from [releases](https://github.com/maskzh/vscode-extension-claude-code/releases)
2. Open VS Code
3. Run `Extensions: Install from VSIX` command
4. Select the downloaded `.vsix` file

## Usage

### Quick Start

1. **Open any file** in VS Code editor
2. **Click AI model icons** in the editor toolbar:
   - 🟢 **Claude**: Launch Claude Code
   - 🔵 **Qwen**: Launch Qwen Code
   - 🟣 **Kimi**: Launch Kimi Code
   - ⚙️ **Custom**: Launch Custom Code

### Commands

| Command     | Description             | Default Shortcut         |
| ----------- | ----------------------- | ------------------------ |
| `Claude`    | Launch Claude Code      | Editor toolbar icon      |
| `Qwen`      | Launch Qwen Code        | Editor toolbar icon      |
| `Kimi`      | Launch Kimi Code        | Editor toolbar icon      |
| `Custom`    | Launch Custom Code      | Editor toolbar icon      |
| `Configure` | Open extension settings | Editor toolbar gear icon |

### Configuration

Access settings via `File > Preferences > Settings > Extensions > Claude Code Terminal`:

#### Qwen Configuration

- **Base URL**: `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy`
- **Command**: Custom Qwen launch command

#### Kimi Configuration

- **Base URL**: `https://api.moonshot.cn/anthropic`
- **Command**: Custom Kimi launch command

#### Custom Configuration

- **Base URL**: Your custom AI endpoint
- **Command**: Your custom AI launch command

#### UI Settings

- **Use Color Icons**: Toggle between color and monochrome icons

## Development

### Prerequisites

- Node.js 18+
- VS Code 1.102+
- pnpm (recommended) or npm

### Setup

```bash
# Clone repository
git clone https://github.com/maskzh/vscode-extension-claude-code.git
cd vscode-extension-claude-code

# Install dependencies
pnpm install

# Compile TypeScript
pnpm run compile

# Watch for changes during development
pnpm run watch

# Run linting
pnpm run lint

# Package extension
pnpm run package
```

### Debugging

1. Open project in VS Code
2. Press `F5` to open Extension Development Host
3. Test the extension in the new window

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

# 中文

## 概述

Claude Code Terminal 是一个 VS Code 扩展，让您能够直接在编辑器中启动 Claude Code 并使用通义千问、月之暗面等 AI 模型进行交互式编码辅助。

## 功能特性

- **多 AI 模型支持**：Claude、通义千问 (Qwen)、月之暗面 (Kimi)
- **一键访问**：从编辑器工具栏直接启动 AI 终端
- **自定义命令**：配置自定义 Code 端点和命令
- **灵活界面**：彩色和单色图标切换
- **多语言支持**：中英文界面支持

## 安装方式

### 从 VS Code 市场安装

1. 打开 VS Code
2. 进入扩展 (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. 搜索 "Claude Code Terminal"
4. 点击安装

### 手动安装

1. 从 [releases](https://github.com/maskzh/vscode-extension-claude-code/releases) 下载最新的 `.vsix` 文件
2. 打开 VS Code
3. 运行 `Extensions: Install from VSIX` 命令
4. 选择下载的 `.vsix` 文件

## 使用指南

### 快速开始

1. **在 VS Code 中打开任意文件**
2. **点击编辑器工具栏中的 AI 模型图标**:
   - 🟢 **Claude**: 启动 Claude Code
   - 🔵 **通义千问**: 启动 Qwen Code
   - 🟣 **月之暗面**: 启动 Kimi Code
   - ⚙️ **自定义**: 启动自定义 Code

### 命令列表

| 命令       | 描述             | 默认快捷键           |
| ---------- | ---------------- | -------------------- |
| `Claude`   | 启动 Claude Code | 编辑器工具栏图标     |
| `通义千问` | 启动 Qwen Code   | 编辑器工具栏图标     |
| `月之暗面` | 启动 Kimi Code   | 编辑器工具栏图标     |
| `自定义`   | 启动自定义 Code  | 编辑器工具栏图标     |
| `配置`     | 打开扩展设置     | 编辑器工具栏齿轮图标 |

### 配置设置

通过 `文件 > 首选项 > 设置 > 扩展 > Claude Code Terminal` 访问设置：

#### 通义千问配置

- **基础 URL**: `https://dashscope.aliyuncs.com/api/v2/apps/claude-code-proxy`
- **命令**: 自定义 Qwen 启动命令

#### 月之暗面配置

- **基础 URL**: `https://api.moonshot.cn/anthropic`
- **命令**: 自定义 Kimi 启动命令

#### 自定义配置

- **基础 URL**: 您的自定义 Code 端点
- **命令**: 您的自定义 Code 启动命令

#### 界面设置

- **使用彩色图标**: 切换彩色和单色图标

## 开发指南

### 环境要求

- Node.js 18+
- VS Code 1.102+
- pnpm (推荐) 或 npm

### 开发设置

```bash
# 克隆仓库
git clone https://github.com/maskzh/vscode-extension-claude-code.git
cd vscode-extension-claude-code

# 安装依赖
pnpm install

# 编译 TypeScript
pnpm run compile

# 开发时监听文件变化
pnpm run watch

# 运行代码检查
pnpm run lint

# 打包扩展
pnpm run package
```

### 调试方法

1. 在 VS Code 中打开项目
2. 按 `F5` 打开扩展开发主机
3. 在新窗口中测试扩展

## 参与贡献

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m '添加新功能'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

---

## 更新日志

### v0.0.1

- 初始版本发布
- 支持 Claude、Qwen、Kimi Code 模型
- 基础配置功能
- 中英文界面支持
