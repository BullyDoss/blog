---
slug: example-post
title: "示例文章：技术栈迁移完成"
author: Helloworld
author_title: 技术博主
tags: [教程, Cloudflare, Docusaurus]
---

这是一篇示例文章，用于演示新博客系统的功能。

## ✨ 新功能展示

### 代码高亮

```javascript
// Worker API 示例
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    if (url.pathname === '/api/posts') {
      const posts = await env.DB.prepare('SELECT * FROM posts').all();
      return Response.json(posts.results);
    }
    
    return new Response('Hello from Cloudflare Workers!');
  },
};
```

### 列表支持

**迁移后的技术栈优势：**

1. 🚀 **Cloudflare Pages** - 全球 CDN 部署
2. ⚡ **Workers** - 无服务器 API
3. 💾 **D1 数据库** - SQLite 边缘数据库
4. 📦 **R2 存储** - 对象存储（无出口费）
5. 💬 **Giscus** - 基于 GitHub Discussions 的评论

### 图片上传功能

博客集成了 **R2 对象存储**，支持图片上传功能：

**使用方式：**
1. 在投稿页面或管理后台找到上传按钮
2. 选择图片文件（JPG/PNG/GIF/WebP，最大 5MB）
3. 图片自动上传到 Cloudflare R2 存储
4. 系统会生成 Markdown 格式的图片链接并复制到剪贴板
5. 直接粘贴到文章中即可

**优势：**
- ✅ 全球 CDN 加速，访问速度快
- ✅ 无出口费用（相比 AWS S3 节省成本）
- ✅ 自动压缩和优化
- ✅ 支持批量上传

<!--more-->

## 深入了解

### 为什么选择这个技术栈？

#### 成本效益

| 服务 | 免费额度 | 超出费用 |
|------|---------|---------|
| Pages | 无限站点 | $0 |
| Workers | 10万次请求/天 | $5/百万次 |
| D1 | 5GB + 2500万次读取/月 | $0.30/GB |
| R2 | 10GB + A类1000万次 | $0.15/GB |

**总计：个人博客完全可以免费运行！** ✅

#### 性能对比

- **旧架构**：VPS 单点部署，延迟取决于服务器位置
- **新架构**：全球边缘网络，用户访问最近的节点

预计访问速度提升 **300-500%**！

## 下一步计划

- [x] 完成基础迁移
- [ ] 添加更多自定义主题样式
- [ ] 实现全文搜索功能
- [ ] 添加 RSS 订阅支持
- [ ] 集成分析工具

---

*本文由 Docusaurus 生成，部署在 Cloudflare Pages*
