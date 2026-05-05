# 🚀 BullyDoss 的博客

**基于 Cloudflare 全家桶的现代化博客系统**

> 技术栈：Cloudflare Pages + Docusaurus + Workers + D1 + R2 + Giscus

✨ **线上地址**: [https://blog-7m3.pages.dev/](https://blog-7m3.pages.dev/)

---

## 📁 项目结构

```
Blog/
├── blog/                        # 🎯 Docusaurus 博客前端（主项目）
│   ├── blog/                   # Markdown 文章目录
│   │   └── YYYY-MM-DD-slug/    # 文章文件夹
│   │       ├── blog-post.md    # 文章内容（完整版）
│   │       └── index.md        # 文章摘要（列表页显示）
│   ├── src/
│   │   ├── components/         # React 组件
│   │   │   ├── SubmitForm/     # 投稿表单组件
│   │   │   └── ImageUploader/  # 图片上传组件（R2）
│   │   ├── pages/              # 自定义页面
│   │   │   ├── admin.tsx       # 管理后台页面
│   │   │   └── submit.tsx      # 投稿页面
│   │   ├── css/custom.css      # 全局样式
│   │   └── client/config.js    # 客户端配置（API 地址等）
│   ├── functions/              # Cloudflare Pages Functions
│   │   └── api/                # API 路由（管理后台接口）
│   ├── static/img/             # 静态资源（Logo 等）
│   ├── docusaurus.config.js    # ⚙️ Docusaurus 主配置
│   ├── wrangler.toml           # Worker 配置（Pages Functions）
│   └── package.json
│
├── worker/                      # 🔧 Cloudflare Worker API（后端服务）
│   ├── src/index.js            # API 主入口（315 行）
│   ├── schema.sql              # D1 数据库结构
│   ├── wrangler.toml           # ⚙️ Worker 配置（D1、R2、环境变量）
│   └── package.json
│
├── admin/                       # 🔐 管理后台（独立部署）
│   └── index.html              # 管理界面
│
├── scripts/                     # 🛠️ 工具脚本
│   └── export-mysql.js         # MySQL → Markdown 迁移工具
│
├── .github/workflows/           # 🔄 CI/CD 自动部署
│   └── deploy.yml              # GitHub Actions 工作流
│
├── setup-cloudflare.bat         # ⚡ Windows: 一键配置 Cloudflare 服务
├── deploy-admin.bat             # 🚀 Windows: 部署管理后台
├── MIGRATION_GUIDE.md           # 📖 详细迁移指南（推荐阅读）
└── README.md                    # 📄 本文件
```

---

## 🎯 核心功能

### ✅ 已实现功能

| 功能 | 技术实现 | 说明 |
|------|----------|------|
| **📝 博客文章系统** | Docusaurus Blog | Markdown 写作，支持代码高亮、分类标签 |
| **💬 评论系统** | Giscus | 基于 GitHub Discussions，无需后端 |
| **📤 用户投稿** | Worker API + D1 | 前端提交 → 后台审核 → 发布展示 |
| **🖼️ 图片上传** | R2 对象存储 | 支持 JPG/PNG/GIF/WebP，最大 5MB |
| **🔐 管理后台** | Worker API + JWT | 文章 CRUD、投稿审核、图片管理 |
| **🔄 自动部署** | GitHub Actions | 推送 main 分支 → 自动构建部署 |
| **⚡ 全球 CDN** | Cloudflare Pages | 边缘节点加速，访问速度提升 300%+ |

### 🔌 API 接口（Worker）

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| `GET` | `/api/posts` | 获取文章列表 | ❌ 公开 |
| `GET` | `/api/posts/:slug` | 获取文章详情 | ❌ 公开 |
| `POST` | `/api/submit` | 用户投稿 | ❌ 公开 |
| `POST` | `/api/images/upload` | 上传图片到 R2 | ❌ 公开 |
| `POST` | `/api/admin/login` | 管理员登录 | ❌ 公开 |
| `GET` | `/api/admin/posts` | 获取所有文章 | ✅ JWT |
| `POST` | `/api/admin/posts` | 创建文章 | ✅ JWT |
| `PUT` | `/api/admin/posts/:id` | 更新文章 | ✅ JWT |
| `DELETE` | `/api/admin/posts/:id` | 删除文章 | ✅ JWT |

---

## 🚀 快速开始

### 方式一：本地开发

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

### 方式二：一键配置 Cloudflare（Windows）

```bash
# 运行配置向导
setup-cloudflare.bat
```

该脚本会自动：
1. ✅ 登录 Cloudflare 账户
2. ✅ 创建 D1 数据库 (`blog-db`)
3. ✅ 创建 R2 存储桶 (`blog-images`)
4. ✅ 初始化数据库表结构
5. ✅ 安装 Worker 依赖

---

## 📦 部署指南

### 自动部署（推荐）✅

项目已配置 GitHub Actions，推送代码自动部署：

```bash
git add .
git commit -m "更新文章"
git push origin main
# 🎉 2-3 分钟后自动部署完成！
```

**查看部署状态**: GitHub 仓库 → Actions → Deploy Blog to Cloudflare Pages

### 手动部署

```bash
# 部署博客前端
cd blog
npm run build
npx wrangler pages deploy ./build --project-name=blog

# 部署 Worker API
cd ../worker
npx wrangler deploy

# 部署管理后台
npx wrangler pages deploy ../admin --project-name=blog-admin
```

---

## ⚙️ 核心配置文件

### 1. Docusaurus 配置 ([`blog/docusaurus.config.js`](blog/docusaurus.config.js))

```javascript
module.exports = {
  title: 'Helloworld的笔记',           // 博客标题
  tagline: '学习笔记 · 思维风暴 · 生活碎片',
  url: 'https://blog-7m3.pages.dev',   // 线上地址
  
  customFields: {
    apiBaseUrl: 'https://your-worker.workers.dev',  // Worker API 地址
    r2BucketUrl: 'https://pub-xxxxx.r2.dev',       // R2 公开地址
  },
  
  // Giscus 评论配置
  giscus: {
    repo: 'your-username/your-repo',
    repoId: 'xxx',
    categoryId: 'xxx',
  },
};
```

### 2. Worker 配置 ([`worker/wrangler.toml`](worker/wrangler.toml))

```toml
name = "blog-api"

[vars]
JWT_SECRET = "your-secret-key"          # ⚠️ 必须修改！
CORS_ORIGIN = "https://blog-7m3.pages.dev"

[[d1_databases]]
binding = "DB"
database_name = "blog-db"
database_id = "your-database-id"        # 从 Cloudflare 获取

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "blog-images"
```

---

## 📝 日常使用

### 发布新文章

1. 在 `blog/blog/` 下创建文件夹：`YYYY-MM-DD-slug-name`
2. 添加 `blog-post.md` 文件：

```markdown
---
slug: my-first-post
title: 我的第一篇文章
date: 2024-01-15
tags: [学习笔记, 教程]
author: BullyDoss
---

这里是文章内容...
```

3. 提交并推送：
```bash
git add .
git commit -m "新增文章：我的第一篇文章"
git push origin main
```
4. 🎉 **2-3 分钟后自动上线！**

### 使用管理后台

**地址**: `https://your-worker-url.workers.dev/admin`  
**默认账号**: `admin / admin123456`  
⚠️ **请立即修改密码！**

或通过 API 操作：

```bash
# 登录获取 Token
curl -X POST https://your-worker.workers.dev/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123456"}'

# 使用 Token 创建文章
curl -X POST https://your-worker.workers.dev/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"slug":"test","title":"测试","content":"内容","category":"notes"}'
```

---

## 💰 成本估算（完全免费！）

| 服务 | 免费额度 | 个人博客是否够用 |
|------|----------|------------------|
| **Cloudflare Pages** | 无限静态站点 | ✅✅✅ |
| **Workers** | 10 万次请求/天 | ✅✅✅ |
| **D1 数据库** | 5GB 存储 + 2500万次读取/月 | ✅✅✅ |
| **R2 存储** | 10GB 存储 + 1000万次 A类操作/月 | ✅✅✅ |
| **总计** | **$0/月** | 🎉 **完全免费** |

---

## 🔧 故障排查

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

### Giscus 评论不显示

1. ✅ 确认 GitHub 仓库是**公开的**
2. ✅ 确认已启用 **Discussions** 功能
3. ✅ 检查 `repoId` 和 `categoryId` 是否正确
4. 📋 查看 [Giscus 配置向导](https://giscus.app) 重新生成

---

## 📚 相关文档

- 📘 **详细迁移指南**: [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- 🌐 **Docusaurus 文档**: https://docusaurus.io/
- ☁️ **Cloudflare Workers**: https://developers.cloudflare.com/workers/
- 💾 **D1 数据库**: https://developers.cloudflare.com/d1/
- 📦 **R2 存储**: https://developers.cloudflare.com/r2/
- 💬 **Giscus 评论**: https://giscus.app/

---

## 📊 项目状态

- ✅ Docusaurus 博客系统 - **运行中**
- ✅ Cloudflare Worker API - **已部署**
- ✅ 自动化部署 (GitHub Actions) - **已配置**
- ✅ Giscus 评论系统 - **已集成**
- 🔄 R2 图片存储 - **待配置**
- 📝 管理后台 UI - **基础版本**

---

## 📄 License

MIT License

---

**Built with ❤️ using Cloudflare & Docusaurus**
