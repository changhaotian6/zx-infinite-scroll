<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import RequestLoading from './request-loading.vue';
import EmptyComponent from './empty-component.vue';

defineOptions({
  name: 'InfiniteScroll'
});

interface Props {
  /** 是否处于加载中状态 */
  loading?: boolean;
  /** 是否已加载完所有数据 */
  finished?: boolean;
  /** 是否显示空状态 */
  isEmpty?: boolean;
  /** 空状态文案 */
  emptyText?: string;
  /** 是否启用下拉刷新 */
  pullRefresh?: boolean;
  /** 下拉刷新触发距离（px） */
  pullThreshold?: number;
  /** 上拉加载触发距离（距离底部 px） */
  loadThreshold?: number;
  /** 下拉中的文案 */
  pullingText?: string;
  /** 释放刷新的文案 */
  loosingText?: string;
  /** 刷新中的文案 */
  refreshingText?: string;
  /** 加载中的文案 */
  loadingText?: string;
  /** 加载完成的文案 */
  finishedText?: string;
  /** 加载失败的文案 */
  errorText?: string;
  /** 是否显示错误状态 */
  error?: boolean;
  /** 内容区域是否显示加载状态 */
  contentLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  finished: false,
  isEmpty: false,
  emptyText: '暂无数据',
  pullRefresh: false,
  pullThreshold: 70,
  loadThreshold: 50,
  pullingText: '下拉刷新',
  loosingText: '释放即可刷新',
  refreshingText: '加载中...',
  loadingText: '加载中...',
  finishedText: '没有更多了~',
  errorText: '加载失败，点击重试',
  error: false,
  contentLoading: false
});

const emit = defineEmits<{
  /** 触发下拉刷新 */
  refresh: [];
  /** 触发上拉加载 */
  load: [];
  /** 点击错误重试 */
  retry: [];
}>();

const containerRef = ref<HTMLElement | null>(null);
const contentRef = ref<HTMLElement | null>(null);
const indicatorRef = ref<HTMLElement | null>(null);

// 下拉刷新状态
const pullStatus = ref<'idle' | 'pulling' | 'loosing' | 'refreshing'>('idle');
const pullDistance = ref(0);
// 拖动期间禁用 transition，避免 transform 变化时被 0.25s 补间拖慢
const isDragging = ref(false);

// 触摸相关
let startX = 0;
let startY = 0;
let lastDistance = 0;
// 手势方向锁：避免横向滑动被误判为下拉
let gestureLock: 'none' | 'vertical' | 'horizontal' = 'none';
const SLOPE_LOCK_DISTANCE = 8;

let isRefreshing = false;
let isLoading = false;
// 鼠标拖拽下拉（PC 端）
let isMouseDown = false;

// 节流相关
let scrollTimer: number | null = null;
let touchMoveRaf: number | null = null;
let idleTimer: number | null = null;
// 监听容器尺寸变化
let resizeObserver: ResizeObserver | null = null;
// 防止空页死循环：snapshot 触发 load 时的 contentHeight，下次完成后没增长就不再 auto-load
let lastTriggerContentHeight = -1;

// 下拉刷新核心：按下（与指针类型无关，touch/mouse 共用）
function pullStart(clientX: number, clientY: number) {
  if (!props.pullRefresh || isRefreshing) return;
  startX = clientX;
  startY = clientY;
  lastDistance = 0;
  gestureLock = 'none';
  pullStatus.value = 'idle';
}

// 下拉刷新核心：移动（rAF 节流，始终使用最新位置）
// 返回 true 表示消费了本次移动（下拉进行中），调用方据此决定是否 preventDefault
function pullMove(clientX: number, clientY: number, cancelable: boolean): boolean {
  if (!props.pullRefresh || isRefreshing || startY === 0) return false;

  const dx = clientX - startX;
  const dy = clientY - startY;

  // 方向判定：先到达 8px 锁定的方向才认为有意图，垂直要明显大于水平（1.5x）
  if (gestureLock === 'none') {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (ax > SLOPE_LOCK_DISTANCE || ay > SLOPE_LOCK_DISTANCE) {
      gestureLock = ay > ax * 1.5 ? 'vertical' : 'horizontal';
    } else {
      return false;
    }
  }
  if (gestureLock === 'horizontal') return false;

  // 子像素容差：≤1 视为已到顶，避免 X5 内核 scrollTop 偶发非整数判断失败
  const atTop = getScrollTop() <= 1;

  // iOS 15- 兜底：在 atBottom 且向上拖时阻止整页 rubber-band
  // （iOS 16+ overscroll-behavior 已处理，此处兜底兼容）
  if (!atTop && dy < 0) {
    const c = containerRef.value;
    if (c) {
      const atBottom = c.scrollHeight - c.scrollTop - c.clientHeight <= 1;
      if (atBottom && cancelable) {
        return true;
      }
    }
    return false;
  }
  if (!atTop) return false;

  // 反向拖动也要更新（让指示器跟着手指回退），夹紧到 [0, 150]
  const clamped = Math.max(0, Math.min(dy, 150));

  lastDistance = clamped;
  isDragging.value = true;

  if (touchMoveRaf === null) {
    touchMoveRaf = requestAnimationFrame(() => {
      touchMoveRaf = null;
      pullDistance.value = lastDistance * 0.5;
      if (lastDistance === 0) {
        pullStatus.value = 'idle';
      } else {
        pullStatus.value = lastDistance > props.pullThreshold ? 'loosing' : 'pulling';
      }
    });
  }

  // 仅在向下拖时消费事件（避免误吞用户向上滚动的意图）
  return dy > 0;
}

// 下拉刷新核心：松开
function pullEnd() {
  if (!props.pullRefresh || isRefreshing) return;

  // 取消待执行的 rAF，避免松手后还有一帧异步更新把 UI 拉回 loosing 卡住
  if (touchMoveRaf !== null) {
    cancelAnimationFrame(touchMoveRaf);
    touchMoveRaf = null;
  }

  isDragging.value = false;

  // 用最新的 lastDistance 同步判定，不依赖可能尚未生效的 pullStatus
  if (lastDistance > props.pullThreshold) {
    isRefreshing = true;
    pullStatus.value = 'refreshing';
    pullDistance.value = 50;
    emit('refresh');
  } else {
    pullDistance.value = 0;
    pullStatus.value = 'idle';
  }

  resetTouch();
}

// 下拉刷新核心：取消（回到 idle）
function pullCancel() {
  if (!props.pullRefresh || isRefreshing) return;

  if (touchMoveRaf !== null) {
    cancelAnimationFrame(touchMoveRaf);
    touchMoveRaf = null;
  }

  isDragging.value = false;
  pullDistance.value = 0;
  pullStatus.value = 'idle';
  resetTouch();
}

// 下拉刷新 - touchstart
function handleTouchStart(e: TouchEvent) {
  pullStart(e.touches[0].clientX, e.touches[0].clientY);
}

// 下拉刷新 - touchmove
function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  if (pullMove(touch.clientX, touch.clientY, e.cancelable) && e.cancelable) {
    e.preventDefault();
  }
}

// 下拉刷新 - touchend
function handleTouchEnd() {
  pullEnd();
}

// 下拉刷新 - touchcancel（微信 X5 内核会在系统手势介入时派发 cancel 而非 end）
function handleTouchCancel() {
  pullCancel();
}

// 下拉刷新 - mousedown（PC 端鼠标拖拽）
function handleMouseDown(e: MouseEvent) {
  // 仅左键触发
  if (!props.pullRefresh || isRefreshing || e.button !== 0) return;
  isMouseDown = true;
  pullStart(e.clientX, e.clientY);
}

// 下拉刷新 - mousemove（挂在 window 上，允许拖出容器）
function handleMouseMove(e: MouseEvent) {
  if (!isMouseDown) return;
  if (pullMove(e.clientX, e.clientY, true)) {
    // 阻止拖拽时选中文本
    e.preventDefault();
  }
}

// 下拉刷新 - mouseup
function handleMouseUp() {
  if (!isMouseDown) return;
  isMouseDown = false;
  pullEnd();
}

function resetTouch() {
  startX = 0;
  startY = 0;
  lastDistance = 0;
  gestureLock = 'none';
}

// 上拉加载 - scroll（节流处理）
function handleScroll() {
  if (props.loading || props.finished || props.error || isLoading) return;
  if (scrollTimer) return;

  scrollTimer = window.setTimeout(() => {
    scrollTimer = null;
    const container = containerRef.value;
    if (!container) return;

    const { scrollTop, clientHeight, scrollHeight } = container;
    const contentHeight = contentRef.value?.clientHeight || 0;

    // 情况1：内容不足一屏，自动触发加载
    if (contentHeight <= clientHeight) {
      // 死循环防护：上一次 auto-load 后内容没增长，不再继续触发
      if (lastTriggerContentHeight === contentHeight) return;
      lastTriggerContentHeight = contentHeight;
      // 不足一屏时主动滚到底，让 loading 指示器进入视口
      triggerLoad(true);
      return;
    }

    // 情况2：滚动到距离底部阈值范围内
    if (scrollHeight - scrollTop - clientHeight <= props.loadThreshold) {
      // 用户已经手动滚到底，不再强制 scrollTop（避免打断惯性滚动）
      triggerLoad(false);
    }
  }, 100);
}

function triggerLoad(scrollToBottom = false) {
  isLoading = true;
  emit('load');
  nextTick(() => {
    const c = containerRef.value;
    if (!c) return;
    if (scrollToBottom) {
      // 内容不足一屏：直接滚到底（没有"惯性"可以打断）
      c.scrollTop = c.scrollHeight;
    } else {
      // 阈值触发：用 scrollIntoView 平滑进入视口，避免突兀打断；
      // 旧 WebKit 不识别 options 会降级为即时滚动，效果等价
      indicatorRef.value?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  });
}

// 获取滚动距离
function getScrollTop(): number {
  return containerRef.value?.scrollTop ?? 0;
}

// 完成下拉刷新
function finishRefresh() {
  isRefreshing = false;
  pullDistance.value = 0;
  // 让 transform snap-back 完成后再切 idle，避免 spinner 在动画中途突然消失
  if (idleTimer !== null) clearTimeout(idleTimer);
  idleTimer = window.setTimeout(() => {
    pullStatus.value = 'idle';
    idleTimer = null;
  }, 250);
  // 重置死循环计数
  lastTriggerContentHeight = -1;
  nextTick(() => {
    checkContentHeight();
  });
}

// 完成上拉加载
function finishLoad() {
  isLoading = false;
  nextTick(() => {
    const contentHeight = contentRef.value?.clientHeight || 0;
    // 内容没增长就不再触发 auto-load，避免空页死循环
    if (lastTriggerContentHeight !== -1 && contentHeight === lastTriggerContentHeight) return;
    lastTriggerContentHeight = -1;
    checkContentHeight();
  });
}

// 检查内容高度，不足一屏时自动触发加载
function checkContentHeight() {
  if (props.finished || props.loading || props.error) return;

  nextTick(() => {
    const contentHeight = contentRef.value?.clientHeight || 0;
    const clientHeight = containerRef.value?.clientHeight || 0;

    if (contentHeight <= clientHeight && !isLoading) {
      handleScroll();
    }
  });
}

// 点击错误重试 — 由父组件决定具体行为，避免 retry + load 双触发
function handleRetry() {
  emit('retry');
}

// loading 完成时同步重置 isLoading
watch(
  () => props.loading,
  newVal => {
    if (!newVal) {
      isLoading = false;
    }
  }
);

// finished 翻为 true 时重置死循环计数
watch(
  () => props.finished,
  newVal => {
    if (newVal) {
      lastTriggerContentHeight = -1;
    }
  }
);

onMounted(() => {
  const container = containerRef.value;
  if (!container) return;

  if (props.pullRefresh) {
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });
    container.addEventListener('touchcancel', handleTouchCancel, { passive: true });
    // 鼠标拖拽（PC）：move/up 挂在 window 上，允许拖出容器边界
    container.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }

  container.addEventListener('scroll', handleScroll, { passive: true });

  // 监听容器/内容尺寸变化（旋转、WebView resize、软键盘弹出收起等）
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      checkContentHeight();
    });
    resizeObserver.observe(container);
    if (contentRef.value) resizeObserver.observe(contentRef.value);
  }

  // 初始检查内容高度
  nextTick(() => {
    checkContentHeight();
  });
});

onBeforeUnmount(() => {
  const container = containerRef.value;
  if (container) {
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('touchcancel', handleTouchCancel);
    container.removeEventListener('mousedown', handleMouseDown);
    container.removeEventListener('scroll', handleScroll);
  }
  window.removeEventListener('mousemove', handleMouseMove);
  window.removeEventListener('mouseup', handleMouseUp);
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
  if (touchMoveRaf !== null) {
    cancelAnimationFrame(touchMoveRaf);
    touchMoveRaf = null;
  }
  if (scrollTimer !== null) {
    clearTimeout(scrollTimer);
    scrollTimer = null;
  }
  if (idleTimer !== null) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
});

defineExpose({
  refresh: finishRefresh,
  finishRefresh,
  finishPullDown: finishRefresh,
  finishLoad,
  finishPullUp: finishLoad,
  checkContentHeight
});
</script>

<template>
  <div ref="containerRef" class="infinite-scroll">
    <!-- 下拉刷新指示器 -->
    <div
      v-if="pullRefresh"
      class="pull-refresh-indicator"
      :class="{ 'no-transition': isDragging }"
      :style="{ transform: `translateY(${pullDistance}px)` }"
    >
      <div v-show="pullStatus !== 'idle'" class="pull-refresh-content">
        <!-- <RequestLoading v-if="pullStatus === 'refreshing'" text="" /> -->
        <span v-if="pullStatus === 'refreshing'"></span>
        <span v-else-if="pullStatus === 'loosing'" class="pull-text">{{ loosingText }}</span>
        <span v-else class="pull-text">{{ pullingText }}</span>
      </div>
    </div>

    <!-- 内容区域 -->
    <div
      ref="contentRef"
      class="infinite-scroll-content"
      :class="{ 'no-transition': isDragging }"
      :style="pullRefresh ? { transform: `translateY(${pullDistance}px)` } : {}"
    >
      <!-- 内容区域加载遮罩 -->
      <div v-if="contentLoading" class="content-loading-mask">
        <RequestLoading :text="refreshingText" />
      </div>

      <!-- 空状态 -->
      <EmptyComponent v-if="isEmpty && !loading" :text="emptyText" />

      <!-- 默认插槽 -->
      <slot></slot>

      <!-- 上拉加载指示器 -->
      <div v-if="!isEmpty" ref="indicatorRef" class="load-more-indicator">
        <RequestLoading v-if="loading && pullStatus !== 'refreshing'" :text="loadingText" />
        <span v-else-if="finished" class="finished-text">{{ finishedText }}</span>
        <span v-else-if="error" class="error-text" @click="handleRetry">{{ errorText }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.infinite-scroll {
  height: 100%;
  position: relative;
  min-height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  // 阻止滚动到边界时把滚动链传递给祖先（修复 iOS 16+ / 微信 X5 下拉变成整页拖拽）
  overscroll-behavior: contain;
  // 显式声明只接受纵向手势，避免被外层 touch-action 影响
  touch-action: pan-y;
  // iOS 下让原生回弹有惯性
  -webkit-overflow-scrolling: touch;
}

.pull-refresh-indicator {
  position: absolute;
  top: -50px;
  left: 0;
  right: 0;
  height: 50px;
  transition: transform 0.25s;

  // 拖动期间禁用过渡，让 transform 1:1 跟随手指
  &.no-transition {
    transition: none;
  }
}

.pull-refresh-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-size: 14px;
  color: #969799;
}

.pull-text {
  color: #1989fa;
  font-size: 14px;
}

.infinite-scroll-content {
  position: relative;
  transition: transform 0.25s;
  min-height: 100%;

  &.no-transition {
    transition: none;
  }
}

.content-loading-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(2px);
}

.load-more-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  // 预留高度避免 loading 渲染后被推到视口外造成遮挡
  min-height: 50px;
  padding: 16px 0;
  font-size: 14px;
  color: #8c8f97;
}

.finished-text {
  color: #8c8f97;
  font-size: 14px;
}

.error-text {
  color: #ee0a24;
  font-size: 14px;
  cursor: pointer;

  &:active {
    opacity: 0.7;
  }
}
</style>
