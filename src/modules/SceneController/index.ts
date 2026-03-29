import * as THREE from 'three';
import gsap from 'gsap';
import Viewer, { type Animate } from '@/modules/Viewer';
import ModelLoader from '@/modules/ModelLoder';
import BoxHelperWrap from '@/modules/BoxHelperWrap';
import Event from '@/modules/Viewer/Events';
import type BaseModel from '@/modules/BaseModel';

export interface LoadedModel {
  name: string;
  baseModel: BaseModel;
  scene: THREE.Group;
}

export type RaycasterCallback = (intersects: THREE.Intersection[]) => void;

/**
 * 场景控制器 - 封装纯 3D 层逻辑
 * 职责：初始化场景、加载模型、管理射线交互
 */
export class SceneController {
  private viewer!: Viewer;
  private modelLoader!: ModelLoader;
  private boxHelper!: BoxHelperWrap;
  private loadedModels: Map<string, LoadedModel> = new Map();
  private raycasterCallbacks: {
    click?: RaycasterCallback;
    dblclick?: RaycasterCallback;
    mousemove?: RaycasterCallback;
  } = {};

  constructor(containerId: string) {
    this.init(containerId);
  }

  private init(containerId: string): void {
    this.viewer = new Viewer(containerId);
    this.viewer.initRaycaster();
    this.modelLoader = new ModelLoader(this.viewer);
    this.boxHelper = new BoxHelperWrap(this.viewer);

    this.bindEvents();
  }

  private bindEvents(): void {
    this.viewer.emitter.on(Event.click.raycaster, (list: THREE.Intersection[]) => {
      this.raycasterCallbacks.click?.(list);
    });

    this.viewer.emitter.on(Event.dblclick.raycaster, (list: THREE.Intersection[]) => {
      this.raycasterCallbacks.dblclick?.(list);
    });

    this.viewer.emitter.on(Event.mousemove.raycaster, (list: THREE.Intersection[]) => {
      this.raycasterCallbacks.mousemove?.(list);
    });
  }

  /**
   * 加载模型到场景
   */
  async loadModel(url: string, name: string, options?: {
    scale?: number | [number, number, number];
    position?: [number, number, number];
    rotation?: [number, number, number];
  }): Promise<LoadedModel> {
    return new Promise((resolve) => {
      this.modelLoader.loadModelToScene(url, (baseModel) => {
        const scene = baseModel.gltf.scene;

        // 应用配置
        if (options?.scale) {
          if (Array.isArray(options.scale)) {
            scene.scale.set(...options.scale);
          } else {
            baseModel.setScalc(options.scale);
          }
        }

        if (options?.position) {
          scene.position.set(...options.position);
        }

        if (options?.rotation) {
          scene.rotation.set(...options.rotation);
        }

        scene.name = name;
        baseModel.openCastShadow();

        const model: LoadedModel = { name, baseModel, scene };
        this.loadedModels.set(name, model);
        resolve(model);
      });
    });
  }

  /**
   * 获取已加载的模型
   */
  getModel(name: string): LoadedModel | undefined {
    return this.loadedModels.get(name);
  }

  /**
   * 获取所有模型
   */
  getAllModels(): LoadedModel[] {
    return Array.from(this.loadedModels.values());
  }

  /**
   * 设置射线检测目标对象
   */
  setRaycasterObjects(objects: THREE.Object3D[]): void {
    this.viewer.setRaycasterObjects(objects);
  }

  /**
   * 注册射线检测回调
   */
  onRaycaster(event: 'click' | 'dblclick' | 'mousemove', callback: RaycasterCallback): void {
    this.raycasterCallbacks[event] = callback;
  }

  /**
   * 显示/隐藏选中框
   */
  setBoxHelper(object: THREE.Object3D | null): void {
    if (object) {
      this.boxHelper.attach(object);
      this.boxHelper.setVisible(true);
    } else {
      this.boxHelper.setVisible(false);
    }
  }

  /**
   * 添加动画
   */
  addAnimate(animate: Animate): void {
    this.viewer.addAnimate(animate);
  }

  /**
   * 获取模型中符合条件的对象列表
   */
  findObjects(modelName: string, predicate: (obj: THREE.Object3D) => boolean): THREE.Object3D[] {
    const model = this.loadedModels.get(modelName);
    if (!model) return [];

    const result: THREE.Object3D[] = [];
    model.scene.traverse((obj) => {
      if (predicate(obj)) {
        result.push(obj);
      }
    });
    return result;
  }

  /**
   * 克隆模型
   */
  cloneModel(name: string, newName: string, position?: [number, number, number]): LoadedModel | null {
    const model = this.loadedModels.get(name);
    if (!model) return null;

    const clonedBaseModel = model.baseModel.cloneModel(position || [0, 0, 0]);
    const clonedScene = clonedBaseModel.gltf.scene as THREE.Group;
    clonedScene.name = newName;

    const cloned: LoadedModel = {
      name: newName,
      baseModel: clonedBaseModel,
      scene: clonedScene,
    };
    this.loadedModels.set(newName, cloned);
    return cloned;
  }

  /**
   * 获取鼠标事件（用于获取屏幕坐标）
   */
  getMouseEvent(): MouseEvent | undefined {
    return this.viewer.mouseEvent;
  }

  /**
   * 相机聚焦到指定位置
   * @param target 目标位置或对象
   * @param offset 相机偏移量 [x, y, z]
   * @param duration 动画时长（秒）
   */
  focusOn(
    target: THREE.Object3D | { x: number; y: number; z: number },
    offset: [number, number, number] = [2, 2, 2],
    duration: number = 1.5
  ): void {
    let targetPosition: THREE.Vector3;
    
    if (target instanceof THREE.Object3D) {
      // 获取对象的世界坐标
      targetPosition = new THREE.Vector3();
      target.getWorldPosition(targetPosition);
    } else {
      targetPosition = new THREE.Vector3(target.x, target.y, target.z);
    }

    // 计算相机目标位置（从机柜斜上方观察）
    const cameraEndPosition = new THREE.Vector3(
      targetPosition.x + offset[0],
      targetPosition.y + offset[1],
      targetPosition.z + offset[2]
    );

    // 使用 GSAP 动画移动相机
    gsap.to(this.viewer.camera.position, {
      x: cameraEndPosition.x,
      y: cameraEndPosition.y,
      z: cameraEndPosition.z,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.viewer.camera.lookAt(targetPosition);
      },
    });

    // 同时动画 controls 的 target
    gsap.to(this.viewer.controls.target, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: 'power2.inOut',
    });
  }

  /**
   * 重置相机到初始位置
   */
  resetCamera(duration: number = 1.5): void {
    gsap.to(this.viewer.camera.position, {
      x: 4,
      y: 2,
      z: -3,
      duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.viewer.camera.lookAt(0, 0, 0);
        this.viewer.controls.target.set(0, 0, 0);
      },
    });

    gsap.to(this.viewer.controls.target, {
      x: 0,
      y: 0,
      z: 0,
      duration,
      ease: 'power2.inOut',
    });
  }

  /**
   * 销毁场景
   */
  destroy(): void {
    this.loadedModels.clear();
    this.viewer.destroy();
  }
}
