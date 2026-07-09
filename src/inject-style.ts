// 样式自动注入
let styleInjected = false;

const cssContent = `.zx-loading-content{display:flex;align-items:center;justify-content:center;gap:8px;padding:6px 12px;border-radius:16px;color:#1989fa;font-size:14px}.zx-loading-spinner{width:18px;height:18px;border-radius:50%;border:2.5px solid #1989fa;border-top-color:transparent;animation:zx-spin .8s linear infinite}@keyframes zx-spin{to{transform:rotate(360deg)}}.zx-loading-container.fullscreen{position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;background-color:#ffffff80}.zx-empty-wrap{display:flex;flex-direction:column;align-items:center}.zx-empty-image{width:96px;height:80px}.zx-empty-text{margin:12px 0 0;color:#8c8f97;font-size:12px;line-height:22px}.zx-infinite-scroll{height:100%;position:relative;min-height:100%;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;touch-action:pan-y;-webkit-overflow-scrolling:touch}.zx-pull-refresh-indicator{position:absolute;top:-50px;left:0;right:0;height:50px;transition:transform .25s}.zx-pull-refresh-indicator.no-transition{transition:none}.zx-pull-refresh-content{display:flex;align-items:center;justify-content:center;height:100%;font-size:14px;color:#969799}.zx-pull-text{color:#1989fa;font-size:14px}.zx-infinite-scroll-content{position:relative;transition:transform .25s;min-height:100%}.zx-infinite-scroll-content.no-transition{transition:none}.zx-content-loading-mask{position:absolute;top:0;left:0;right:0;bottom:0;background-color:#fffc;display:flex;align-items:center;justify-content:center;z-index:10;-webkit-backdrop-filter:blur(2px);backdrop-filter:blur(2px)}.zx-load-more-indicator{display:flex;align-items:center;justify-content:center;min-height:50px;padding:16px 0;font-size:14px;color:#8c8f97}.zx-finished-text{color:#8c8f97;font-size:14px}.zx-error-text{color:#ee0a24;font-size:14px;cursor:pointer}.zx-error-text:active{opacity:.7}`;

export function injectStyle() {
  if (styleInjected || typeof document === 'undefined') return;

  const style = document.createElement('style');
  style.setAttribute('data-source', 'zx-infinite-scroll');
  style.textContent = cssContent;
  document.head.appendChild(style);

  styleInjected = true;
}
