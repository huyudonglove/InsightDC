/**
 * 机柜详情类型定义
 */

export interface ServerInfo {
  id: string;
  name: string;
  status: 'running' | 'warning' | 'error' | 'offline';
  uptime: string;
  cpuUsage: number;
  memoryUsage: number;
  temperature: number;
}

export interface RackDetail {
  name: string;
  status: 'normal' | 'warning' | 'critical';
  temperature: number;
  temperatureThreshold: number;
  power: number;
  powerCapacity: number;
  utilization: number;
  totalU: number;
  usedU: number;
  servers: ServerInfo[];
  lastUpdated: string;
}

export type RackStatus = 'normal' | 'warning' | 'critical';

export const statusTextMap: Record<RackStatus, string> = {
  normal: '正常运行',
  warning: '警告',
  critical: '紧急',
};

export const statusColorMap: Record<RackStatus, string> = {
  normal: '#52c41a',
  warning: '#faad14',
  critical: '#f5222d',
};

export const serverStatusTextMap: Record<ServerInfo['status'], string> = {
  running: '运行中',
  warning: '警告',
  error: '故障',
  offline: '离线',
};
