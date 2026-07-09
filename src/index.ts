import { App } from 'vue';
import InfiniteScroll from './components/infinite-scroll.vue';
import InfiniteScrollV2 from './components/infinite-scroll-v2.vue';
import RequestLoading from './components/request-loading.vue';
import EmptyComponent from './components/empty-component.vue';

// 单独导出组件
export { InfiniteScroll, InfiniteScrollV2, RequestLoading, EmptyComponent };

// Vue plugin install 函数
export function install(app: App) {
  app.component('InfiniteScroll', InfiniteScroll);
  app.component('InfiniteScrollV2', InfiniteScrollV2);
  app.component('RequestLoading', RequestLoading);
  app.component('EmptyComponent', EmptyComponent);
}

// 默认导出（支持 app.use() 安装）
export default {
  install
};
