import * as THREE from 'three';

export interface TemperatureData {
  rackName: string;
  temperature: number; // 摄氏度
}

/**
 * 热力图管理器 - 在机柜顶部显示温度色块
 */
export class HeatmapManager {
  private scene: THREE.Scene;
  private heatmapMeshes: Map<string, THREE.Mesh> = new Map();
  private readonly MAX_TEMP = 80; // 最高温度
  private readonly MIN_TEMP = 20; // 最低温度

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * 为指定机柜添加温度指示器
   */
  addTemperatureIndicator(rack: THREE.Object3D, temperature: number): void {
    // 如果已存在，先移除
    this.removeIndicator(rack.name);

    // 计算机柜顶部位置
    const box = new THREE.Box3().setFromObject(rack);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // 创建温度指示器（放在机柜顶部）
    const geometry = new THREE.PlaneGeometry(size.x * 0.8, size.z * 0.8);
    const color = this.getTemperatureColor(temperature);
    
    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2; // 水平放置
    mesh.position.set(center.x, box.max.y + 0.05, center.z);
    mesh.name = `heatmap_${rack.name}`;

    this.scene.add(mesh);
    this.heatmapMeshes.set(rack.name, mesh);

    // 不显示温度文字，避免层叠
    // this.addTemperatureLabel(rack, temperature, center, box.max.y + 0.1);
  }

  /**
   * 更新机柜温度
   */
  updateTemperature(rackName: string, temperature: number): void {
    const mesh = this.heatmapMeshes.get(rackName);
    if (mesh) {
      const material = mesh.material as THREE.MeshBasicMaterial;
      material.color.setHex(this.getTemperatureColor(temperature));
    }
  }

  /**
   * 移除温度指示器
   */
  removeIndicator(rackName: string): void {
    const mesh = this.heatmapMeshes.get(rackName);
    if (mesh) {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      this.heatmapMeshes.delete(rackName);
    }

    // 移除文字标签
    const label = this.scene.getObjectByName(`heatmap_label_${rackName}`);
    if (label) {
      this.scene.remove(label);
    }
  }

  /**
   * 显示/隐藏所有热力图
   */
  setVisible(visible: boolean): void {
    this.heatmapMeshes.forEach((mesh) => {
      mesh.visible = visible;
    });
  }

  /**
   * 清除所有热力图
   */
  clear(): void {
    this.heatmapMeshes.forEach((mesh, rackName) => {
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
      
      // 移除文字标签
      const label = this.scene.getObjectByName(`heatmap_label_${rackName}`);
      if (label) {
        this.scene.remove(label);
      }
    });
    this.heatmapMeshes.clear();
  }

  /**
   * 根据温度获取颜色
   * 蓝(低温) -> 绿 -> 黄 -> 红(高温)
   */
  private getTemperatureColor(temp: number): number {
    const normalized = Math.max(0, Math.min(1, (temp - this.MIN_TEMP) / (this.MAX_TEMP - this.MIN_TEMP)));
    
    // 使用 HSL 色彩空间，从蓝色(240°)到红色(0°)
    const hue = (1 - normalized) * 240 / 360;
    const color = new THREE.Color().setHSL(hue, 1, 0.5);
    return color.getHex();
  }

  /**
   * 添加温度文字标签
   */
  private addTemperatureLabel(
    rack: THREE.Object3D,
    temperature: number,
    center: THREE.Vector3,
    y: number
  ): void {
    // 使用 Canvas 创建文字纹理
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, 128, 64);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${temperature}°C`, 64, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(material);
    
    sprite.position.set(center.x, y + 0.5, center.z);
    sprite.scale.set(0.8, 0.4, 1);
    sprite.name = `heatmap_label_${rack.name}`;

    this.scene.add(sprite);
  }
}
