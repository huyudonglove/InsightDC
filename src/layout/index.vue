<template>
  <div class="layout">
    <Header>InsightDC - 数据中心可视化系统</Header>
    <div class="layout-content">
      <!-- 左侧常驻面板 - 机柜概览 -->
      <div class="left-panels">
        <div class="panel-section always-visible">
          <Panel title="机柜状态概览">
            <RackStatistics :stats="rackStats" />
          </Panel>
        </div>
        
        <!-- 可收起的悬浮面板 -->
        <div 
          class="floating-panel left" 
          :class="{ expanded: isLeftExpanded }" 
          @mouseenter="handleMouseEnter"
          @mouseleave="handleMouseLeave"
        >
          <div class="panel-icon" v-show="!isLeftExpanded">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"></rect>
              <rect x="14" y="3" width="7" height="7"></rect>
              <rect x="14" y="14" width="7" height="7"></rect>
              <rect x="3" y="14" width="7" height="7"></rect>
            </svg>
            <span class="hint">更多</span>
          </div>
          <div class="panel-content" v-show="isLeftExpanded">
            <Panel title="可视化控制">
              <VisualizationControls @mode-change="onVizModeChange" />
            </Panel>
            <Panel title="容量统计">
              <PieChart></PieChart>
            </Panel>
          </div>
        </div>
      </div>
      
      <!-- 右侧详情面板 - 点击后滑入 -->
      <transition name="slide-right">
        <div v-if="selectedRackDetail" class="floating-panel right expanded">
          <div class="panel-content">
            <Panel title="机柜详情">
              <RackDetailPanel 
                :rack-detail="selectedRackDetail" 
                @reset-view="resetView"
              />
            </Panel>
          </div>
        </div>
      </transition>
      
      <Sence ref="senceRef" :viz-mode="currentVizMode" @stats-update="onStatsUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts" name="Layout">
import { ref, provide } from 'vue';
import Header from './Header.vue';
import Sence from '@/components/Sence.vue';
import Panel from '@/components/Panel/index.vue';
import LineCharts from '@/components/Charts/LineChart.vue';
import PieChart from '@/components/Charts/PieChart.vue';
import RackDetailPanel from '@/components/RackDetailPanel/index.vue';
import RackStatistics from '@/components/RackStatistics/index.vue';
import VisualizationControls from '@/components/VisualizationControls/index.vue';
import type { RackDetail } from '@/types/rack';

const selectedRackDetail = ref<RackDetail | null>(null);
const senceRef = ref<InstanceType<typeof Sence> | null>(null);
const isLeftExpanded = ref(false);
let expandTimer: ReturnType<typeof setTimeout> | null = null;

// 鼠标进入展开面板
const handleMouseEnter = () => {
  if (expandTimer) {
    clearTimeout(expandTimer);
    expandTimer = null;
  }
  isLeftExpanded.value = true;
};

// 鼠标离开收起面板（延迟，避免快速移动时闪烁）
const handleMouseLeave = () => {
  expandTimer = setTimeout(() => {
    isLeftExpanded.value = false;
  }, 100);
};

// 机柜统计数据
const rackStats = ref({
  total: 0,
  normal: 0,
  warning: 0,
  critical: 0,
});

// 提供给子组件使用
provide('setSelectedRackDetail', (detail: RackDetail | null) => {
  selectedRackDetail.value = detail;
});

// 重置视角
const resetView = () => {
  senceRef.value?.resetCamera();
};

// 接收状态更新
const onStatsUpdate = (stats: { total: number; normal: number; warning: number; critical: number }) => {
  rackStats.value = stats;
};

// 可视化模式切换
const currentVizMode = ref<'normal' | 'temperature' | 'power'>('normal');

const onVizModeChange = (mode: 'normal' | 'temperature' | 'power') => {
  console.log('Layout 收到模式切换:', mode);
  currentVizMode.value = mode;
};
</script>

<style scoped>
.layout {
  width: 100vw;
  height: 100vh;
}
.layout-content {
  width: 100vw;
  height: 100vh;
  background-color: #fff;
}

/* 左侧面板容器 */
.left-panels {
  position: absolute;
  left: 0.2rem;
  top: 70px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

/* 常驻面板 */
.panel-section.always-visible {
  width: 280px;
  background: rgba(0, 34, 51, 0.8);
  border: 1px solid rgba(153, 255, 254, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  padding: 15px;
}

/* 悬浮面板基础样式 */
.floating-panel {
  transition: all 0.3s ease;
}

/* 可收起的左侧面板 */
.floating-panel.left {
  width: 60px;
  height: 60px;
  background: rgba(0, 34, 51, 0.8);
  border: 1px solid rgba(153, 255, 254, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  overflow: hidden;
}

.floating-panel.left.expanded {
  width: 280px;
  height: auto;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
}

/* 面板图标 */
.panel-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  cursor: pointer;
}

.panel-icon .icon-svg {
  width: 24px;
  height: 24px;
  color: #99fffe;
  margin-bottom: 4px;
}

.panel-icon .hint {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

/* 面板内容 */
.panel-content {
  padding: 15px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.floating-panel.expanded .panel-content {
  opacity: 1;
}

.floating-panel.expanded .panel-icon {
  display: none;
}

/* 右侧面板 */
.floating-panel.right {
  position: absolute;
  top: 70px;
  right: 0.2rem;
  width: 380px;
  max-height: none;
  overflow-y: visible;
  z-index: 10;
}

.floating-panel.right .panel-content {
  opacity: 1;
  padding: 15px;
  background: rgba(0, 34, 51, 0.8);
  border: 1px solid rgba(153, 255, 254, 0.3);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  max-height: none;
  overflow-y: visible;
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

/* 隐藏滚动条 */
.floating-panel::-webkit-scrollbar {
  display: none;
}
</style>
