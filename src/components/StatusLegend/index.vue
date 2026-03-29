<template>
  <div class="status-legend">
    <div class="legend-title">机柜状态图例</div>
    <div class="legend-items">
      <div class="legend-item">
        <span class="legend-color normal"></span>
        <span class="legend-text">正常运行</span>
      </div>
      <div class="legend-item">
        <span class="legend-color warning"></span>
        <span class="legend-text">警告</span>
      </div>
      <div class="legend-item">
        <span class="legend-color critical"></span>
        <span class="legend-text">紧急</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="StatusLegend">
</script>

<style scoped>
.status-legend {
  padding: 0.15rem;
  background: rgba(0, 34, 51, 0.5);
  border-radius: 0.08rem;
  border: 1px solid rgba(153, 255, 254, 0.2);
}

.legend-title {
  font-size: 0.18rem;
  color: #99fffe;
  margin-bottom: 0.12rem;
  font-weight: bold;
}

.legend-items {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.1rem;
}

.legend-color {
  width: 0.2rem;
  height: 0.2rem;
  border-radius: 0.04rem;
  box-shadow: 0 0 8px currentColor;
}

.legend-color.normal {
  background: #52c41a;
  color: #52c41a;
}

.legend-color.warning {
  background: #faad14;
  color: #faad14;
}

.legend-color.critical {
  background: #f5222d;
  color: #f5222d;
}

.legend-text {
  font-size: 0.16rem;
  color: rgba(255, 255, 255, 0.9);
}
</style>
