# 发布到 NPM 的步骤

## 发布前准备

1. **登录 NPM 账号**
   ```bash
   npm login
   ```

2. **验证账号**
   ```bash
   npm whoami
   ```

3. **检查包名是否被占用**（scoped 包需要组织权限）
   ```bash
   npm view @zhixin/infinite-scroll
   ```
   如果返回 404 则可用

4. **更新版本号**（根据语义化版本）
   ```bash
   npm version patch  # 修复 bug：1.0.0 -> 1.0.1
   npm version minor  # 新功能：1.0.0 -> 1.1.0
   npm version major  # 破坏性更新：1.0.0 -> 2.0.0
   ```

## 发布包

### 公开包（免费）
```bash
npm publish --access public
```

### 私有包（需要付费账号）
```bash
npm publish
```

## 发布后验证

1. **在 npmjs.com 查看**
   https://www.npmjs.com/package/@zhixin/infinite-scroll

2. **安装测试**
   ```bash
   npm install @zhixin/infinite-scroll
   ```

## 更新包

修改代码后：
```bash
npm run build
npm version patch  # 或 minor/major
npm publish --access public
```

## 撤销发布（24小时内）

```bash
npm unpublish @zhixin/infinite-scroll@1.0.0
```

⚠️ 警告：已发布超过 24 小时的包无法撤销，只能弃用：
```bash
npm deprecate @zhixin/infinite-scroll@1.0.0 "This version is deprecated"
```

## 当前包信息

- **包名**: @zhixin/infinite-scroll
- **版本**: 1.0.0
- **入口**: dist/index.es.js (ESM), dist/index.umd.js (UMD)
- **类型**: dist/index.d.ts
- **样式**: dist/style.css
