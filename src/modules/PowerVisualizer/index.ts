import * as THREE from 'three';

export interface PowerData {
  rackName: string;
  power: number; // 功率 (kW)
  maxPower: number; // 最大功率 (kW)
}

/**
 * 功耗可视化管理器 - 用机柜高度表示功率负载
 */
export class PowerVisualizer {
  private scene: THREE.Scene;
  private powerBars: Map<string, THREE.Mesh> = new Map();
  private originalScales: Map<string, THREE.Vector3> = new Map();
  private isActive = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 激活功耗可视化模式
   */
  activate(racks: THREE.Object3D[], powerData: Map<string, PowerData>): void {
    if (this.isActive) return;
    this.isActive = true;

    racks.forEach((rack) => {
      const data = powerData.get(rack.name);
      if (data) {
        this.createPowerBar(rack, data);
      }
    });
  }

  /**
   * 关闭功耗可视化模式
   */
  deactivate(): void {
    if (!this.isActive) return;
    this.isActive = false;

    // 恢复原始高度
    this.powerBars.forEach((bar) => {
      this.scene.remove(bar);
      bar.geometry.dispose();
      (bar.material as THREE.Material).dispose();
    });
    this.powerBars.clear();
  }

  /**
   * 创建功率指示条
   */
  private createPowerBar(rack: THREE.Object3D, data: PowerData): void {
    const box = new THREE.Box3().setFromObject(rack);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 计算负载比例
    const loadRatio = Math.min(1, data.power / data.maxPower);
    
    // 根据负载选择颜色
    const color = this.getLoadColor(loadRatio);

    // 创建功率条（在机柜旁边）
    const geometry = new THREE.BoxGeometry(0.1, size.y * loadRatio, size.z * 0.8);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.8,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      box.max.x + 0.2, // 放在机柜右侧
      box.min.y + (size.y * loadRatio) / 2,
      center.z
    );
    mesh.name = `power_${rack.name}`;

    this.scene.add(mesh);
    this.powerBars.set(rack.name, mesh);

    // 添加功率文字
    this.addPowerLabel(rack, data, box.max.x + 0.5, box.max.y + 0.3, center.z);
  }

  /**
   * 更新功率数据
   */
  updatePower(rackName: string, power: number, maxPower: number): void {
    const bar = this.powerBars.get(rackName);
    if (!bar) return;

    const loadRatio = Math.min(1, power / maxPower);
    const color = this.getLoadColor(loadRatio);

    // 获取原始尺寸
    const boxGeometry = bar.geometry as THREE.BoxGeometry;
    const originalHeight = boxGeometry.parameters.height;
    const originalDepth = boxGeometry.parameters.depth;

    // 更新高度和颜色
    const newGeometry = new THREE.BoxGeometry(0.1, originalHeight * loadRatio, originalDepth);
    bar.geometry.dispose();
    bar.geometry = newGeometry;
    (bar.material as THREE.MeshBasicMaterial).color.setHex(color);

    // 更新位置
    bar.position.y = bar.position.y - (originalHeight * (1 - loadRatio)) / 2;
  }

  /**
   * 根据负载比例获取颜色
   */
  private getLoadColor(ratio: number): number {
    if (ratio < 0.5) return 0x52c41a; // 绿色 - 低负载
    if (ratio < 0.8) return 0xfaad14; // 黄色 - 中负载
    return 0xf5222d; // 红色 - 高负载
  }

  /**
   * 添加功率文字标签
   */
  private addPowerLabel(
    rack: THREE.Object3D,
    data: PowerData,
    x: number,
    y: number,
    z: number
  ): void {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(0, 0, 128, 64);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${data.power}kW`, 64, 24);
    
    ctx.font = '16px Arial';
    ctx.fillStyle = '#cccccc';
    ctx.fillText(`${Math.round((data.power / data.maxPower) * 100)}%`, 64, 48);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);

    sprite.position.set(x, y, z);
    sprite.scale.set(0.6, 0.3, 1);
    sprite.name = `power_label_${rack.name}`;

    this.scene.add(sprite);
  }

  /**
   * 清除所有标签
   */
  clearLabels(): void {
    this.powerBars.forEach((_, rackName) => {
      const label = this.scene.getObjectByName(`power_label_${rackName}`);
      if (label) {
        this.scene.remove(label);
      }
    });
  }
}
