<script setup lang="ts">
import { computed } from 'vue';

defineOptions({ name: 'EmptyComponent' });

interface Props {
  text?: string;
  showText?: boolean;
  /** 顶部间距，可传数字（px）或带单位字符串，默认 168px */
  paddingTop?: number | string;
  /** 自定义图片 URL */
  emptyImage?: string;
}

const props = withDefaults(defineProps<Props>(), {
  text: '暂无数据',
  showText: true,
  paddingTop: 168,
  emptyImage: ''
});

const wrapStyle = computed(() => ({
  paddingTop: typeof props.paddingTop === 'number' ? `${props.paddingTop}px` : props.paddingTop
}));

// 默认空状态 SVG（简洁的空文件夹图标）
const defaultEmptySvg = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='80' viewBox='0 0 96 80' fill='none'%3E%3Cpath d='M8 16C8 12.6863 10.6863 10 14 10H38L44 16H82C85.3137 16 88 18.6863 88 22V66C88 69.3137 85.3137 72 82 72H14C10.6863 72 8 69.3137 8 66V16Z' fill='%23E8E8E8'/%3E%3Cpath d='M8 20C8 18.3431 9.34315 17 11 17H85C86.6569 17 88 18.3431 88 20V66C88 69.3137 85.3137 72 82 72H14C10.6863 72 8 69.3137 8 66V20Z' fill='%23F5F5F5'/%3E%3Cpath d='M38 42C38 40.8954 38.8954 40 40 40H56C57.1046 40 58 40.8954 58 42V44C58 45.1046 57.1046 46 56 46H40C38.8954 46 38 45.1046 38 44V42Z' fill='%23D9D9D9'/%3E%3C/svg%3E`;

const imageSrc = computed(() => props.emptyImage || defaultEmptySvg);
</script>

<template>
  <div class="empty-wrap" :style="wrapStyle">
    <img class="empty-image" :src="imageSrc" alt="" />
    <p v-if="showText" class="empty-text">
      <slot>{{ text }}</slot>
    </p>
  </div>
</template>

<style scoped lang="scss">
.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-image {
  width: 96px;
  height: 80px;
}

.empty-text {
  margin: 12px 0 0;
  color: #8c8f97;
  font-size: 12px;
  line-height: 22px;
}
</style>
