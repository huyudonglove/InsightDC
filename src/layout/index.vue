<template>
  <div class="layout">
    <Header>InsightDC - 数据中心可视化系统</Header>
    <div class="layout-content">
      <div class="layout-content-left">
        <Panel title="机柜状态概览">
          <RackStatistics :stats="rackStats" />
        </Panel>
        <Panel title="可视化控制">
          <VisualizationControls @mode-change="onVizModeChange" />
        </Panel>
        <Panel title="容量统计">
          <PieChart></PieChart>
        </Panel>
      </div>
      <div class="layout-content-right">
        <Panel title="机柜详情">
          <RackDetailPanel 
            :rack-detail="selectedRackDetail" 
            @reset-view="resetView"
          />
        </Panel>
      </div>
      <Sence ref="senceRef" @stats-update="onStatsUpdate" />
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
const onVizModeChange = (mode: 'normal' | 'temperature' | 'power') => {
  console.log('Layout 收到模式切换:', mode);
  // TODO: 传递给 Sence 组件
};
</script>

<style scope>
.layout {
  width: 100vw;
  height: 100vh;
}
.layout-content {
  width: 100vw;
  height: 100vh;
  background-color: #fff;
}
.layout-content-left {
  position: absolute;
  left: 0.3rem;
  top: 70px;
  width: 30vw;
  overflow: hidden; /* 隐藏滚动条 */
}
.layout-content-right {
  position: absolute;
  right: 0.6rem;
  top: 70px;
  width: 30vw;
}
.panel {
  margin-bottom: 0.3rem;
}
</style>
