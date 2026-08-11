# 信息科技课堂资源中心

基于 Cloudflare 的课堂资源下载站 MVP。学生无需登录即可浏览和下载公开资源；教师和管理员通过后台维护资源、栏目和教师账号。

## 当前已完成

- 公共首页 `/`
- 资源列表 `/resources`
- 资源详情 `/resources/:id`
- 教师登录页 `/login`
- 管理后台原型 `/admin`
- D1 数据表 schema 与 SQL migration
- R2/D1 绑定占位配置
- 本地环境变量示例 `.dev.vars.example`

## 本地运行

需要 Node.js 22.13 或更新版本。

```powershell
pnpm install
pnpm run dev
```

如果本机 Node 版本较低，可以直接使用 Codex 自带 Node：

```powershell
C:\Users\18506\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vinext/dist/cli.js dev
```

打开 `http://localhost:3000/`。

## 构建

```powershell
pnpm run build
```

也可以直接运行：

```powershell
C:\Users\18506\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vinext/dist/cli.js build
```

## Cloudflare 资源

`.openai/hosting.json` 使用以下绑定名：

- D1: `DB`
- R2: `RESOURCE_BUCKET`

正式部署前需要在 Cloudflare 创建 D1 数据库和 R2 bucket，并把真实资源注入部署配置。不要把真实密钥、密码或 token 提交到仓库。

## 后续待实现

- 登录接口与 HttpOnly 会话 Cookie
- 公开资源 API 和下载计数
- R2 上传、替换、下载流式响应
- 教师/管理员权限校验
- 管理后台表单真实提交
- seed 命令与自动化测试
