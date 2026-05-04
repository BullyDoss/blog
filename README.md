# 项目结构说明

## Blog/
├── blog/                        # Docusaurus 博客前端
│   ├── blog/                   # Markdown 文章目录
│   │   └── YYYY-MM-DD-slug/    # 文章文件夹
│   │       └── blog-post.md    # 文章内容
│   ├── src/
│   │   ├── components/         # React 组件
│   │   │   ├── SubmitForm/     # 投稿表单
│   │   │   └── ImageUploader/  # 图片上传
│   │   ├── pages/              # 自定义页面
│   │   │   ├── submit.tsx      # 投稿页面
│   │   │   └── admin.tsx       # 管理后台
│   │   └── css/                # 全局样式
│   ├── static/                 # 静态资源
│   │   └── img/               # 图片等
│   ├── docusaurus.config.js    # 主配置文件
│   ├── package.json
│   └── tsconfig.json
│
├── worker/                      # Cloudflare Worker API
│   ├── src/
│   │   └── index.js            # API 入口
│   ├── schema.sql              # 数据库结构
│   ├── wrangler.toml           # Worker 配置
│   └── package.json
│
├── scripts/                     # 工具脚本
│   └── export-mysql.js         # MySQL 导出工具
│
├── .github/workflows/           # CI/CD
│   └── deploy.yml              # 自动部署配置
│
└── MIGRATION_GUIDE.md          # 详细操作指南

## 快速开始

查看 [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 了解完整的设置步骤。
