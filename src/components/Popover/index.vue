<template>
  <div
    class="popover"
    :style="{
      'top': props.top + 'px',
      'left': props.left + 'px',
      'display': isShow ? 'inline-block' : 'none'
    }"
  >
    <div class="popover-title">
      机柜信息
    </div>
    <div class="popover-content">
      {{ dataRef.name }}
    </div>
  </div>
</template>

<script lang="ts" setup name="Popover">
import { ref } from 'vue';
type PropsTypes = {
  top: number;
  left: number;
};

const props = withDefaults(defineProps<PropsTypes>(), {
  top: 0,
  left: 0,
});

const isShow = ref(false);
const dataRef = ref<any>({});

const setShow = (visible: boolean, data?: any) => {
  isShow.value = visible;
  if (data) dataRef.value = data;
};

defineExpose({
  setShow,
});
</script>

<style scoped>
.popover {
  position: absolute;
  background: rgba(0, 20, 40, 0.9);
  border: 1px solid rgba(153, 255, 254, 0.4);
  border-radius: 8px;
  font-size: 14px;
  color: #fff;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 15px rgba(153, 255, 254, 0.1);
  min-width: 140px;
  z-index: 100;
  pointer-events: none;
}

.popover-title {
  padding: 10px 14px;
  font-size: 13px;
  font-weight: bold;
  color: #99fffe;
  border-bottom: 1px solid rgba(153, 255, 254, 0.2);
  letter-spacing: 1px;
}

.popover-content {
  padding: 12px 14px;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.9);
}
</style>
