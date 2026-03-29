<template>
  <div class="rack-statistics">
    <div class="stats-title">机柜状态概览</div>
    <div class="stats-grid">
      <div class="stat-item total">
        <div class="stat-value">{{ stats.total }}</div>
        <div class="stat-label">总机柜</div>
      </div>
      <div class="stat-item normal">
        <div class="stat-value">{{ stats.normal }}</div>
        <div class="stat-label">正常</div>
      </div>
      <div class="stat-item warning">
        <div class="stat-value">{{ stats.warning }}</div>
        <div class="stat-label">警告</div>
      </div>
      <div class="stat-item critical">
        <div class="stat-value">{{ stats.critical }}</div>
        <div class="stat-label">紧急</div>
      </div>
    </div>
    
    <!-- 告警提示 -->
    <div v-if="stats.critical > 0" class="alert-banner critical">
      ⚠️ {{ stats.critical }} 个机柜处于紧急状态，请立即处理！
    </div>
    <div v-else-if="stats.warning > 0" class="alert-banner warning">
      ⚡ {{ stats.warning }} 个机柜处于警告状态，请关注
    </div>
    <div v-else class="alert-banner normal">
      ✅ 所有机柜运行正常
    </div>

    <!-- 状态图例 -->
    <div class="legend-bar">
      <div class="legend-item">
        <span class="legend-dot normal"></span>
        <span class="legend-text">正常</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot warning"></span>
        <span class="legend-text">警告</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot critical"></span>
        <span class="legend-text">紧急</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts" name="RackStatistics">
interface Props {
  stats: {
    total: number;
    normal: number;
    warning: number;
    critical: number;
  };
}

defineProps<Props>();
</script>

<style scoped>
.rack-statistics {
  padding: 0.15rem;
  background: rgba(0, 34, 51, 0.5);
  border-radius: 0.08rem;
  border: 1px solid rgba(153, 255, 254, 0.2);
}

.stats-title {
  font-size: 0.18rem;
  color: #99fffe;
  margin-bottom: 0.15rem;
  font-weight: bold;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.1rem;
  margin-bottom: 0.15rem;
}

.stat-item {
  text-align: center;
  padding: 0.1rem;
  border-radius: 0.06rem;
  background: rgba(255, 255, 255, 0.05);
}

.stat-item.total {
  background: rgba(153, 255, 254, 0.15);
}

.stat-item.normal {
  background: rgba(82, 196, 26, 0.15);
}

.stat-item.warning {
  background: rgba(250, 173, 20, 0.15);
}

.stat-item.critical {
  background: rgba(245, 34, 45, 0.15);
}

.stat-value {
  font-size: 0.28rem;
  font-weight: bold;
  line-height: 1;
}

.stat-item.total .stat-value {
  color: #99fffe;
}

.stat-item.normal .stat-value {
  color: #52c41a;
}

.stat-item.warning .stat-value {
  color: #faad14;
}

.stat-item.critical .stat-value {
  color: #f5222d;
}

.stat-label {
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.05rem;
}

.alert-banner {
  padding: 0.12rem;
  border-radius: 0.06rem;
  text-align: center;
  font-size: 0.15rem;
  font-weight: bold;
}

.alert-banner.normal {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.3);
}

.alert-banner.warning {
  background: rgba(250, 173, 20, 0.2);
  color: #faad14;
  border: 1px solid rgba(250, 173, 20, 0.3);
}

.alert-banner.critical {
  background: rgba(245, 34, 45, 0.2);
  color: #f5222d;
  border: 1px solid rgba(245, 34, 45, 0.3);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

/* 状态图例 */
.legend-bar {
  display: flex;
  justify-content: center;
  gap: 0.2rem;
  margin-top: 0.15rem;
  padding-top: 0.15rem;
  border-top: 1px solid rgba(153, 255, 254, 0.2);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.06rem;
}

.legend-dot {
  width: 0.1rem;
  height: 0.1rem;
  border-radius: 50%;
}

.legend-dot.normal {
  background: #52c41a;
}

.legend-dot.warning {
  background: #faad14;
}

.legend-dot.critical {
  background: #f5222d;
}

.legend-text {
  font-size: 0.13rem;
  color: rgba(255, 255, 255, 0.7);
}
</style>
