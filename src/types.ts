import { SERVICE_TYPES } from './constants';

export type ServiceType = (typeof SERVICE_TYPES)[number];

export interface TerminalCommand {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

export type ServiceConfig = {
  displayName: string;
  secretKey: string;
  defaultCommand: string;
};
