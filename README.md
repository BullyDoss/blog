# BullyDoss 的不务正业笔记

**基于 Cloudflare 全家桶的现代化博客系统**

> 技术栈：Cloudflare Pages + Docusaurus + Workers + D1 + R2

**线上地址**: <https://blog.bullydoss.com>

***

## \[!] 重要说明 - 私有仓库声明

**Worker 后端服务已迁移至私有仓库**

- **原因**: Worker 代码包含敏感配置信息（数据库 ID、R2 配置、管理员凭据等），不适合公开
- **私有仓库地址**: <https://github.com/BullyDoss/blog-worker-private>
- **访问权限**: 仅限仓库所有者

### 敏感信息清单

以下信息已移至私有仓库或 Wrangler Secrets：

| 信息类型                 | 示例                      | 存储位置               |
| -------------------- | ----------------------- | ------------------ |
| D1 数据库 ID            | `790e82a4-...`          | wrangler.toml (私有) |
| R2 公开 URL            | `pub-b0a9b33e...r2.dev` | wrangler.toml (私有) |
| GitHub Client Secret | `ghp_xxxxxx`            | Wrangler Secrets   |
| 管理员密码                | `ADMIN_PASSWORD`        | Wrangler Secrets   |
| JWT 密钥               | `JWT_SECRET`            | Wrangler Secrets   |
| GitHub Client ID     | `Ov23liL4...`           | 前端配置 (已脱敏)         |

**安全建议**: 如需部署此项目，请务必：

1. 创建自己的 Cloudflare 账号
2. 生成新的数据库和 R2 存储桶
3. 设置强密码和随机密钥
4. 不要使用任何默认值或硬编码的凭证

***

## 项目结构

```
Blog/
├── blog/                        # Docusaurus 博客前端
│   ├── src/                     # 源代码
│   │   ├── components/          # React 组件
│   │   │   ├── BlogSidebarNav/  # 博客侧边栏导航
│   │   │   ├── CategoryNav/     # 分类导航卡片
│   │   │   ├── EnhancedBlogSidebar/  # 增强版侧边栏
│   │   │   ├── GitHubLogin/     # GitHub OAuth 登录
│   │   │   ├── ImageUploader/   # 图片上传组件（R2）
│   │   │   └── SubmitForm/      # 投稿表单组件
│   │   ├── pages/               # 页面
│   │   │   ├── index.tsx        # 博客主页
│   │   │   ├── admin.tsx        # 管理后台页面
│   │   │   ├── submit.tsx       # 投稿页面
│   │   │   └── github-callback.tsx  # GitHub 回调
│   │   ├── theme/                # 主题覆盖
│   │   │   ├── Navbar/index.tsx  # 自定义导航栏（含搜索）
│   │   │   └── BlogSidebar/index.js  # 自定义侧边栏
│   │   ├── css/custom.css       # 全局样式
│   │   └── client/config.js     # 客户端配置注入
│   ├── functions/               # Cloudflare Pages Functions
│   │   ├── _lib.js              # 共享工具函数
│   │   └── api/                 # API 路由
│   │       ├── admin/login.js   # 管理员登录
│   │       └── admin/posts.js   # 文章管理 API
│   ├── static/                  # 静态资源
│   │   ├── img/                 # 图片（Logo、头像）
│   │   └── js/config.js         # 运行时配置（API地址、GitHub Client ID）
│   ├── docusaurus.config.js     # Docusaurus 主配置
│   ├── wrangler.toml            # Pages Functions 配置
│   ├── package.json             # 依赖管理
│   └── tsconfig.json            # TypeScript 配置
│
├── worker/                      # Cloudflare Worker 后端服务
│   ├── src/index.js             # API 主逻辑（文章、评论、投稿、R2）
│   ├── wrangler.toml           # Worker 配置（D1、R2、环境变量）
│   ├── package.json             # 依赖管理
│   └── .gitignore               # Worker 忽略规则
│
├── .github/workflows/           # CI/CD 自动部署
│   ├── deploy.yml              # 博客部署工作流
│   └── deploy-worker.yml       # Worker 部署工作流
│
├── .gitignore                   # Git 忽略规则
└── README.md                   # 本文件
```

***

## 核心功能

### 已实现功能

| 功能            | 技术实现                    | 说明                         |
| ------------- | ----------------------- | -------------------------- |
| **博客文章系统**    | Docusaurus + Worker API | Markdown 写作，支持分类标签、实时搜索    |
| **移动端优化**     | 自定义响应式布局                | 侧边栏抽屉式导航、独立滚动、搜索过滤         |
| **评论系统**      | 内嵌评论组件                  | 支持登录后发表评论                  |
| **用户投稿**      | Worker API + D1         | 前端提交 -> 后台审核 -> 发布展示       |
| **图片上传**      | R2 对象存储                 | 支持 JPG/PNG/GIF/WebP，最大 5MB |
| **管理后台**      | Docusaurus 内嵌页          | 文章 CRUD、投稿审核               |
| **GitHub 登录** | OAuth 集成                | 安全的用户认证                    |
| **自动部署**      | GitHub Actions          | 推送 main -> 自动构建部署          |
| **全球 CDN**    | Cloudflare Pages        | 边缘节点加速                     |

### 文章分类

| 分类   | 标识           | 描述     |
| ---- | ------------ | ------ |
| 学习笔记 | 记录知识，沉淀思考    | <br /> |
| 思维风暴 | 提问、分享想法、碰撞灵感 | <br /> |
| 夸夸其谈 | 分享生活，记录瞬间    | <br /> |
| 打怪经验 | 复盘成长，积累阅历    | <br /> |
| 投稿专区 | 精选投稿内容展示     | <br /> |

***

## API 接口（Worker）

| 方法       | 路径                     | 说明       | 认证  |
| -------- | ---------------------- | -------- | --- |
| `GET`    | `/api/posts`           | 获取文章列表   | 公开  |
| `GET`    | `/api/posts/:slug`     | 获取文章详情   | 公开  |
| `POST`   | `/api/submit`          | 用户投稿     | 公开  |
| `POST`   | `/api/images/upload`   | 上传图片到 R2 | 公开  |
| `POST`   | `/api/admin/login`     | 管理员登录    | 公开  |
| `GET`    | `/api/admin/posts`     | 获取所有文章   | JWT |
| `POST`   | `/api/admin/posts`     | 创建文章     | JWT |
| `PUT`    | `/api/admin/posts/:id` | 更新文章     | JWT |
| `DELETE` | `/api/admin/posts/:id` | 删除文章     | JWT |

***

## 快速开始

### 本地开发

```bash
# 1. 启动 Docusaurus 博客（前端）
cd blog
npm install
npm start
# 访问 http://localhost:3000

# 2. 启动 Worker API（后端）- 新终端
cd worker
npm install
npx wrangler dev
# 访问 http://localhost:8787
```

***

## 部署指南

### 自动部署（推荐）

项目已配置 GitHub Actions，推送代码自动部署：

```bash
git add .
git commit -m "更新内容"
git push origin main
# 2-3 分钟后自动部署完成！
```

**查看部署状态**: GitHub 仓库 -> Actions

### 手动部署

```bash
# 部署博客前端
cd blog
npm run build
npx wrangler pages deploy ./build --project-name=blog

# 部署 Worker API
cd ../worker
npx wrangler deploy
```

***

## 核心配置文件

### 1. Docusaurus 配置 ([`blog/docusaurus.config.js`](blog/docusaurus.config.js))

```javascript
module.exports = {
  title: 'BullyDoss的不务正业笔记',
  tagline: '学习笔记 · 思维风暴 · 夸夸其谈 · 打怪经验',
  url: 'https://blog.bullydoss.com',

  // ...
};
```

### 2. Worker 配置 ([`worker/wrangler.toml`](worker/wrangler.toml))

```toml
name = "blog-api"

[vars]
JWT_SECRET = "your-secret-key"          # 必须修改！
CORS_ORIGIN = "https://blog.bullydoss.com"

[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "your-database-id"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "blog-images"
```

### 3. 运行时配置 ([`blog/static/js/config.js`](blog/static/js/config.js))

```javascript
window.__CONFIG__ = {
  apiBaseUrl: 'https://api.bullydoss.com'
};
window.__GITHUB_CLIENT_ID__ = 'Ov23liL4aPBlHQhU3WTE';
```

***

## 日常使用

### 发布新文章

通过管理后台创建文章，或直接在数据库中添加记录。

### 使用管理后台

访问博客首页 -> 点击管理入口 -> GitHub 登录即可使用。

***

## 成本估算

| 服务                   | 额度                      |
| -------------------- | ----------------------- |
| **Cloudflare Pages** | 无限静态站点                  |
| **Workers**          | 10 万次请求/天               |
| **D1 数据库**           | 5GB 存储 + 2500万次读取/月     |
| **R2 存储**            | 10GB 存储 + 1000万次 A类操作/月 |

***

## 故障排查

### 构建失败

```bash
cd blog
rm -rf node_modules .docusaurus build
npm install
npm run build
```

### Worker 本地调试

```bash
cd worker
npx wrangler dev          # 本地开发模式
npx wrangler tail         # 查看实时日志
```

***

##
