# Cloudflare Pages + Docusaurus + R2 + Giscus + Workers 迁移指南

## 📋 项目架构总览

```
Blog/
├── blog/                    # Docusaurus 博客主项目 (前端)
│   ├── blog/               # Markdown 文章目录
│   ├── src/                # React 组件和页面
│   ├── static/             # 静态资源
│   ├── docusaurus.config.js # 主配置文件
│   └── package.json
├── worker/                  # Cloudflare Worker API (后端)
│   ├── src/index.js        # API 主入口
│   ├── schema.sql          # 数据库结构
│   └── wrangler.toml       # Worker 配置
├── scripts/                 # 迁移工具脚本
│   └── export-mysql.js     # MySQL 导出工具
└── .github/workflows/       # CI/CD 自动部署
```

## 🚀 快速开始步骤

### 第一步：准备 Cloudflare 账户和服务

#### 1.1 登录 Cloudflare Dashboard
- 访问 https://dash.cloudflare.com
- 登录你的 Cloudflare 账户（如果没有，先注册）

#### 1.2 创建 D1 数据库
1. 在左侧菜单选择 **Workers & Pages**
2. 点击 **D1 SQL Database** 标签
3. 点击 **Create Database**
4. 名称输入：`blog-db`
5. 点击 **Create**

**记录下数据库 ID**（在数据库详情页可以看到）

#### 1.3 初始化数据库表结构
```bash
# 安装 Wrangler CLI
npm install -g wrangler

# 登录 Cloudflare
wrangler login

# 执行数据库初始化脚本
cd worker
wrangler d1 execute blog-db --file=./schema.sql
```

#### 1.4 创建 R2 存储桶
1. 在左侧菜单选择 **R2 对象存储**
2. 点击 **Create Bucket**
3. 名称输入：`blog-images`
4. 位置选择：**APAC (Asia-Pacific)** 会更快
5. 点击 **Create Bucket**

**重要：启用公开访问**
1. 进入刚创建的存储桶
2. 点击 **Settings** 标签
3. 找到 **Public Access** 部分
4. 点击 **Allow Access**
5. 记录下公开访问 URL（格式：`https://pub-xxxxx.r2.dev`）

### 第二步：配置 Cloudflare Worker

#### 2.1 安装依赖并部署 Worker
```bash
cd worker
npm install

# 编辑 wrangler.toml，填入实际值：
# - YOUR_D1_DATABASE_ID (从第一步获取)
# - YOUR_R2_PUBLIC_URL (从第一步获取)
# - JWT_SECRET (设置一个强密码)

# 部署 Worker
wrangler deploy
```

**记录下 Worker URL**（部署成功后会显示）

### 第三步：配置 Docusaurus 博客

#### 3.1 安装依赖并启动开发服务器
```bash
cd blog
npm install

# 启动本地开发
npm start
```

浏览器打开 http://localhost:3000 查看效果

#### 3.2 配置 Giscus 评论系统
1. 访问 https://giscus.app
2. 步骤一：输入你的 **GitHub 仓库地址**（必须是公开仓库）
3. 步骤二：选择 **Discussions** 作为分类
4. 步骤三：选择 **Announcements** 分类（或创建新分类）
5. 复制生成的 `data-repo`, `data-repo-id`, `data-category-id`

编辑 `blog/docusaurus.config.js`，填入：
```javascript
giscus: {
  repo: 'YOUR_GITHUB_USERNAME/YOUR_REPO_NAME',
  repoId: 'YOUR_REPO_ID',           // 从 giscus 复制
  category: 'Announcements',
  categoryId: 'YOUR_CATEGORY_ID',   // 从 giscus 复制
  // ... 其他配置保持默认
},
```

### 第四步：迁移现有数据

#### 4.1 从 MySQL 导出文章
确保你的 MySQL 服务正在运行，然后执行：

```bash
cd scripts
node export-mysql.js
```

这会将所有已发布的文章导出为 Markdown 文件到 `blog/blog/` 目录。

#### 4.2 手动检查和调整
- 打开 `blog/blog/` 目录查看导出的文件
- 检查 Markdown 格式是否正确
- 调整 frontmatter 中的标签和分类
- 如果有图片链接，需要更新为 R2 地址

#### 4.3 迁移图片到 R2
你可以使用以下方法之一：

**方法 A：使用 R2 控制台上传**
1. 进入 Cloudflare R2 控制台
2. 选择 `blog-images` 存储桶
3. 手动上传所有图片文件
4. 更新 Markdown 中的图片路径为 R2 URL

**方法 B：编写批量上传脚本**（需要额外开发）

### 第五步：配置 Cloudflare Pages 部署

#### 5.1 连接 GitHub 仓库
1. 在 Cloudflare Dashboard 选择 **Pages**
2. 点击 **Create Project**
3. 选择 **Connect to Git**
4. 授权并选择你的博客仓库
5. 配置构建设置：
   - **Build command**: `cd blog && npm run build`
   - **Build output directory**: `blog/build`
6. 点击 **Save and Deploy**

#### 5.2 配置环境变量（可选）
如果 Worker API 需要环境变量，在 Pages 设置中添加：
- `API_BASE_URL`: 你的 Worker URL
- `R2_BUCKET_URL`: 你的 R2 公开访问 URL

#### 5.3 设置自定义域名（推荐）
1. 在 Pages 项目设置中点击 **Custom Domains**
2. 添加你的域名（如 `blog.yourdomain.com`）
3. 按照 DNS 配置说明添加 CNAME 记录

### 第六步：配置自动部署（GitHub Actions）

#### 6.1 创建 GitHub Secrets
在你的 GitHub 仓库中添加以下 Secrets：

1. 进入仓库 → Settings → Secrets and variables → Actions
2. 点击 **New repository secret**

添加以下密钥：
- `CLOUDFLARE_API_TOKEN`: 
  - 在 Cloudflare Dashboard → My Profile → API Tokens
  - 创建 Token，权限选择 **Edit Cloudflare Workers**
- `CLOUDFLARE_ACCOUNT_ID`:
  - 在 Cloudflare Dashboard 右侧栏可以找到

#### 6.2 触发部署
现在每次推送代码到 `main` 分支都会自动部署！

手动触发：
1. 进入仓库 → Actions
2. 选择 **Deploy Blog to Cloudflare Pages**
3. 点击 **Run workflow**

## 🔧 常见配置调整

### 修改博客信息
编辑 `blog/docusaurus.config.js`：
```javascript
title: '你的博客名称',
tagline: '副标题描述',
url: 'https://your-blog.pages.dev',
baseUrl: '/',
```

### 自定义主题颜色
在 `blog/src/css/custom.css` 中添加：
```css
:root {
  --ifm-color-primary: #2563eb;
  --ifm-color-primary-dark: #1d4ed8;
  /* 其他颜色变量 */
}
```

### 添加导航项
在 `docusaurus.config.js` 的 `navbar.items` 中添加。

### 修改每页显示文章数
```javascript
blog: {
  postsPerPage: 10, // 改为你想要的数字
}
```

## 📝 日常使用指南

### 发布新文章
1. 在 `blog/blog/` 目录下新建文件夹，命名格式：`YYYY-MM-DD-slug-name`
2. 在文件夹内创建 `blog-post.md` 文件
3. 编写内容（参考已有文章的格式）
4. 提交代码并推送到 main 分支
5. 自动部署会在几分钟后完成

### 使用管理后台
访问：`https://your-worker-url.workers.dev/admin`（需要单独开发前端）

或者直接通过 API 管理：
```bash
# 登录获取 token
curl -X POST https://your-worker.workers.dev/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'

# 使用 token 创建文章
curl -X POST https://your-worker.workers.dev/api/admin/posts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"slug":"test","title":"测试","content":"内容","category":"notes"}'
```

### 审核用户投稿
目前需要通过 D1 数据库控制台或 API 手动审核：
```bash
# 查看 pending 状态的文章
wrangler d1 execute blog-db --command="SELECT * FROM posts WHERE status='pending'"

# 发布投稿
wrangler d1 execute blog-db --command="UPDATE posts SET status='published' WHERE id=POST_ID"
```

## ⚠️ 重要注意事项

### 安全性
1. **必须更改默认密码**：修改 `worker/wrangler.toml` 中的 `JWT_SECRET`
2. **生产环境不要硬编码密钥**：使用 Cloudflare 的加密环境变量
3. **限制 R2 公开访问**：只允许必要的图片类型

### 性能优化
1. **图片压缩**：上传前压缩图片（建议 < 200KB）
2. **使用 WebP 格式**：比 JPEG/PNG 小 30-50%
3. **CDN 缓存**：Cloudflare Pages 自动提供 CDN 加速
4. **D1 免费额度**：每月 5GB 存储，2500 万次读取

### 成本估算（免费层足够个人博客）
- **Cloudflare Pages**: 免费（无限静态站点）
- **Workers**: 每天 10 万次请求免费
- **D1**: 每月 5GB 存储 + 2500万次读取免费
- **R2**: 每月 10GB 存储 + A 类操作 1000万次免费
- **总计**: **$0/月** ✅

## 🆘 故障排查

### 构建失败
```bash
# 清除缓存重新构建
cd blog
rm -rf node_modules .docusaurus build
npm install
npm run build
```

### Worker 部署失败
```bash
# 检查 wrangler 配置
cd worker
wrangler whoami  # 确认登录状态
wrangler deploy --dry-run  # 测试部署
```

### 图片无法访问
1. 检查 R2 存储桶是否启用了公开访问
2. 确认 URL 格式正确：`https://pub-xxxxx.r2.dev/image.jpg`
3. 检查 CORS 配置（如果前端跨域请求）

### Giscus 评论不显示
1. 确认 GitHub 仓库是公开的
2. 检查 Discussions 功能是否启用
3. 验证 repoId 和 categoryId 是否正确
4. 查看浏览器控制台的错误信息

## 📚 进一步学习资源

- [Docusaurus 官方文档](https://docusaurus.io/)
- [Cloudflare Workers 文档](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 文档](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 文档](https://developers.cloudflare.com/r2/)
- [Giscus 配置向导](https://giscus.app/)

## ✅ 迁移完成清单

- [ ] 创建 Cloudflare D1 数据库并初始化表结构
- [ ] 创建 R2 存储桶并启用公开访问
- [ ] 部署 Cloudflare Worker API
- [ ] 配置 Docusaurus 并测试本地运行
- [ ] 配置 Giscus 评论系统
- [ ] 导出现有 MySQL 文章到 Markdown
- [ ] 迁移图片到 R2 存储
- [ ] 配置 Cloudflare Pages 自动部署
- [ ] 设置自定义域名（可选）
- [ ] 测试所有功能正常工作
- [ ] 更改默认管理员密码
- [ ] （可选）开发管理后台 UI

---

**恭喜！🎉 你已经完成了技术栈迁移！**

新的架构具有以下优势：
- ✅ 全球 CDN 加速，访问速度极快
- ✅ 免费且稳定，无需担心服务器运维
- ✅ 自动化部署，推送即发布
- ✅ 现代化的评论系统
- ✅ 无限扩展性

如有问题，欢迎查阅上述文档或寻求社区帮助！
