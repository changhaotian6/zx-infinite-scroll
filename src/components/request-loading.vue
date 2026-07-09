<script setup lang="ts">
defineOptions({ name: 'RequestLoading' });

withDefaults(defineProps<{ text?: string; fullscreen?: boolean }>(), {
  text: '加载中...',
  fullscreen: false
});
</script>

<template>
  <div class="loading-container" :class="{ fullscreen: fullscreen }">
    <div class="loading-content">
      <span class="loading-spinner"></span>
      <span class="loading-text">{{ text }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.loading-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 16px;
  color: #1989fa;
  font-size: 14px;
}

.loading-spinner {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2.5px solid #1989fa;
  border-top-color: transparent;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-container.fullscreen {
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
