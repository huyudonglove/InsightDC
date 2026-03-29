<template>
  <div id="three" ref="containerRef" @mouseleave="handleMouseLeave"></div>
  <Popover
    ref="popoverRef"
    :top="popoverTop"
    :left="popoverLeft"
    :data="popoverData"
  />
</template>

<script lang="ts" setup name="Sence">
import { ref, inject } from 'vue';
import { useScene } from '@/hooks/useScene';
import Popover from './Popover/index.vue';
import type { RackDetail } from '@/types/rack';

const popoverRef = ref<InstanceType<typeof Popover> | null>(null);
const popoverTop = ref(0);
const popoverLeft = ref(0);
const popoverData = ref<{ name: string }>({ name: '' });

// 从 layout 注入设置选中机柜的方法
const setSelectedRackDetail = inject<(detail: RackDetail | null) => void>('setSelectedRackDetail');

// 定义事件
const emit = defineEmits<{
  statsUpdate: [stats: { total: number; normal: number; warning: number; critical: number }];
}>();

const { containerRef, resetCamera } = useScene({
  onRackHover: (rack, mouseEvent) => {
    if (rack && mouseEvent) {
      popoverData.value = { name: rack.name };
      popoverTop.value = mouseEvent.clientY + 10;
      popoverLeft.value = mouseEvent.clientX + 10;
      popoverRef.value?.setShow(true, popoverData.value);
    } else {
      popoverRef.value?.setShow(false);
    }
  },
  onRackClick: (rack, detail) => {
    if (!rack || !detail) {
      // 点击空白区，清空详情
      setSelectedRackDetail?.(null);
      return;
    }
    console.log('点击机柜:', rack.name);
    // 更新 layout 中的选中机柜详情
    setSelectedRackDetail?.(detail);
  },
  onStatsUpdate: (stats) => {
    emit('statsUpdate', stats);
  },
});

// 监听鼠标离开 3D 容器，关闭 Popover
const handleMouseLeave = () => {
  popoverRef.value?.setShow(false);
};

// 暴露方法给父组件
defineExpose({
  resetCamera,
});
</script>

<style scoped>
#three {
  height: 100%;
  width: 100%;
}
</style>
