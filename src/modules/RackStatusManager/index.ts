import type { DataCenterManager } from '@/modules/DataCenterManager';
import type { RackStatus } from '@/types/rack';
import { updateRackMetrics } from '@/services/rackService';

export interface RackStatusInfo {
  name: string;
  status: RackStatus;
  temperature: number;
  power: number;
}

export interface StatusManagerEvents {
  onStatusUpdate?: (racks: RackStatusInfo[]) => void;
}

/**
 * 机柜状态管理器
 * 职责：定时更新所有机柜状态，并同步到 3D 视图
 */
export class RackStatusManager {
  private dataCenterManager: DataCenterManager;
  private events: StatusManagerEvents;
  private updateInterval: number | null = null;
  private rackStatuses: Map<string, RackStatusInfo> = new Map();
  private readonly UPDATE_INTERVAL = 5000; // 5秒更新一次

  constructor(dataCenterManager: DataCenterManager, events: StatusManagerEvents = {}) {
    this.dataCenterManager = dataCenterManager;
    this.events = events;
  }

  /**
   * 开始定时更新
   */
  start(): void {
    // 立即执行一次
    this.updateAllRacks();
    
    // 定时更新
    this.updateInterval = window.setInterval(() => {
      this.updateAllRacks();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * 停止定时更新
   */
  stop(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * 更新所有机柜状态
   */
  private async updateAllRacks(): Promise<void> {
    const rackInfos = this.dataCenterManager.getRackInfos();
    
    // 如果机柜列表为空，跳过本次更新
    if (rackInfos.length === 0) {
      console.log('[RackStatusManager] 机柜列表为空，等待加载...');
      return;
    }
    
    const updatedRacks: RackStatusInfo[] = [];

    for (const rack of rackInfos) {
      // 获取更新后的数据
      const metrics = await updateRackMetrics(rack.name);
      
      const statusInfo: RackStatusInfo = {
        name: rack.name,
        status: metrics.status || 'normal',
        temperature: metrics.temperature || 25,
        power: metrics.power || 0,
      };

      // 保存状态
      this.rackStatuses.set(rack.name, statusInfo);
      updatedRacks.push(statusInfo);

      // 更新 3D 视图颜色
      this.dataCenterManager.setRackColor(rack.name, statusInfo.status);
    }

    // 触发状态更新事件
    this.events.onStatusUpdate?.(updatedRacks);
  }

  /**
   * 获取所有机柜状态
   */
  getAllStatuses(): RackStatusInfo[] {
    return Array.from(this.rackStatuses.values());
  }

  /**
   * 获取统计信息
   */
  getStatistics(): { total: number; normal: number; warning: number; critical: number } {
    const statuses = this.getAllStatuses();
    return {
      total: statuses.length,
      normal: statuses.filter((s) => s.status === 'normal').length,
      warning: statuses.filter((s) => s.status === 'warning').length,
      critical: statuses.filter((s) => s.status === 'critical').length,
    };
  }

  /**
   * 获取指定机柜状态
   */
  getRackStatus(rackName: string): RackStatusInfo | undefined {
    return this.rackStatuses.get(rackName);
  }
}
