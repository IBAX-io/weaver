# Weaver 项目依赖升级与桌面版构建 — 完整总结文档

## 1. 项目概况

- **项目名称**: Weaver (原 IBAX Weaver)
- **版本**: 1.4.0
- **技术栈**: React + TypeScript + Redux + RxJS + Electron
- **目标平台**: Web 浏览器 / macOS / Windows / Linux 桌面应用
- **运行环境**: Node.js v22.16.0, macOS arm64

## 2. 升级前状态

项目使用了极为过时的依赖，无法在当前环境中启动：

| 依赖 | 升级前版本 | 升级后版本 |
|------|-----------|-----------|
| react | 16.2 | 16.14.0 |
| react-scripts-ts | 自定义 | react-scripts 5.0.1 + @craco/craco 7.1.0 |
| TypeScript | 2.8 | 4.9.5 |
| Electron | 3.x | 22.3.27 |
| RxJS | 5.x | 6.6.7 + rxjs-compat |
| redux-observable | 0.16 | 1.2.0 |
| connected-react-router | 4.x | 6.9.3 |
| styled-components | 2.x | 5.3.11 |
| node-sass | 旧版 | sass (Dart Sass) |
| Webpack | 3/4 (内置) | 5 (react-scripts 5 内置) |

## 3. 主要问题与修复方案

### 3.1 构建工具链迁移

**问题**: `react-scripts-ts` 已废弃，不兼容 Node.js 22。

**方案**: 迁移到 `react-scripts 5` + `@craco/craco` (Create React App Configuration Override)。

**关键文件**: `craco.config.js`

```javascript
// 主要配置项：
// 1. Babel preset-react: throwIfNamespace: false (允许 SVG 命名空间)
// 2. 模块解析: src/app 作为模块根目录
// 3. Webpack 5 polyfill: process, buffer, stream
// 4. CSS url() 过滤: 跳过绝对路径 (sass.css 中的 /img/*, /fonts/*)
// 5. Electron externals: electron, @electron/remote
// 6. ESM 模块: fullySpecified: false
```

### 3.2 RxJS 5 → 6 迁移

**问题**: RxJS 6 移除了 prototype 链式调用（如 `observable.flatMap()`），改为 `pipe()` 操作符模式。项目中有大量 RxJS 5 风格代码。

**方案**: 使用 `rxjs-compat` 兼容层恢复 RxJS 5 的 prototype 方法。

**关键修复**:
1. **导入顺序问题** — `import 'rxjs-compat'` 必须在 `import store` 之前执行，否则 `Observable.prototype.flatMap` 不存在
   - `src/app/store.ts` 首行添加 `import 'rxjs-compat'`
   - `src/app/index.tsx` 将 polyfill imports 移到最前

2. **类型声明** — 不需要额外声明：`rxjs-compat` 自带 `Observable` 原型方法和静态方法的类型增强（`rxjs-compat/Rx.d.ts`）。`lib/external/fsa.ts` 自己 `import 'rxjs-compat'`，保证只引入 fsa 的测试也能拿到原型方法

3. **Observable.throw → throwError** — RxJS 6 中 `Observable.throw()` 改名
   - `txExecEpic.ts`, `discoverNetworkEpic.ts`

4. **Observable.empty<never>()** → `Observable.empty()` — 18 个文件批量修复

### 3.3 redux-observable 0.16 → 1.2

**问题**: Epic 类型签名变更，`store.getState()` 不再可用。

**方案**:
1. **Epic 类型** — `Epic<Action, IRootState>` → 使用项目自定义 `Epic` 类型（26+ 个 epic 文件）
2. **StateObservable shim** — 在 `src/app/lib/external/fsa.ts` 中添加 `getState()` 兼容方法：
   ```typescript
   (StateObservable.prototype as any).getState = function() {
       return this.value;
   };
   ```
3. **ActionsObservable.ofAction** — 保留自定义 `ofAction` 方法，使用 `pipe(filter(...))` 实现

### 3.4 TypeScript 2.8 → 4.9 类型错误

修复了 100+ 个类型错误，主要分类：

| 错误类型 | 修复方式 | 影响文件数 |
|---------|---------|-----------|
| `location.state` 类型为 `unknown` | 强制转换为 `any` | 2 |
| `__esri.*` 命名空间类型缺失 | 替换为 `any` | 5 |
| `innerRef` 不存在 (styled-components v5) | 改为 `ref` | 2 |
| `import { State }` 与 `export type State` 冲突 | 使用 `export type { State }` | 10 |
| `connect()` 类型不匹配 | 添加 `as any` | 多个 |
| `FormData` 接口不兼容 | 移除 `implements` | 1 |
| `msSaveBlob` 类型缺失 | `navigator as any` | 1 |
| `crypto-js` 类型变更 | 简化导入 | 1 |
| Electron 模块声明 | 在 `_definitions.d.ts` 添加完整声明 | 1 |

### 3.5 Sass 编译器迁移

**问题**: `node-sass` 不支持 arm64，Dart Sass 不支持 `color * number` 运算。

**方案**:
- 安装 `sass` (Dart Sass) 替代 `node-sass`
- `docs.scss`: `$accent * 0.8` → `mix(#000, $accent, 20%)`（与 libsass 按通道乘 0.8 结果完全相同；`darken` 是减 HSL 亮度，会变得接近黑色）

### 3.6 CSS url() 解析问题

**问题**: Webpack 5 的 css-loader 会解析 CSS 中的 `url()` 引用。预编译的 `sass.css` 包含绝对路径（如 `url("/img/jqui/...")`），导致模块解析失败。

**方案**: 在 `craco.config.js` 中配置 css-loader 的 url filter，跳过以 `/` 开头的绝对路径：
```javascript
loader.options = {
  ...loader.options,
  url: {
    filter: (url) => !url.startsWith('/')
  }
};
```

### 3.7 配置文件缺失

**问题**: `public/settings.json` 不存在（只有 `.dist` 示例文件），应用启动时 yup 验证失败。

**方案**: 复制 `settings.json.dist` → `settings.json`

### 3.8 中文语言支持

创建 `public/locales/zh-CN.json`，包含全部 249 个翻译条目，在 `locales/index.json` 中注册并启用。

## 4. 桌面版 (Electron) 构建

### 4.1 Electron 主进程编译

**问题**: `tsconfig.json` 的 `declare module 'electron'` 覆盖了 Electron 的真实类型定义。

**方案**: 创建独立的 `tsconfig.electron.json`：
```json
{
    "extends": "./tsconfig.json",
    "compilerOptions": {
        "outDir": "build/electron",
        "module": "commonjs",
        "target": "es2020",
        "rootDir": "src/electron",
        "isolatedModules": false,
        "noEmit": false,
        "skipLibCheck": true
    },
    "include": [
        "src/electron/**/*",
        "src/defs/**/*",
        "node_modules/electron/electron.d.ts"
    ]
}
```

### 4.2 Electron API 兼容性修复

| 问题 | 修复 |
|------|------|
| `role: 'selectall'` 大小写 | → `'selectAll'` |
| `webContents.on('new-window')` 已废弃 | → `webContents.setWindowOpenHandler()` |
| `window.isMaximized` 函数引用存为 JSON | → `window.isMaximized()` 调用 |
| `nodeIntegration` 默认关闭 | 显式设置 `nodeIntegration: true, contextIsolation: false` |
| `remote` 模块被移除 | 安装 `@electron/remote`，主进程 `initialize()` + `enable()` |
| `import { remote } from 'electron'` | → `import * as remote from '@electron/remote'` |

### 4.3 Webpack Externals 配置

渲染进程中 `require('electron')` 和 `require('@electron/remote')` 被 Webpack 打包会失败。

在 `craco.config.js` 中标记为外部模块：
```javascript
webpackConfig.externals = {
    electron: 'commonjs electron',
    '@electron/remote': 'commonjs @electron/remote'
};
```

### 4.4 模块导入修复

| 模块 | 问题 | 修复 |
|------|------|------|
| `commander` | `import *` + `__importStar` 导致 `this` 丢失 | → `import commander from` |
| `lodash` | 同上 | → `import _ from` |
| `@electron/remote/main` | `__esModule: true` 导致 default import 为 undefined | → `import { initialize }` |
| `@electron/remote` (渲染端) | 同上，无 default 导出 | → `import * as remote` |

### 4.5 Electron-Builder 配置

```json
{
    "productName": "Weaver",
    "appId": "space.ibax.weaver",
    "extends": null,     // 禁用 react-cra 预设
    "files": ["**/*"],
    "directories": {
        "app": "build",
        "buildResources": "src/resources",
        "output": "releases"
    }
}
```

### 4.6 构建流程

```bash
# 1. 构建 Web 资源 (PUBLIC_URL=./ 用于 file:// 协议)
npm run build-desktop

# 2. 编译 Electron 主进程
npx tsc -p tsconfig.electron.json

# 3. 创建 build/package.json (含运行时依赖)
# 4. 在 build/ 目录安装生产依赖
cd build && yarn install --production

# 5. 打包 Electron 应用
npm run package    # 生成未打包目录
npm run release    # 生成安装包 (dmg/nsis/AppImage)
```

### 4.7 产出

- **macOS arm64**: `releases/mac-arm64/Weaver.app`
- 未签名（需要开发者证书进行代码签名）

## 5. 品牌更名

将应用名从 **IBAX** 更改为 **Weaver**：

| 文件 | 修改内容 |
|------|---------|
| `electron-builder.json` | productName, appId |
| `public/index.html` | `<title>`, `<h1>` |
| `public/manifest.json` | short_name, name |
| `src/electron/menu.ts` | 菜单 label |
| `public/locales/en-US.json` | general.title, general.title.format |
| `public/locales/zh-CN.json` | 同上 |
| `public/locales/tr-TR.json` | 同上 |

> 注：`keyring.ts` 中的 `'IBAX'` 签名验证字符串未修改，以保持密钥兼容性。

## 6. 已知问题与待办

### 6.1 控制台警告（不影响功能）
- `componentWillReceiveProps` — React 16 废弃 API 警告，来自第三方库
- `window.__TAURI_METADATA__` — 浏览器模式下的 Tauri 提示
- `KaTeX quirks mode` — KaTeX 库警告
- 233 个 ESLint 警告（unused vars, no-mixed-operators 等）

### 6.2 未来改进建议
- 升级 React 16 → 18（需大量组件迁移）
- 将 RxJS 5 链式调用迁移为 `pipe()` 操作符模式，移除 `rxjs-compat`
- 替换 `@electron/remote` 为 IPC 通信模式（安全性更好）
- 添加 macOS 代码签名和公证
- Sass `@import` 迁移为 `@use` / `@forward`（Dart Sass 3.0 将移除 @import）

## 7. 关键文件清单

| 文件 | 用途 |
|------|------|
| `craco.config.js` | Webpack/Babel 配置覆盖 |
| `tsconfig.json` | Web 端 TypeScript 配置 |
| `tsconfig.electron.json` | Electron 主进程 TypeScript 配置 |
| `electron-builder.json` | Electron 打包配置 |
| `src/app/lib/_definitions.d.ts` | 全局类型声明 (electron, @electron/remote 等) |
| `src/app/lib/external/fsa.ts` | ActionsObservable.ofAction + StateObservable.getState shim |
| `src/app/store.ts` | Redux store (rxjs-compat 首先导入) |
| `src/app/index.tsx` | 应用入口 (polyfill 导入顺序) |
| `src/electron/index.ts` | Electron 主进程入口 |
| `src/electron/windows/main.ts` | BrowserWindow 配置 (nodeIntegration, @electron/remote) |
| `public/settings.json` | 应用运行时配置（从 .dist 复制） |
| `public/locales/zh-CN.json` | 中文语言包 |
