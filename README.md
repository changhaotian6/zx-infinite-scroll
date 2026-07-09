# zx-infinite-scroll

Vue 3 无限滚动组件，支持下拉刷新、上拉加载。

## 特性

- ✅ 支持下拉刷新（可选）
- ✅ 支持上拉加载更多
- ✅ 自动检测内容高度不足时加载
- ✅ 防抖/节流优化
- ✅ 支持错误重试
- ✅ 完整的 TypeScript 类型支持
- ✅ 两个版本：基础组件 + 封装组件

## 安装

```bash
npm install zx-infinite-scroll
```

## 快速开始

### ⭐ 推荐：全局引入样式（最简单）

在 `main.ts` 中全局引入样式**一次**即可：

```ts
import { createApp } from 'vue';
import App from './App.vue';
import 'zx-infinite-scroll/dist/style.css'; // 👈 只需引入一次

const app = createApp(App);
app.mount('#app');
```

之后在任何组件中使用都**不需要**再引入样式：

```vue
<script setup>
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
// ✅ 不需要再引入样式
</script>

<template>
  <InfiniteScrollV2 :fetch-fn="fetchData">
    <!-- ... -->
  </InfiniteScrollV2>
</template>
```

---

### 方式一：手动引入样式（每次使用都要引入）

如果不想全局引入，每次使用时手动引入：

```vue
<script setup>
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css'; // 👈 每次都要引入
</script>
```

---

### 方式二：使用 unplugin-vue-components 自动导入（高级）

安装插件：

```bash
npm install -D unplugin-vue-components
```

配置 `vite.config.ts`：

```ts
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        // 自定义解析器
        (componentName) => {
          if (componentName.startsWith('InfiniteScroll')) {
            return {
              name: componentName,
              from: 'zx-infinite-scroll',
              sideEffects: 'zx-infinite-scroll/dist/style.css'
            };
          }
        }
      ]
    })
  ]
});
```

这样组件和样式都会自动按需导入，无需手动 import！



## 使用

### 方式一：按需引入

```vue
<script setup lang="ts">
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

interface Item {
  id: number;
  name: string;
}

const fetchData = async ({ page, pageSize }) => {
  const res = await fetch(`/api/list?page=${page}&pageSize=${pageSize}`);
  const data = await res.json();
  return {
    records: data.list,
    total: data.total
  };
};
</script>

<template>
  <InfiniteScrollV2
    :fetch-fn="fetchData"
    :pull-refresh="true"
    :page-size="20"
  >
    <template #default="{ list }">
      <div v-for="item in list" :key="item.id">
        {{ item.name }}
      </div>
    </template>
  </InfiniteScrollV2>
</template>
```

### 方式二：全局注册

```ts
import { createApp } from 'vue';
import InfiniteScrollPlugin from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';
import App from './App.vue';

const app = createApp(App);
app.use(InfiniteScrollPlugin);
app.mount('#app');
```

```vue
<template>
  <InfiniteScrollV2 :fetch-fn="fetchData">
    <!-- ... -->
  </InfiniteScrollV2>
</template>
```

## API

### InfiniteScrollV2 Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| fetchFn | `(params: FetchParams) => Promise<FetchResult<T>>` | - | 数据请求函数（必填），需返回 `{ records: T[], total: number }` |
| params | `Record<string, any>` | `{}` | 查询参数（如筛选条件），变化时自动重新加载 |
| pageSize | `number` | `10` | 每页条数 |
| autoReload | `boolean` | `true` | params 变化时是否自动重新加载 |
| immediate | `boolean` | `true` | 是否在挂载时自动加载首页 |
| pullRefresh | `boolean` | `false` | 是否启用下拉刷新 |
| pullThreshold | `number` | `70` | 下拉刷新触发距离（px） |
| loadThreshold | `number` | `50` | 上拉加载触发距离（距离底部 px） |
| emptyText | `string` | `'暂无数据'` | 空状态文案 |
| pullingText | `string` | `'下拉刷新'` | 下拉中的文案 |
| loosingText | `string` | `'释放即可刷新'` | 释放刷新的文案 |
| refreshingText | `string` | `'加载中...'` | 刷新中的文案 |
| loadingText | `string` | `'加载中...'` | 加载中的文案 |
| finishedText | `string` | `'没有更多了~'` | 加载完成的文案 |
| errorText | `string` | `'加载失败，点击重试'` | 加载失败的文案 |

#### FetchParams 类型

```typescript
interface FetchParams {
  page: number;        // 当前页码，从 1 开始
  pageSize: number;    // 每页条数
  [key: string]: any;  // 其他自定义参数（从 params prop 传入）
}
```

#### FetchResult 类型

```typescript
interface FetchResult<T> {
  records: T[];  // 当前页数据列表
  total: number; // 总条数
}
```

### InfiniteScrollV2 Events

| 事件 | 参数 | 说明 |
|------|------|------|
| success | `{ records: T[], total: number, reset: boolean }` | 加载成功时触发，每次成功（含分页）都会触发 |
| error | `err: unknown` | 加载失败时触发 |
| update:list | `list: T[]` | 列表内容变化时触发（支持 v-model:list） |

### InfiniteScrollV2 Slots

| 插槽 | 参数 | 说明 |
|------|------|------|
| default | `{ list, loading, finished, isEmpty, error, total, reload }` | 列表内容插槽 |

#### Slot 参数说明

```typescript
{
  list: T[];           // 当前列表数据
  loading: boolean;    // 是否正在加载
  finished: boolean;   // 是否已加载完所有数据
  isEmpty: boolean;    // 是否为空数据
  error: boolean;      // 是否加载失败
  total: number;       // 总条数
  reload: () => void;  // 重新加载第一页的方法
}
```

### InfiniteScrollV2 Expose

| 方法 | 类型 | 说明 |
|------|------|------|
| reload() | `() => Promise<void>` | 重新加载第一页 |
| refresh() | `() => Promise<void>` | 同 reload（别名） |
| list | `Ref<T[]>` | 当前列表数据（响应式） |
| loading | `Ref<boolean>` | 加载中状态（响应式） |
| finished | `Ref<boolean>` | 是否已加载完（响应式） |
| isEmpty | `Ref<boolean>` | 是否为空数据（响应式） |
| total | `Ref<number>` | 总条数（响应式） |
| finishLoad() | `() => void` | 完成上拉加载（透传 v1 方法） |
| finishRefresh() | `() => void` | 完成下拉刷新（透传 v1 方法） |
| checkContentHeight() | `() => void` | 检查内容高度（透传 v1 方法） |

## InfiniteScroll（基础组件）

如果需要更多控制权，可以使用基础组件：

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { InfiniteScroll } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

const list = ref([]);
const loading = ref(false);
const finished = ref(false);

const onLoad = async () => {
  // 自行实现加载逻辑
};

const onRefresh = async () => {
  // 自行实现刷新逻辑
};
</script>

<template>
  <InfiniteScroll
    :loading="loading"
    :finished="finished"
    :pull-refresh="true"
    @load="onLoad"
    @refresh="onRefresh"
  >
    <div v-for="item in list" :key="item.id">
      {{ item.name }}
    </div>
  </InfiniteScroll>
</template>
```

### InfiniteScroll Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| loading | `boolean` | `false` | 是否处于加载中状态 |
| finished | `boolean` | `false` | 是否已加载完所有数据 |
| isEmpty | `boolean` | `false` | 是否显示空状态 |
| emptyText | `string` | `'暂无数据'` | 空状态文案 |
| pullRefresh | `boolean` | `false` | 是否启用下拉刷新 |
| pullThreshold | `number` | `70` | 下拉刷新触发距离（px） |
| loadThreshold | `number` | `50` | 上拉加载触发距离（距离底部 px） |
| pullingText | `string` | `'下拉刷新'` | 下拉中的文案 |
| loosingText | `string` | `'释放即可刷新'` | 释放刷新的文案 |
| refreshingText | `string` | `'加载中...'` | 刷新中的文案 |
| loadingText | `string` | `'加载中...'` | 加载中的文案 |
| finishedText | `string` | `'没有更多了~'` | 加载完成的文案 |
| errorText | `string` | `'加载失败，点击重试'` | 加载失败的文案 |
| error | `boolean` | `false` | 是否显示错误状态 |
| contentLoading | `boolean` | `false` | 内容区域是否显示加载状态（用于下拉刷新时的遮罩） |

### InfiniteScroll Events

| 事件 | 参数 | 说明 |
|------|------|------|
| load | - | 触发上拉加载时触发 |
| refresh | - | 触发下拉刷新时触发 |
| retry | - | 点击错误重试时触发 |

### InfiniteScroll Expose

| 方法 | 类型 | 说明 |
|------|------|------|
| finishRefresh() | `() => void` | 完成下拉刷新，调用后收起刷新指示器 |
| finishPullDown() | `() => void` | 同 finishRefresh（别名） |
| finishLoad() | `() => void` | 完成上拉加载 |
| finishPullUp() | `() => void` | 同 finishLoad（别名） |
| checkContentHeight() | `() => void` | 检查内容高度，不足一屏时自动触发加载 |

### InfiniteScroll Slots

| 插槽 | 说明 |
|------|------|
| default | 列表内容 |

---

## 完整使用示例

### 示例 1：基础列表

```vue
<script setup lang="ts">
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

interface Item {
  id: number;
  name: string;
}

const fetchData = async ({ page, pageSize }) => {
  const res = await fetch(`/api/list?page=${page}&pageSize=${pageSize}`);
  const data = await res.json();
  return {
    records: data.list,
    total: data.total
  };
};
</script>

<template>
  <InfiniteScrollV2 :fetch-fn="fetchData">
    <template #default="{ list }">
      <div v-for="item in list" :key="item.id" class="item">
        {{ item.name }}
      </div>
    </template>
  </InfiniteScrollV2>
</template>
```

### 示例 2：带下拉刷新和筛选参数

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

const keyword = ref('');
const category = ref('');

const fetchData = async ({ page, pageSize, keyword, category }) => {
  const res = await fetch(
    `/api/list?page=${page}&pageSize=${pageSize}&keyword=${keyword}&category=${category}`
  );
  return await res.json();
};
</script>

<template>
  <input v-model="keyword" placeholder="搜索关键词" />
  <select v-model="category">
    <option value="">全部分类</option>
    <option value="1">分类1</option>
    <option value="2">分类2</option>
  </select>

  <InfiniteScrollV2
    :fetch-fn="fetchData"
    :params="{ keyword, category }"
    :pull-refresh="true"
    :page-size="20"
  >
    <template #default="{ list, loading, reload }">
      <div v-for="item in list" :key="item.id" class="item">
        {{ item.name }}
      </div>
      <button v-if="!loading" @click="reload">手动刷新</button>
    </template>
  </InfiniteScrollV2>
</template>
```

### 示例 3：监听事件

```vue
<script setup lang="ts">
import { InfiniteScrollV2 } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

const handleSuccess = ({ records, total, reset }) => {
  console.log('加载成功', { records, total, reset });
};

const handleError = (err) => {
  console.error('加载失败', err);
};

const fetchData = async ({ page, pageSize }) => {
  // 模拟可能失败的请求
  const res = await fetch(`/api/list?page=${page}&pageSize=${pageSize}`);
  if (!res.ok) throw new Error('请求失败');
  return await res.json();
};
</script>

<template>
  <InfiniteScrollV2
    :fetch-fn="fetchData"
    @success="handleSuccess"
    @error="handleError"
  >
    <template #default="{ list }">
      <div v-for="item in list" :key="item.id">
        {{ item.name }}
      </div>
    </template>
  </InfiniteScrollV2>
</template>
```

### 示例 4：使用基础组件（手动控制）

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { InfiniteScroll } from 'zx-infinite-scroll';
import 'zx-infinite-scroll/dist/style.css';

const scrollRef = ref();
const list = ref([]);
const loading = ref(false);
const finished = ref(false);
const error = ref(false);
const page = ref(1);
const total = ref(0);

const loadData = async () => {
  loading.value = true;
  error.value = false;
  try {
    const res = await fetch(`/api/list?page=${page.value}&pageSize=10`);
    const data = await res.json();
    list.value.push(...data.records);
    total.value = data.total;
    finished.value = list.value.length >= total.value;
    page.value++;
  } catch (err) {
    error.value = true;
  } finally {
    loading.value = false;
    scrollRef.value?.finishLoad();
  }
};

const refreshData = async () => {
  page.value = 1;
  list.value = [];
  finished.value = false;
  await loadData();
  scrollRef.value?.finishRefresh();
};

const retryLoad = () => {
  if (list.value.length === 0) {
    refreshData();
  } else {
    loadData();
  }
};
</script>

<template>
  <InfiniteScroll
    ref="scrollRef"
    :loading="loading"
    :finished="finished"
    :error="error"
    :pull-refresh="true"
    @load="loadData"
    @refresh="refreshData"
    @retry="retryLoad"
  >
    <div v-for="item in list" :key="item.id" class="item">
      {{ item.name }}
    </div>
  </InfiniteScroll>
</template>
```

## License

MIT
