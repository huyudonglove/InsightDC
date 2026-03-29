import * as THREE from 'three';
import gsap from 'gsap';
import type { SceneController, LoadedModel } from '@/modules/SceneController';
import type { Animate } from '@/modules/Viewer';
import { checkNameIncludes, findParent } from '@/utils';
import type { RackStatus } from '@/types/rack';

export interface RackInfo {
  name: string;
  object: THREE.Object3D;
  position: {
    x: number;
    y: number;
    z: number;
  };
  status?: RackStatus;
}

export interface DataCenterEvents {
  onRackHover?: (rack: RackInfo | null) => void;
  onRackClick?: (rack: RackInfo) => void;
  onRackStatusChange?: (racks: RackInfo[]) => void;
}

/**
 * 数据中心管理器 - 机房业务逻辑层
 * 职责：处理机柜查找、高亮、选中动画等业务逻辑
 */
export class DataCenterManager {
  private controller: SceneController;
  private events: DataCenterEvents;
  private rackList: THREE.Object3D[] = [];
  private hoveredRack: THREE.Object3D | null = null;
  private selectedRack: THREE.Object3D | null = null;
  private dataCenterModel: LoadedModel | null = null;

  // 动画相关
  private originalModel: THREE.Group | null = null;

  constructor(controller: SceneController, events: DataCenterEvents = {}) {
    this.controller = controller;
    this.events = events;
  }

  /**
   * 初始化数据中心场景
   */
  async init(): Promise<void> {
    // 加载地面
    await this.loadPlane();

    // 加载机房
    await this.loadDataCenter();

    // 绑定射线事件
    this.bindRaycasterEvents();
  }

  /**
   * 加载地面模型
   */
  private async loadPlane(): Promise<void> {
    const model = await this.controller.loadModel(
      '/models/plane.glb',
      'plane',
      {
        scale: [0.0003, 0.0003, 0.0003],
        position: [0, 0, 0],
      }
    );

    // 添加地面纹理动画
    const texture = (model.scene.children[0] as THREE.Mesh)?.material;
    if (texture && (texture as THREE.MeshStandardMaterial).map) {
      const map = (texture as THREE.MeshStandardMaterial).map;
      if (map) {
        map.wrapS = THREE.RepeatWrapping;
        map.wrapT = THREE.RepeatWrapping;

        const animate: Animate = {
          fun: () => {
            if (map.repeat.y <= 10) {
              map.repeat.x += 0.01;
              map.repeat.y += 0.02;
            } else {
              map.repeat.x = 0;
              map.repeat.y = 0;
            }
          },
          content: null,
        };
        this.controller.addAnimate(animate);
      }
    }
  }

  /**
   * 加载机房模型
   */
  private async loadDataCenter(): Promise<void> {
    this.dataCenterModel = await this.controller.loadModel(
      '/models/datacenter.glb',
      'datacenter',
      {
        scale: 0.2,
        position: [0, 0, 0],
      }
    );

    // 保存原始模型用于恢复
    this.originalModel = this.dataCenterModel.scene.clone();

    // 收集所有机柜
    this.rackList = this.controller.findObjects('datacenter', this.isRack);

    // 设置射线检测目标
    this.controller.setRaycasterObjects(this.rackList);
  }

  /**
   * 绑定射线检测事件
   */
  private bindRaycasterEvents(): void {
    // 鼠标移动 - 悬停效果
    this.controller.onRaycaster('mousemove', (intersects) => {
      if (!intersects.length) {
        this.handleRackLeave();
        return;
      }

      const rack = this.findRackFromIntersect(intersects[0].object);
      if (rack) {
        this.handleRackHover(rack);
      } else {
        this.handleRackLeave();
      }
    });

    // 点击事件
    this.controller.onRaycaster('click', (intersects) => {
      if (!intersects.length) {
        // 点击空白区，清空选中状态
        this.handleRackDeselect();
        return;
      }

      const rack = this.findRackFromIntersect(intersects[0].object);
      if (rack) {
        this.handleRackClick(rack);
      } else {
        // 点击到模型但不是机柜，也清空选中
        this.handleRackDeselect();
      }
    });
  }

  /**
   * 处理机柜悬停
   */
  private handleRackHover(rack: THREE.Object3D): void {
    if (this.hoveredRack === rack) return;

    this.hoveredRack = rack;
    this.controller.setBoxHelper(rack);

    this.events.onRackHover?.({
      name: rack.name,
      object: rack,
      position: {
        x: rack.position.x,
        y: rack.position.y,
        z: rack.position.z,
      },
    });
  }

  /**
   * 处理鼠标离开机柜
   */
  private handleRackLeave(): void {
    this.hoveredRack = null;
    this.controller.setBoxHelper(null);

    // 始终触发事件，确保 Popover 关闭
    this.events.onRackHover?.(null);
  }

  /**
   * 处理机柜点击
   */
  private handleRackClick(rack: THREE.Object3D): void {
    this.selectedRack = rack;

    // 相机聚焦到该机柜
    this.controller.focusOn(rack, [1.5, 1.5, 1.5], 1.2);

    this.events.onRackClick?.({
      name: rack.name,
      object: rack,
      position: {
        x: rack.position.x,
        y: rack.position.y,
        z: rack.position.z,
      },
    });

    // 播放点击动画效果
    this.playClickAnimation(rack);
  }

  /**
   * 处理取消选中机柜
   */
  private handleRackDeselect(): void {
    if (!this.selectedRack) return;

    this.selectedRack = null;
    this.controller.setBoxHelper(null);

    // 通知 UI 清空详情
    this.events.onRackClick?.(null as any);
  }

  /**
   * 播放点击动画
   */
  private playClickAnimation(rack: THREE.Object3D): void {
    // 简单的缩放动画示例
    const originalScale = rack.scale.clone();

    gsap.to(rack.scale, {
      x: originalScale.x * 1.05,
      y: originalScale.y * 1.05,
      z: originalScale.z * 1.05,
      duration: 0.15,
      yoyo: true,
      repeat: 1,
      ease: 'power1.inOut',
    });
  }

  /**
   * 从相交对象查找机柜
   */
  private findRackFromIntersect(object: THREE.Object3D): THREE.Object3D | null {
    return findParent(object, this.isRack);
  }

  /**
   * 判断是否为机柜
   */
  private isRack = (obj: THREE.Object3D): boolean => {
    return checkNameIncludes(obj, 'rack');
  };

  /**
   * 获取所有机柜列表
   */
  getRackList(): THREE.Object3D[] {
    return this.rackList;
  }

  /**
   * 获取当前悬停的机柜
   */
  getHoveredRack(): RackInfo | null {
    if (!this.hoveredRack) return null;
    return {
      name: this.hoveredRack.name,
      object: this.hoveredRack,
      position: {
        x: this.hoveredRack.position.x,
        y: this.hoveredRack.position.y,
        z: this.hoveredRack.position.z,
      },
    };
  }

  /**
   * 获取当前选中的机柜
   */
  getSelectedRack(): RackInfo | null {
    if (!this.selectedRack) return null;
    return {
      name: this.selectedRack.name,
      object: this.selectedRack,
      position: {
        x: this.selectedRack.position.x,
        y: this.selectedRack.position.y,
        z: this.selectedRack.position.z,
      },
    };
  }

  /**
   * 高亮指定机柜
   */
  highlightRack(rackName: string): void {
    const rack = this.rackList.find((r) => r.name === rackName);
    if (rack) {
      this.controller.setBoxHelper(rack);
    }
  }

  /**
   * 取消高亮
   */
  clearHighlight(): void {
    this.controller.setBoxHelper(null);
  }

  /**
   * 设置机柜颜色（根据状态）
   * 正常状态保持原色，只有警告和紧急才变色
   */
  setRackColor(rackName: string, status: RackStatus): void {
    const rack = this.rackList.find((r) => r.name === rackName);
    if (!rack) return;

    // 正常状态恢复原始颜色
    if (status === 'normal') {
      this.resetRackColor(rackName);
      return;
    }

    const colorMap: Record<RackStatus, number> = {
      normal: 0x52c41a,   // 绿色
      warning: 0xfaad14,  // 黄色
      critical: 0xf5222d, // 红色
    };

    rack.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // 保存原始材质
        if (!(mesh.userData as any).originalMaterial) {
          (mesh.userData as any).originalMaterial = mesh.material;
        }
        
        // 创建新材质
        const newMaterial = new THREE.MeshPhongMaterial({
          color: colorMap[status],
          transparent: true,
          opacity: 0.8,
          emissive: colorMap[status],
          emissiveIntensity: 0.2,
        });
        
        mesh.material = newMaterial;

        // 紧急状态添加闪烁动画
        if (status === 'critical') {
          this.startAlertAnimation(mesh);
        }
      }
    });
  }

  /**
   * 启动告警闪烁动画
   */
  private startAlertAnimation(mesh: THREE.Mesh): void {
    // 保存动画引用以便后续停止
    if (!(mesh.userData as any).alertAnimation) {
      (mesh.userData as any).alertAnimation = null;
    }

    // 使用 GSAP 创建脉冲动画
    const material = mesh.material as THREE.MeshPhongMaterial;

    (mesh.userData as any).alertAnimation = gsap.to(material, {
      emissiveIntensity: 0.8,
      duration: 0.5,
      yoyo: true,
      repeat: -1,
      ease: 'power1.inOut',
    });
  }

  /**
   * 停止告警动画
   */
  private stopAlertAnimation(mesh: THREE.Mesh): void {
    const animation = (mesh.userData as any).alertAnimation;
    if (animation) {
      animation.kill();
      (mesh.userData as any).alertAnimation = null;
    }
    // 恢复原始发光强度
    const material = mesh.material as THREE.MeshPhongMaterial;
    if (material) {
      material.emissiveIntensity = 0.2;
    }
  }

  /**
   * 重置机柜颜色
   */
  resetRackColor(rackName: string): void {
    const rack = this.rackList.find((r) => r.name === rackName);
    if (!rack) return;

    rack.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        // 停止告警动画
        this.stopAlertAnimation(mesh);
        // 恢复原始材质
        const originalMaterial = (mesh.userData as any).originalMaterial;
        if (originalMaterial) {
          mesh.material = originalMaterial;
        }
      }
    });
  }

  /**
   * 获取所有机柜信息（带状态）
   */
  getRackInfos(): RackInfo[] {
    return this.rackList.map((rack) => ({
      name: rack.name,
      object: rack,
      position: {
        x: rack.position.x,
        y: rack.position.y,
        z: rack.position.z,
      },
    }));
  }
}
