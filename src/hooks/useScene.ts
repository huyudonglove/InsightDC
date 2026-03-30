import { ref, onMounted, onUnmounted, type Ref, shallowRef } from 'vue';
import { SceneController } from '@/modules/SceneController';
import { DataCenterManager, type RackInfo } from '@/modules/DataCenterManager';
import { RackStatusManager } from '@/modules/RackStatusManager';
import { HeatmapManager } from '@/modules/HeatmapManager';
import { PowerVisualizer } from '@/modules/PowerVisualizer';
import type { RackDetail } from '@/types/rack';
import { getRackDetail, getRackTemperature, getRackPower } from '@/services/rackService';

export type VizMode = 'normal' | 'temperature' | 'power';

export interface UseSceneOptions {
  onRackHover?: (rack: RackInfo | null, mouseEvent?: MouseEvent) => void;
  onRackClick?: (rack: RackInfo | null, detail: RackDetail | null) => void;
  onStatsUpdate?: (stats: { total: number; normal: number; warning: number; critical: number }) => void;
}

export interface UseSceneReturn {
  containerRef: Ref<HTMLDivElement | null>;
  isReady: Ref<boolean>;
  hoveredRack: Ref<RackInfo | null>;
  selectedRack: Ref<RackInfo | null>;
  selectedRackDetail: Ref<RackDetail | null>;
  mouseEvent: Ref<MouseEvent | undefined>;
  currentMode: Ref<VizMode>;
  setVizMode: (mode: VizMode) => void;
  resetCamera: () => void;
}

/**
 * useScene Hook - Vue 与 3D 场景的桥梁
 * 职责：连接 Vue 组件和 DataCenterManager，管理生命周期
 */
export function useScene(options: UseSceneOptions = {}): UseSceneReturn {
  const containerRef = ref<HTMLDivElement | null>(null);
  const isReady = ref(false);
  const hoveredRack = ref<RackInfo | null>(null);
  const selectedRack = ref<RackInfo | null>(null);
  const selectedRackDetail = ref<RackDetail | null>(null);
  const mouseEvent = shallowRef<MouseEvent | undefined>(undefined);

  let controller: SceneController | null = null;
  let manager: DataCenterManager | null = null;

  onMounted(async () => {
    if (!containerRef.value) return;

    // 创建场景控制器
    controller = new SceneController('three');

    // 创建数据中心管理器，传入事件回调
    manager = new DataCenterManager(controller, {
      onRackHover: (rack) => {
        hoveredRack.value = rack;
        mouseEvent.value = controller?.getMouseEvent();
        options.onRackHover?.(rack, mouseEvent.value);
      },
      onRackClick: async (rack) => {
        if (!rack) {
          // 取消选中
          selectedRack.value = null;
          selectedRackDetail.value = null;
          options.onRackClick?.(null, null);
          return;
        }
        selectedRack.value = rack;
        // 获取机柜详情
        const detail = await getRackDetail(rack.name);
        selectedRackDetail.value = detail;
        options.onRackClick?.(rack, detail);
      },
    });

    // 初始化场景
    await manager.init();
    isReady.value = true;
    
    // 场景初始化完成后再启动状态管理器
    statusManager = new RackStatusManager(manager, {
      onStatusUpdate: () => {
        const stats = statusManager?.getStatistics();
        if (stats) {
          options.onStatsUpdate?.(stats);
        }
      },
    });
    statusManager.start();
  });

  // 创建状态管理器
  let statusManager: RackStatusManager | null = null;
  
  // 热力图管理器
  let heatmapManager: HeatmapManager | null = null;
  
  // 功耗可视化管理器
  let powerVisualizer: PowerVisualizer | null = null;

  onUnmounted(() => {
    statusManager?.stop();
    statusManager = null;
    heatmapManager?.clear();
    heatmapManager = null;
    powerVisualizer?.deactivate();
    powerVisualizer = null;
    manager = null;
    controller?.destroy();
    controller = null;
  });

  // 可视化模式
  const currentMode = ref<VizMode>('normal');

  // 显示温度热力图
  const showTemperatureHeatmap = async () => {
    if (!manager) return;
    
    const scene = manager.getScene();
    if (!scene) return;
    
    // 创建热力图管理器
    if (!heatmapManager) {
      heatmapManager = new HeatmapManager(scene);
    }
    
    // 获取所有机柜并添加温度指示器
    const racks = manager.getRackList();
    for (const rack of racks) {
      const temperature = await getRackTemperature(rack.name);
      heatmapManager.addTemperatureIndicator(rack, temperature);
    }
  };
  
  // 隐藏热力图
  const hideTemperatureHeatmap = () => {
    heatmapManager?.clear();
  };
  
  // 显示功耗可视化
  const showPowerVisualization = async () => {
    if (!manager) return;
    
    const scene = manager.getScene();
    if (!scene) return;
    
    // 创建功耗可视化管理器
    if (!powerVisualizer) {
      powerVisualizer = new PowerVisualizer(scene);
    }
    
    // 获取所有机柜的功率数据
    const racks = manager.getRackList();
    const powerData = new Map();
    
    for (const rack of racks) {
      const { power, maxPower } = await getRackPower(rack.name);
      powerData.set(rack.name, { rackName: rack.name, power, maxPower });
    }
    
    powerVisualizer.activate(racks, powerData);
  };
  
  // 隐藏功耗可视化
  const hidePowerVisualization = () => {
    powerVisualizer?.deactivate();
  };

  const setVizMode = (mode: VizMode) => {
    currentMode.value = mode;
    
    // 先清理所有可视化效果
    hideTemperatureHeatmap();
    hidePowerVisualization();
    
    // 根据模式显示对应效果
    if (mode === 'temperature') {
      showTemperatureHeatmap();
    } else if (mode === 'power') {
      showPowerVisualization();
    }
    
    console.log('切换可视化模式:', mode);
  };

  const resetCamera = () => {
    controller?.resetCamera();
  };

  return {
    containerRef,
    isReady,
    hoveredRack,
    selectedRack,
    selectedRackDetail,
    mouseEvent,
    currentMode,
    setVizMode,
    resetCamera,
  };
}
