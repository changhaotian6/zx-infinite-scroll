import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    vue(),
    dts({
      tsconfigPath: './tsconfig.json',
      outDir: 'dist',
      rollupTypes: true,
      // 将所有 .d.ts 合并到一个文件
      insertTypesEntry: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ZhixinInfiniteScroll',
      fileName: format => `index.${format}.js`
    },
    rollupOptions: {
      // Vue 作为 peerDependency，不打入包内
      external: ['vue'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    },
    // 生成 sourcemap 方便调试
    sourcemap: true
  }
});
