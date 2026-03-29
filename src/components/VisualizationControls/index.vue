<template>
  <div class="viz-controls">
    <div class="control-title">可视化模式</div>
    <div class="control-buttons">
      <button
        :class="['control-btn', { active: currentMode === 'normal' }]"
        @click="setMode('normal')"
      >
        <span class="btn-icon">📊</span>
        <span class="btn-text">状态视图</span>
      </button>
      <button
        :class="['control-btn', { active: currentMode === 'temperature' }]"
        @click="setMode('temperature')"
      >
        <span class="btn-icon">🌡️</span>
        <span class="btn-text">温度热力</span>
      </button>
      <button
        :class="['control-btn', { active: currentMode === 'power' }]"
        @click="setMode('power')"
      >
        <span class="btn-icon">⚡</span>
        <span class="btn-text">功耗视图</span>
      </button>
    </div>
    
    <!-- 当前模式说明 -->
    <div class="mode-description">
      {{ modeDescription }}
    </div>
  </div>
</template>

<script setup lang="ts" name="VisualizationControls">
import { ref, computed } from 'vue';

type VizMode = 'normal' | 'temperature' | 'power';

const currentMode = ref<VizMode>('normal');

const modeDescriptions: Record<VizMode, string> = {
  normal: '显示机柜运行状态：正常、警告、紧急',
  temperature: '显示机柜温度分布：蓝色(低温) → 红色(高温)',
  power: '显示机柜功耗负载：绿色(低) → 红色(高)',
};

const modeDescription = computed(() => modeDescriptions[currentMode.value]);

const emit = defineEmits<{
  modeChange: [mode: VizMode];
}>();

const setMode = (mode: VizMode) => {
  currentMode.value = mode;
  emit('modeChange', mode);
};
</script>

<style scoped>
.viz-controls {
  padding: 0.15rem;
  background: rgba(0, 34, 51, 0.5);
  border-radius: 0.08rem;
  border: 1px solid rgba(153, 255, 254, 0.2);
}

.control-title {
  font-size: 0.16rem;
  color: #99fffe;
  margin-bottom: 0.12rem;
  font-weight: bold;
}

.control-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.08rem;
}

.control-btn {
  display: flex;
  align-items: center;
  gap: 0.08rem;
  padding: 0.1rem 0.12rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(153, 255, 254, 0.2);
  border-radius: 0.06rem;
  color: #fff;
  font-size: 0.14rem;
  cursor: pointer;
  transition: all 0.2s;
}

.control-btn:hover {
  background: rgba(153, 255, 254, 0.1);
  border-color: rgba(153, 255, 254, 0.4);
}

.control-btn.active {
  background: rgba(153, 255, 254, 0.2);
  border-color: #99fffe;
}

.btn-icon {
  font-size: 0.16rem;
}

.btn-text {
  flex: 1;
  text-align: left;
}

.mode-description {
  margin-top: 0.12rem;
  padding-top: 0.12rem;
  border-top: 1px solid rgba(153, 255, 254, 0.2);
  font-size: 0.13rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.4;
}
</style>
