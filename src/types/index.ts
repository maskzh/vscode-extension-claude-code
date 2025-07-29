export interface TerminalCommand {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export interface ExtensionState {
  activeCommands: TerminalCommand[];
  visibleIconCount: number;
}
