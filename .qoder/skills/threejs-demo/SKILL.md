---
name: threejs-demo
description: Three.js 3D数据可视化项目开发指南。基于 Vue 3 + Vite + Three.js 技术栈，采用分层架构设计（Vue组件层/Hooks层/业务逻辑层/3D控制层/核心层），用于构建3D机房/数据中心可视化场景。
---

# Three.js Demo 项目开发指南

## 项目概述

这是一个基于 Vue 3 + Three.js 的 3D 数据可视化项目，采用**分层架构**设计，将 Vue 与 Three.js 解耦，主要用于展示 3D 机房/数据中心场景。

### 技术栈

- **框架**: Vue 3 + TypeScript
- **构建工具**: Vite
- **3D 引擎**: Three.js (v0.152.2)
- **动画库**: GSAP
- **图表库**: ECharts
- **状态管理**: Pinia
- **UI 适配**: v-scale-screen

## 分层架构

```
┌─────────────────────────────────────┐
│  Vue 组件层 (Sence.vue)             │  UI 状态管理
├─────────────────────────────────────┤
│  Hooks 层 (useScene.ts)             │  Vue 与 3D 桥梁
├─────────────────────────────────────┤
│  业务逻辑层 (DataCenterManager.ts)   │  机房业务封装
├─────────────────────────────────────┤
│  3D 控制层 (SceneController.ts)      │  通用 3D 封装
├─────────────────────────────────────┤
│  核心层 (Viewer/ModelLoader等)       │  Three.js 基础
└─────────────────────────────────────┘
```

## 核心模块

### 1. useScene Hook (推荐入口)

`src/hooks/useScene.ts` - Vue 组件使用 3D 场景的推荐方式

```typescript
const { containerRef, hoveredRack, selectedRack, mouseEvent } = useScene({
  onRackHover: (rack, event) => {
    // rack: { name, object } | null
    // event: MouseEvent | undefined
  },
  onRackClick: (rack) => {
    // 处理机柜点击
  }
})
```

**在 Vue 组件中使用：**

```vue
<template>
  <div id="three" ref="containerRef"></div>
  <div v-if="hoveredRack">{{ hoveredRack.name }}</div>
</template>

<script setup>
import { useScene } from '@/hooks/useScene'
const { containerRef, hoveredRack } = useScene()
</script>
```

### 2. SceneController (3D 控制层)

`src/modules/SceneController/index.ts` - 封装通用 3D 操作

```typescript
const controller = new SceneController('three')

// 加载模型
const model = await controller.loadModel('/models/datacenter.glb', 'datacenter', {
  scale: 0.2,
  position: [0, 0, 0]
})

// 射线检测
controller.onRaycaster('mousemove', (intersects) => {
  // 处理悬停
})

// 高亮对象
controller.setBoxHelper(object) // 显示
controller.setBoxHelper(null) // 隐藏

// 销毁
controller.destroy()
```

### 3. DataCenterManager (业务逻辑层)

`src/modules/DataCenterManager/index.ts` - 机房场景专用逻辑

```typescript
const manager = new DataCenterManager(controller, {
  onRackHover: (rack) => {},
  onRackClick: (rack) => {}
})

// 初始化场景（自动加载地面和机房模型）
await manager.init()

// 获取机柜列表
const racks = manager.getRackList()

// 高亮指定机柜
manager.highlightRack('rack_001')
```

### 4. SceneController 相机控制

```typescript
// 聚焦到指定机柜（带平滑动画）
controller.focusOn(rackObject, [1.5, 1.5, 1.5], 1.2)

// 重置相机到初始位置
controller.resetCamera()
```

### 5. Viewer (核心层)

`src/modules/Viewer/index.ts` - Three.js 底层封装

```typescript
const viewer = new Viewer('three')

// 基础功能
viewer.addAxis() // 坐标轴辅助
viewer.addStats() // 性能监控
viewer.initRaycaster() // 射线检测
viewer.addAnimate(animate)
viewer.destroy()
```

### 5. BaseModel (模型操作)

`src/modules/BaseModel/index.ts` - 单个模型操作

```typescript
// 变换
baseModel.setScalc(0.2)
baseModel.getLength()

// 材质
baseModel.setColor('yellow', 0.5)
baseModel.setMaterial(material)
baseModel.setDefault()

// 动画与克隆
baseModel.startAnima(0)
baseModel.cloneModel([x, y, z])
```

### 6. 相机控制最佳实践

#### 垂直角度限制

在 `Viewer.initControl()` 中设置，防止看到地面以下：

```typescript
this.controls.minPolarAngle = 0 // 最上方（水平线）
this.controls.maxPolarAngle = Math.PI / 2 - 0.1 // 约 84 度，防止完全垂直向下
```

#### 缩放距离限制

防止相机穿模或拉太远：

```typescript
this.controls.minDistance = 1 // 最近距离（防止穿模到机柜内部）
this.controls.maxDistance = 10 // 最远距离（保持场景细节可见）
```

## 开发规范

### 分层调用规范

| 层级              | 职责                   | 可调用下层          |
| ----------------- | ---------------------- | ------------------- |
| Vue 组件          | UI 状态、用户交互      | useScene            |
| useScene          | 生命周期管理、事件转发 | DataCenterManager   |
| DataCenterManager | 业务逻辑、场景初始化   | SceneController     |
| SceneController   | 3D 操作封装            | Viewer、ModelLoader |
| Viewer            | Three.js 基础          | Three.js API        |

### 添加新场景类型

如需添加办公楼场景，创建新的业务管理器：

```typescript
// src/modules/OfficeManager/index.ts
export class OfficeManager {
  constructor(private controller: SceneController) {}

  async init() {
    await this.controller.loadModel('/models/zuo.glb', 'office', {
      scale: 0.01,
      position: [2, 0, 0]
    })
  }
}

// 在 useScene 中扩展
export function useScene(options = {}) {
  // ...
  const officeManager = new OfficeManager(controller)
  await officeManager.init()
}
```

### 模型规范

1. **路径**: `public/models/`
2. **命名**: 小写英文，机柜包含 'rack'
3. **压缩**: Draco 自动支持，解码器在 `public/draco/`

### 事件规范

```typescript
import Event from '@/modules/Viewer/Events'

Event.click.raycaster
Event.dblclick.raycaster
Event.mousemove.raycaster
```

## 常用任务

### 添加新模型

```typescript
const controller = new SceneController('three')
await controller.loadModel('/models/new.glb', 'modelName', {
  scale: 0.1,
  position: [0, 0, 0],
  rotation: [0, Math.PI / 2, 0]
})
```

### 自定义射线交互

```typescript
controller.onRaycaster('click', (intersects) => {
  if (!intersects.length) return
  const object = intersects[0].object
  // 处理点击
})
```

### 添加动画

```typescript
import type { Animate } from '@/modules/Viewer'

const animate: Animate = {
  fun: () => {
    // 每帧执行
  },
  content: null
}

controller.addAnimate(animate)
```

## 项目脚本

```bash
npm run dev      # 开发
npm run build    # 构建
npm run type-check  # 类型检查
npm run lint     # ESLint
npm run format   # Prettier
```

## 目录结构

```
src/
├── modules/
│   ├── SceneController/      # 3D 控制层（新增）
│   ├── DataCenterManager/    # 业务逻辑层（新增）
│   ├── Viewer/               # 核心场景管理器
│   ├── ModelLoder/           # 模型加载
│   ├── BaseModel/            # 模型基类
│   ├── SkyBoxs/              # 天空盒
│   └── ...
├── hooks/
│   └── useScene.ts           # Vue 与 3D 桥梁（新增）
├── components/
│   └── Sence.vue             # 简化后的场景组件
└── utils/                    # 工具函数
```

## 注意事项

1. **类型导入**: Three.js 类型使用 `import type * as THREE from 'three'`
2. **内存管理**: `controller.destroy()` 自动清理
3. **响应式**: 使用 `shallowRef` 存储 Three.js 对象避免性能问题
4. **性能**: 射线检测使用 `throttle` 限制 50ms 频率
5. **世界坐标**: 获取对象位置时使用 `getWorldPosition()` 而非直接使用 `position`
6. **相机聚焦**: 聚焦到机柜等子对象时，注意使用世界坐标计算相机位置
7. **交互一致性**: 点击空白区应清空选中状态和详情面板，保持 UI 状态同步
8. **UI 布局**: 状态图例等辅助信息应紧凑整合，避免独立面板占用过多空间

## P0/P1 功能实现指南

### 机柜详情面板 (P0)

点击机柜显示详情面板：

```typescript
// useScene 中处理点击
onRackClick: async (rack) => {
  if (!rack) {
    // 点击空白区，清空详情
    setSelectedRackDetail?.(null)
    return
  }
  const detail = await getRackDetail(rack.name)
  setSelectedRackDetail?.(detail)
}
```

### 机柜状态可视化 (P0)

根据状态设置机柜颜色：

```typescript
// DataCenterManager
setRackColor(rackName: string, status: RackStatus): void {
  const colorMap = {
    normal: 0x52c41a,   // 绿色 - 保持原色
    warning: 0xfaad14,  // 黄色
    critical: 0xf5222d, // 红色 + 闪烁动画
  }
  // 正常状态恢复原始颜色，异常状态变色
  if (status === 'normal') {
    this.resetRackColor(rackName)
    return
  }
  // ... 设置颜色和闪烁动画
}
```

### 温度热力图 (P1)

在机柜顶部显示温度色块：

```typescript
// HeatmapManager
addTemperatureIndicator(rack: THREE.Object3D, temperature: number): void {
  const color = this.getTemperatureColor(temperature) // 蓝->绿->黄->红
  const geometry = new THREE.PlaneGeometry(size.x * 0.8, size.z * 0.8)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.7,
  })
  // 放置在机柜顶部
  mesh.rotation.x = -Math.PI / 2
  mesh.position.set(center.x, box.max.y + 0.05, center.z)
}
```

### 功耗可视化 (P1)

在机柜旁显示功率负载条：

```typescript
// PowerVisualizer
activate(racks: THREE.Object3D[], powerData: Map<string, PowerData>): void {
  racks.forEach((rack) => {
    const data = powerData.get(rack.name)
    const loadRatio = data.power / data.maxPower
    const color = this.getLoadColor(loadRatio) // 绿->黄->红
    // 创建功率条
    const geometry = new THREE.BoxGeometry(0.1, size.y * loadRatio, size.z * 0.8)
    // 放置在机柜右侧
  })
}
```

### 可视化模式切换 (P1)

实现模式切换控制器：

```typescript
// useScene 中
const setVizMode = (mode: VizMode) => {
  // 清理所有效果
  hideTemperatureHeatmap()
  hidePowerVisualization()

  // 根据模式显示对应效果
  if (mode === 'temperature') {
    showTemperatureHeatmap()
  } else if (mode === 'power') {
    showPowerVisualization()
  }
}
```

### 悬浮面板 UI (P1)

实现可收起/滑入的面板：

```vue
<!-- 左侧悬浮面板 - hover 展开 -->
<div class="floating-panel left"
     :class="{ expanded: isExpanded }"
     @mouseenter="isExpanded = true"
     @mouseleave="isExpanded = false">
  <div class="panel-icon">📊</div>
  <div class="panel-content">...</div>
</div>

<!-- 右侧详情面板 - 点击滑入 -->
<transition name="slide-right">
  <div v-if="selectedRack" class="floating-panel right">
    <Panel title="机柜详情">...</Panel>
  </div>
</transition>
```

```css
/* 悬浮面板样式 */
.floating-panel {
  position: absolute;
  background: rgba(0, 34, 51, 0.8);
  border: 1px solid rgba(153, 255, 254, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
}

/* 滑入动画 */
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.3s ease;
}
.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
```

### 嵌套面板滚动层级控制 (P1)

多层嵌套面板的滚动控制策略，确保只有特定区域滚动：

```css
/* 外层面板：不滚动，高度自适应 */
.floating-panel.right {
  position: absolute;
  top: 70px;
  right: 0.2rem;
  width: 380px;
  max-height: none; /* 不限制高度 */
  overflow-y: visible; /* 不滚动 */
}

/* 内容容器：不滚动 */
.floating-panel.right .panel-content {
  max-height: none;
  overflow-y: visible;
}

/* 详情面板：不滚动 */
.rack-detail-panel {
  /* 不设置高度限制 */
}

/* 服务器列表：唯一滚动区域 */
.servers-list {
  max-height: 200px; /* 固定高度 */
  overflow-y: auto; /* 超出时滚动 */
}

.servers-list::-webkit-scrollbar {
  width: 4px;
}
.servers-list::-webkit-scrollbar-thumb {
  background: rgba(153, 255, 254, 0.5);
  border-radius: 2px;
}
```

**关键原则：**

1. 外层容器 (`max-height: none, overflow-y: visible`) - 确保不被截断
2. 内容区域不设置滚动 - 随内容自然伸展
3. 只有特定列表区域设置 (`max-height + overflow-y: auto`) - 唯一滚动点
4. 滚动条样式统一 - 保持视觉一致性

### 告警闪烁动画 (P1)

使用 GSAP 实现紧急状态闪烁：

```typescript
private startAlertAnimation(mesh: THREE.Mesh): void {
  const material = mesh.material as THREE.MeshPhongMaterial
  gsap.to(material, {
    emissiveIntensity: 0.8,
    duration: 0.5,
    yoyo: true,
    repeat: -1,
    ease: 'power1.inOut',
  })
}
```
