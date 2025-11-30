module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 自定义规则（可选）
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复 bug
        'docs',     // 文档更新
        'style',    // 代码格式化
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试
        'chore',    // 构建过程或辅助工具的变动
        'build',    // 构建系统
        'ci',       // CI 配置
        'revert'    // 回滚
      ]
    ],
    'subject-max-length': [2, 'always', 72], // 主题行最大长度
    'body-max-line-length': [2, 'always', 100] // 消息体最大长度
  }
};