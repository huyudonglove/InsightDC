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
