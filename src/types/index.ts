/** 终端命令配置接口 */
export interface TerminalCommand {
  /** 命令ID */
  id: string;
  /** 显示名称 */
  title: string;
  /** 是否启用 */
  enabled: boolean;
  /** 排序权重 */
  order: number;
}

/** 扩展状态接口 */
export interface ExtensionState {
  /** 活跃的终端命令列表 */
  activeCommands: TerminalCommand[];
  /** 当前显示的图标数量 */
  visibleIconCount: number;
}
