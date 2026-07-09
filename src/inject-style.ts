// 样式自动注入
let styleInjected = false;

const cssContent = `.loading-content[data-v-d89150ba]{display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;border-radius:16px;color:var(--zx-primary-color, #1e5efd);font-size:14px}.loading-spinner[data-v-d89150ba]{width:18px;height:18px;border-radius:50%;border:2.5px solid var(--zx-primary-color, #1e5efd);border-top-color:transparent;animation:spin-d89150ba .8s linear infinite}@keyframes spin-d89150ba{to{transform:rotate(360deg)}}.loading-container.fullscreen[data-v-d89150ba]{position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#ffffff80}.empty-wrap[data-v-3c452901]{display:flex;flex-direction:column;align-items:center}.empty-image[data-v-3c452901]{width:96px;height:80px}.empty-text[data-v-3c452901]{margin:12px 0 0;color:#8c8f97;font-size:12px;line-height:22px}.infinite-scroll[data-v-bf5ca1d9]{height:100%;position:relative;min-height:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}.pull-refresh-indicator[data-v-bf5ca1d9]{position:absolute;top:-50px;left:0;right:0;height:50px;transition:transform .25s}.pull-refresh-indicator.no-transition[data-v-bf5ca1d9]{transition:none}.pull-refresh-content[data-v-bf5ca1d9]{display:flex;align-items:center;justify-content:center;height:100%;font-size:14px;color:#969799}.pull-text[data-v-bf5ca1d9]{color:var(--zx-primary-color, #1989fa);font-size:14px}.infinite-scroll-content[data-v-bf5ca1d9]{position:relative;transition:transform .25s;min-height:100%}.infinite-scroll-content.no-transition[data-v-bf5ca1d9]{transition:none}.content-loading-mask[data-v-bf5ca1d9]{position:absolute;top:0;left:0;right:0;bottom:0;background-color:#fffc;display:flex;align-items:center;justify-content:center;z-index:10;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}.load-more-indicator[data-v-bf5ca1d9]{display:flex;align-items:center;justify-content:center;min-height:50px;padding:16px 0;font-size:14px;color:#8c8f97}.finished-text[data-v-bf5ca1d9]{color:#8c8f97;font-size:14px}.error-text[data-v-bf5ca1d9]{color:#ee0a24;font-size:14px;cursor:pointer}.error-text[data-v-bf5ca1d9]:active{opacity:.7}`;

export function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-source', 'zx-infinite-scroll');
  style.textContent = cssContent;
  document.head.appendChild(style);

  styleInjected = true;
}
