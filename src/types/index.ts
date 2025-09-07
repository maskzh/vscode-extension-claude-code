export type ServiceType =
  | 'qwen'
  | 'kimi'
  | 'deepseek'
  | 'zhipu'
  | 'copilot'
  | 'custom';

export interface TerminalCommand {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}
