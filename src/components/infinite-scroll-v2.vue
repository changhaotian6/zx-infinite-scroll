<script setup lang="ts" generic="T">
import { type Ref, nextTick, onMounted, ref, watch } from 'vue';
import InfiniteScroll from './infinite-scroll.vue';

defineOptions({
  name: 'InfiniteScrollV2'
});

const props = withDefaults(
  defineProps<{
    /** 数据请求函数，需返回 { records, total }，失败时抛错 */
    fetchFn: (params: {
      page: number;
      pageSize: number;
      [key: string]: any;
    }) => Promise<{
      records: T[];
      total: number;
    }>;
    /** 业务查询参数（如筛选条件），变化时自动 reset 重新加载 */
    params?: Record<string, any>;
    /** 每页条数 */
    pageSize?: number;
    /** params 变化时是否自动重新加载 */
    autoReload?: boolean;
    /** 是否在挂载时自动加载首页 */
    immediate?: boolean;
    /** 是否启用下拉刷新 */
    pullRefresh?: boolean;
    /** 下拉刷新触发距离（px） */
    pullThreshold?: number;
    /** 上拉加载触发距离（距离底部 px） */
    loadThreshold?: number;
    /** 空状态文案 */
    emptyText?: string;
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
  }>(),
  {
  params: () => ({}),
  pageSize: 10,
  autoReload: true,
  immediate: true,
  pullRefresh: false,
  pullThreshold: 70,
  loadThreshold: 50,
  emptyText: '暂无数据',
  pullingText: '下拉刷新',
  loosingText: '释放即可刷新',
  refreshingText: '加载中...',
  loadingText: '加载中...',
  finishedText: '没有更多了~',
  errorText: '加载失败，点击重试'
});

const emit = defineEmits<{
  /** 加载成功，每次成功（含分页）都会触发 */
  success: [payload: { records: T[]; total: number; reset: boolean }];
  /** 加载失败 */
  error: [err: unknown];
  /** 列表内容变化（v-model:list 支持） */
  'update:list': [list: T[]];
}>();

const scrollRef = ref<InstanceType<typeof InfiniteScroll> | null>(null);

const list = ref<T[]>([]) as Ref<T[]>;
const loading = ref(false);
const finished = ref(false);
const isEmpty = ref(false);
const loadError = ref(false);
const total = ref(0);
const page = ref(1);
const isRefreshing = ref(false);

let requestSeq = 0;

async function load(reset = false) {
  if (reset) {
    page.value = 1;
    finished.value = false;
    isEmpty.value = false;
    // 不立即清空 list，保留旧数据直到新数据到达
  }
  loading.value = true;
  loadError.value = false;

  requestSeq += 1;
  const seq = requestSeq;

  try {
    const result = await props.fetchFn({
      page: page.value,
      pageSize: props.pageSize,
      ...props.params
    });

    if (seq !== requestSeq) return;

    const records = result?.records || [];
    if (reset) {
      // reset 时替换整个列表
      list.value = records;
      total.value = 0;
    } else {
      list.value = [...list.value, ...records];
    }
    total.value = Number(result?.total || 0);
    finished.value = list.value.length >= total.value;
    isEmpty.value = list.value.length === 0;

    emit('success', { records, total: total.value, reset });
    emit('update:list', list.value);
  } catch (err) {
    if (seq !== requestSeq) return;
    loadError.value = true;
    emit('error', err);
  } finally {
    if (seq === requestSeq) {
      loading.value = false;
    }
  }
}

async function handleRefresh() {
  isRefreshing.value = true;
  // 先让下拉刷新指示器收回
  scrollRef.value?.finishRefresh();
  // 等待 250ms 让指示器完全收回（对应 infinite-scroll.vue 的 transition 时长）
  await new Promise<void>(resolve => {
    setTimeout(() => resolve(), 250);
  });
  // 指示器收回后再开始请求新数据
  await load(true);
  isRefreshing.value = false;
}

async function handleLoad() {
  if (finished.value) {
    scrollRef.value?.finishLoad();
    return;
  }
  // 列表为空时是首次加载（page 已经是 1），其它情况 page++
  if (list.value.length > 0) {
    page.value += 1;
  }
  await load(false);
  scrollRef.value?.finishLoad();
}

function handleRetry() {
  loadError.value = false;
  if (list.value.length === 0) {
    load(true);
  } else {
    handleLoad();
  }
}

async function reload() {
  await load(true);
}

watch(
  () => props.params,
  () => {
    if (props.autoReload) {
      reload();
    }
  },
  { deep: true }
);

watch(
  list,
  async () => {
    await nextTick();
    scrollRef.value?.checkContentHeight();
  },
  { deep: true }
);

onMounted(() => {
  if (props.immediate) {
    load(true);
  }
});

defineExpose({
  /** 重新加载第一页 */
  reload,
  /** 兼容别名 */
  refresh: reload,
  /** 当前列表数据 */
  list,
  /** 加载中状态 */
  loading,
  /** 是否已加载完 */
  finished,
  /** 是否空数据 */
  isEmpty,
  /** 总条数 */
  total,
  /** 透传 v1 方法 */
  finishLoad: () => scrollRef.value?.finishLoad(),
  finishRefresh: () => scrollRef.value?.finishRefresh(),
  checkContentHeight: () => scrollRef.value?.checkContentHeight()
});
</script>

<template>
  <InfiniteScroll
    ref="scrollRef"
    :loading="loading"
    :finished="finished"
    :is-empty="isEmpty"
    :error="loadError"
    :pull-refresh="pullRefresh"
    :pull-threshold="pullThreshold"
    :load-threshold="loadThreshold"
    :empty-text="emptyText"
    :pulling-text="pullingText"
    :loosing-text="loosingText"
    :refreshing-text="refreshingText"
    :loading-text="loadingText"
    :finished-text="finishedText"
    :error-text="errorText"
    :content-loading="isRefreshing"
    @load="handleLoad"
    @refresh="handleRefresh"
    @retry="handleRetry"
  >
    <slot
      :list="list"
      :loading="loading"
      :finished="finished"
      :is-empty="isEmpty"
      :error="loadError"
      :total="total"
      :reload="reload"
    />
  </InfiniteScroll>
</template>
