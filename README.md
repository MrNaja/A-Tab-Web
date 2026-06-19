# A Tab Webpage

A Tab Webpage 是 A Tab 插件数据的轻量网页版查看器。它不依赖浏览器扩展 API，适合在电脑或局域网手机上查看已经导出的书签数据。

## 功能范围

- 查看 A Tab 书签分组和书签。
- 适配手机端，手机可通过局域网访问电脑启动的本地服务。
- 支持导入 A Tab 本地 JSON 数据。
- 支持从 GitHub 云备份仓库导入数据。
- 支持语言和字体大小设置。

当前网页版刻意不包含插件本地的复杂能力，例如回收站、搜索、新分类、工作区、编辑、删除和拖拽排序。

## 启动方式

在项目根目录执行：

```powershell
cd D:\Project\A-Tab-2.8.0
python -m http.server 4177 --directory .\webpage
```

电脑本机访问：

```text
http://127.0.0.1:4177
```

局域网手机访问时，手机和电脑需要连接同一个 Wi-Fi。先查看电脑局域网 IP：

```powershell
ipconfig
```

然后在手机浏览器打开：

```text
http://<电脑局域网IP>:4177
```

例如：

```text
http://192.168.31.7:4177
```

如果手机打不开，通常是 Windows 防火墙拦截了 Python 或端口 `4177`。

## 导入本地数据

1. 在插件设置中导出 A Tab 数据，得到 JSON 文件。
2. 打开网页版。
3. 点击 header 右侧的设置图标，进入自定义设置。
4. 在 `导入本地数据` 中点击 `选择文件`。
5. 选择 A Tab 导出的 JSON 文件。

导入后，数据会保存到当前浏览器的 `localStorage`，刷新页面后仍可查看。

## 导入 GitHub 数据

网页版复用插件 GitHub 云同步的备份约定：

- 仓库名：`a-tab-backup`
- 文件路径：`backup.json`
- 读取位置：当前 token 对应 GitHub 用户名下的仓库

使用步骤：

1. 点击 header 右侧的设置图标。
2. 在 `导入 Github 数据` 中点击 `配置`。
3. 在 HTTPS 或本机 `localhost` 页面中输入 GitHub Personal Access Token。
4. 保存配置。保存时会请求 GitHub `/user` 校验 token。
5. 点击 `导入`。
6. 确认覆盖当前本地书签后，网页会下载 `backup.json` 并覆盖本地数据。

如果未配置 token，点击 `导入` 会提示先配置。

出于凭据安全考虑，GitHub 导入在局域网 HTTP 地址（例如 `http://192.168.x.x:4177`）下会被禁用。该场景仍可查看已导入的数据或使用本地 JSON 导入；如需在其他设备使用 GitHub 导入，必须通过 HTTPS 提供页面。

建议 token 至少具备读取私有仓库内容的权限。如果仓库是私有仓库，细粒度 token 需要允许读取 `a-tab-backup` 仓库内容。

## 本地存储

网页版使用浏览器存储保存：

- `a-tab-web:data`：导入后的书签和分组数据。
- `a-tab-web:preferences`：语言和字体大小设置。
- `sessionStorage` 中的 `a-tab-web:github-session-config`：当前标签页会话的 GitHub token 配置。

GitHub token 不写入 `localStorage`，关闭标签页后会由浏览器清除。页面启动时也会主动删除旧版本可能遗留在 `a-tab-web:github-config` 中的 token。即便如此，也不要在不可信设备上配置 token。

## 数据兼容

导入数据会经过 `webpage/js/services/import-service.js` 规范化处理：

- 支持 A Tab 标准导出结构：`bookmarks`、`groups`、`settings`。
- 支持只有 `bookmarks` 的简化 JSON。
- 自动过滤回收站分组和已删除书签。
- 支持分隔线：`type: "divider"`。
- 支持书签颜色标记：`colorState`。
- 仅保留绝对 `http://` 或 `https://` 书签 URL，过滤相对地址和其他协议。
- `sys:start_page` 是唯一允许导入的保留命名空间分组；其他 `sys:*` 和 `view:*` 分组会被拒绝，其有效书签回退到起始页。
- 当数据缺少起始页分组时，会自动补充 `sys:start_page`。

## 目录结构

```text
webpage/
├── index.html
├── css/
│   ├── tokens.css        # 设计令牌
│   ├── base.css          # 基础样式
│   ├── layout.css        # 页面布局
│   ├── components.css    # 组件样式
│   └── responsive.css    # 响应式样式
└── js/
    ├── app.js            # 应用入口和事件绑定
    ├── core/             # 常量、DOM 工具、i18n
    ├── services/         # 数据导入、GitHub、存储、favicon
    ├── state/            # 轻量状态和 selectors
    └── ui/               # 视图渲染和弹窗
```

## 维护约定

- 保持静态网页自包含，不依赖扩展运行时 API。
- 数据解析和外部请求放在 `js/services/`。
- DOM 渲染放在 `js/ui/`。
- 状态变更集中通过 `js/state/store.js`。
- 所有 `webpage/js/` 模块必须通过独立的 strict `checkJs` 类型检查。
- 新增导入格式时，优先扩展 `import-service.js` 并添加测试。
- 新增视觉样式时，优先复用 `tokens.css` 中的设计令牌。
- 用户可见流程应同步更新桌面端和移动端 Playwright 用例。

## 测试

运行网页版相关测试：

```powershell
npx vitest run tests/webpage/import-service.test.js tests/webpage/github-service.test.js tests/webpage/storage-service.test.js
```

运行网页版 strict 类型检查：

```powershell
npm run typecheck:webpage
```

运行桌面端和移动端浏览器测试：

```powershell
npm run test:webpage-e2e
```

运行完整单元测试：

```powershell
npm test
```

运行发布前完整门禁（lint、扩展与网页版类型检查、单元测试、网页版 E2E、扩展 smoke）：

```powershell
npm run release:check
```
