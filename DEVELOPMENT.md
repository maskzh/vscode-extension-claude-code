# 开发指南

## 项目介绍

这是一个 VS Code 扩展，提供快速访问多个 Anthropic 兼容 AI 终端的集成。

## 开发流程

### 1. 常规开发

```bash
# 克隆项目
git clone https://github.com/maskzh/vscode-extension-claude-code.git
cd vscode-extension-claude-code

# 安装依赖
npm install

# 初始化 git hooks
npm run prepare  # 或 npx husky install

# 开发模式 - 编译并监听文件变化
npm run watch
```

### 2. 提交代码

使用 Conventional Commits 格式提交代码：

```bash
# 新功能
git commit -m "feat: 添加新的 AI 服务支持"

# 修复 bug
git commit -m "fix: 解决终端初始化失败问题"

# 文档更新
git commit -m "docs: 更新 README 安装说明"

# 代码格式化
git commit -m "style: 格式化代码"

# 重构
git commit -m "refactor: 重构配置管理模块"

# 性能优化
git commit -m "perf: 优化终端启动速度"

# 测试
git commit -m "test: 添加配置管理单元测试"

# 构建工具相关
git commit -m "build: 更新构建脚本"

# CI 相关
git commit -m "ci: 优化 GitHub Actions 配置"

# 其他维护任务
git commit -m "chore: 更新依赖版本"
```

### 3. 发布新版本

#### 自动发布（推荐）

```bash
# 1. 确保所有代码已提交并推送到远程仓库
git push origin main

# 2. 运行发布命令（自动分析 commits，确定版本号）
npm run release

# 3. 推送 tag（自动触发发布流程）
git push --follow-tags origin main
```

#### 手动指定版本号

```bash
# 补丁版本 (0.0.3 -> 0.0.4)
npm run release:patch

# 次要版本 (0.0.3 -> 0.1.0)
npm run release:minor

# 主要版本 (0.0.3 -> 1.0.0)
npm run release:major

# 预览发布效果（不实际修改文件）
npm run release:dry
```

### 4. 测试和构建

```bash
# 运行 lint 和代码检查
npm run lint

# 运行测试
npm test

# 编译 TypeScript
npm run compile

# 打包扩展
npm run package
```

## 项目结构

```
vscode-extension-claude-code/
├── src/                    # 源代码
│   ├── extension.ts       # 扩展入口点
│   ├── terminal-manager.ts # 终端管理
│   ├── config-manager.ts  # 配置管理
│   ├── types.ts           # 类型定义
│   ├── constants.ts       # 常量定义
│   └── utils/
│       └── i18n.ts        # 国际化支持
├── .github/workflows/     # GitHub Actions
│   └── release.yml        # 发布工作流
├── .husky/               # Git hooks
│   ├── pre-commit       # 提交前检查
│   └── commit-msg       # 消息格式验证
├── icons/               # 扩展图标
├── package.json         # 扩展配置
├── commitlint.config.js # 提交消息验证
├── .versionrc.json      # 版本管理配置
└── DEVELOPMENT.md       # 开发指南
```

## Git Hooks

- **pre-commit**: 在提交前运行 lint 和测试
- **commit-msg**: 验证提交消息格式

## 版本管理

项目使用 `standard-version` 进行自动化版本管理：

- 根据 commit 类型自动确定版本号
- 自动生成 CHANGELOG.md
- 自动更新 package.json 版本
- 创建 git tag

## 发布流程

1. **开发阶段**: 使用 conventional commit 格式提交代码
2. **发布准备**: 运行 `npm run release` 生成版本和 changelog
3. **触发发布**: 推送 tag 到远程仓库
4. **自动发布**: GitHub Actions 自动构建和发布到各平台

## 调试

```bash
# 打开项目文件夹
code .

# 按 F5 启动 Extension Development Host
# 在新窗口中测试扩展功能
```

## 配置说明

扩展支持以下 AI 服务：

- **Qwen**: 阿里云通义千问
- **Kimi**: Moonshot AI
- **DeepSeek**: DeepSeek AI
- **Zhipu**: 智谱 AI
- **Minimax**: MiniMax AI
- **GitHub Copilot**: GitHub 官方
- **Custom**: 自定义服务

每个服务都需要配置相应的 API 密钥和基础 URL。