<template>
  <div class="rack-detail-panel">
    <div v-if="!rackDetail" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-text">点击机柜查看详情</div>
    </div>
    
    <div v-else class="detail-content">
      <!-- 更新时间 - 移到最顶部 -->
      <div class="update-time-header">
        <span class="update-label">🕐 数据更新</span>
        <span class="update-value">{{ rackDetail.lastUpdated }}</span>
      </div>
      
      <!-- 头部信息 -->
      <div class="panel-header">
        <h3 class="rack-name">{{ rackDetail.name }}</h3>
        <div class="status-badge" :style="{ backgroundColor: statusColor }">
          {{ statusText }}
        </div>
      </div>
      
      <!-- 重置视角按钮 -->
      <button class="reset-view-btn" @click="$emit('resetView')">
        ↺ 重置视角
      </button>

      <!-- 关键指标 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">温度</div>
          <div class="metric-value" :class="temperatureClass">
            {{ rackDetail.temperature.toFixed(1) }}°C
          </div>
          <div class="metric-threshold">阈值: {{ rackDetail.temperatureThreshold }}°C</div>
        </div>
        
        <div class="metric-item">
          <div class="metric-label">功率</div>
          <div class="metric-value">{{ rackDetail.power }}W</div>
          <div class="metric-threshold">容量: {{ rackDetail.powerCapacity }}W</div>
        </div>
        
        <div class="metric-item">
          <div class="metric-label">空间利用率</div>
          <div class="metric-value">{{ rackDetail.utilization }}%</div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: rackDetail.utilization + '%' }"></div>
          </div>
        </div>
        
        <div class="metric-item">
          <div class="metric-label">U位使用</div>
          <div class="metric-value">{{ rackDetail.usedU }} / {{ rackDetail.totalU }}U</div>
          <div class="metric-threshold">剩余: {{ rackDetail.totalU - rackDetail.usedU }}U</div>
        </div>
      </div>

      <!-- 服务器列表 -->
      <div class="servers-section">
        <h4 class="section-title">
          服务器列表 ({{ rackDetail.servers.length }})
        </h4>
        <div class="servers-list">
          <div 
            v-for="server in rackDetail.servers" 
            :key="server.id"
            class="server-item"
            :class="'status-' + server.status"
          >
            <div class="server-info">
              <span class="server-name">{{ server.name }}</span>
              <span class="server-status">{{ serverStatusText(server.status) }}</span>
            </div>
            <div class="server-metrics">
              <span class="metric">CPU: {{ server.cpuUsage }}%</span>
              <span class="metric">内存: {{ server.memoryUsage }}%</span>
              <span class="metric" :class="{ 'temp-high': server.temperature > 80 }">
                温度: {{ server.temperature }}°C
              </span>
              <span class="metric uptime">运行: {{ server.uptime }}</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { RackDetail } from '@/types/rack';
import { statusTextMap, statusColorMap, serverStatusTextMap } from '@/types/rack';

interface Props {
  rackDetail: RackDetail | null;
}

const props = defineProps<Props>();

defineEmits<{
  resetView: [];
}>();

const statusText = computed(() => {
  if (!props.rackDetail) return '';
  return statusTextMap[props.rackDetail.status];
});

const statusColor = computed(() => {
  if (!props.rackDetail) return '';
  return statusColorMap[props.rackDetail.status];
});

const temperatureClass = computed(() => {
  if (!props.rackDetail) return '';
  const temp = props.rackDetail.temperature;
  const threshold = props.rackDetail.temperatureThreshold;
  if (temp > threshold) return 'critical';
  if (temp > threshold * 0.8) return 'warning';
  return 'normal';
});

const serverStatusText = (status: keyof typeof serverStatusTextMap) => {
  return serverStatusTextMap[status];
};
</script>

<style scoped>
.rack-detail-panel {
  height: 100%;
  color: #fff;
  font-size: 0.18rem;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 0.6rem;
  margin-bottom: 0.2rem;
}

.empty-text {
  font-size: 0.2rem;
}

.detail-content {
  height: 100%;
  max-height: calc(100vh - 150px);
  overflow-y: auto;
  padding-right: 0.1rem;
}

/* 顶部更新时间 */
.update-time-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(90deg, rgba(153, 255, 254, 0.2), rgba(153, 255, 254, 0.05));
  padding: 0.12rem 0.15rem;
  margin-bottom: 0.15rem;
  border-radius: 0.06rem;
  border-left: 3px solid #99fffe;
}

.update-label {
  font-size: 0.16rem;
  color: #99fffe;
}

.update-value {
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.8);
}

/* 自定义滚动条样式 */
.detail-content::-webkit-scrollbar {
  width: 4px;
}

.detail-content::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.detail-content::-webkit-scrollbar-thumb {
  background: rgba(153, 255, 254, 0.5);
  border-radius: 2px;
}

.detail-content::-webkit-scrollbar-thumb:hover {
  background: rgba(153, 255, 254, 0.8);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.15rem;
  padding-bottom: 0.15rem;
  border-bottom: 1px solid rgba(153, 255, 254, 0.3);
}

.reset-view-btn {
  width: 100%;
  padding: 0.1rem;
  margin-bottom: 0.2rem;
  background: rgba(153, 255, 254, 0.2);
  border: 1px solid #99fffe;
  border-radius: 0.06rem;
  color: #99fffe;
  font-size: 0.16rem;
  cursor: pointer;
  transition: all 0.3s;
}

.reset-view-btn:hover {
  background: rgba(153, 255, 254, 0.4);
}

.rack-name {
  font-size: 0.28rem;
  font-weight: bold;
  margin: 0;
  color: #99fffe;
}

.status-badge {
  padding: 0.08rem 0.16rem;
  border-radius: 0.08rem;
  font-size: 0.16rem;
  font-weight: bold;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.2rem;
  margin-bottom: 0.3rem;
}

.metric-item {
  background: rgba(0, 34, 51, 0.5);
  padding: 0.15rem;
  border-radius: 0.08rem;
  border: 1px solid rgba(153, 255, 254, 0.2);
}

.metric-label {
  font-size: 0.16rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.08rem;
}

.metric-value {
  font-size: 0.24rem;
  font-weight: bold;
  color: #99fffe;
}

.metric-value.warning {
  color: #faad14;
}

.metric-value.critical {
  color: #f5222d;
}

.metric-threshold {
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 0.05rem;
}

.progress-bar {
  height: 0.08rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 0.04rem;
  margin-top: 0.1rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #52c41a, #95de64);
  transition: width 0.3s ease;
}

.servers-section {
  margin-bottom: 0.2rem;
  max-height: 40vh;
  overflow-y: auto;
}

/* 服务器列表滚动条 */
.servers-section::-webkit-scrollbar {
  width: 4px;
}

.servers-section::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}

.servers-section::-webkit-scrollbar-thumb {
  background: rgba(153, 255, 254, 0.5);
  border-radius: 2px;
}

.section-title {
  font-size: 0.2rem;
  color: #99fffe;
  margin-bottom: 0.15rem;
  padding-bottom: 0.1rem;
  border-bottom: 1px solid rgba(153, 255, 254, 0.2);
}

.servers-list {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.server-item {
  background: rgba(0, 34, 51, 0.4);
  padding: 0.12rem;
  border-radius: 0.06rem;
  border-left: 3px solid #52c41a;
}

.server-item.status-warning {
  border-left-color: #faad14;
}

.server-item.status-error {
  border-left-color: #f5222d;
}

.server-item.status-offline {
  border-left-color: rgba(255, 255, 255, 0.3);
  opacity: 0.7;
}

.server-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.08rem;
}

.server-name {
  font-weight: bold;
  font-size: 0.17rem;
}

.server-status {
  font-size: 0.14rem;
  color: rgba(255, 255, 255, 0.7);
}

.server-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  font-size: 0.14rem;
}

.metric {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.04rem 0.08rem;
  border-radius: 0.04rem;
}

.metric.temp-high {
  background: rgba(245, 34, 45, 0.3);
  color: #ff7875;
}

.metric.uptime {
  color: rgba(255, 255, 255, 0.6);
}
</style>
