<script setup lang="ts">
defineOptions({ name: 'RequestLoading' });

withDefaults(defineProps<{ text?: string; fullscreen?: boolean }>(), {
  text: '加载中...',
  fullscreen: false
});
</script>

<template>
  <div class="zx-loading-container" :class="{ fullscreen: fullscreen }">
    <div class="zx-loading-content">
      <span class="zx-loading-spinner"></span>
      <span class="zx-loading-text">{{ text }}</span>
    </div>
  </div>
</template>

<style lang="scss">
.zx-loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 16px;
  color: #1989fa;
  font-size: 14px;
}

.zx-loading-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid #1989fa;
  border-top-color: transparent;
  animation: zx-spin 0.8s linear infinite;
}

@keyframes zx-spin {
  to {
    transform: rotate(360deg);
  }
}

.zx-loading-container.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.5);
}
</style>
