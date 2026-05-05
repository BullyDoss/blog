# 启用首页右侧板块导航

本指南将帮助你在 Docusaurus 博客列表页添加右侧板块导航（学习笔记、思维风暴、夸夸其谈、打怪经验、投稿专区）。

## 📋 前置条件

组件代码已经创建完成：
- ✅ `src/components/CategoryNav/index.tsx` - 板块导航组件
- ✅ `src/components/CategoryNav/CategoryNav.module.css` - 样式文件

## 🚀 启用步骤

### 方法一：使用 Swizzle（推荐）✅

**步骤 1：Swizzle BlogListPage 组件**

在 `blog/` 目录下运行：

```bash
cd blog
npm run swizzle @docusaurus/theme-classic BlogListPage -- --eject --wrap
```

这会创建一个可编辑的 `BlogListPage` 组件。

**步骤 2：修改 BlogListPage 组件**

Swizzle 会提示你选择要 wrap 的组件，选择默认选项后，会生成文件：

```
src/theme/BlogListPage/index.js
```

打开该文件，找到渲染部分，修改为：

```javascript
import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import CategoryNav from '@site/src/components/CategoryNav';

export default function BlogListPageWrapper(props) {
  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <main style={{ flex: 1, minWidth: 0 }}>
        <BlogListPage {...props} />
      </main>
      <CategoryNav />
    </div>
  );
}
```

**步骤 3：重启开发服务器**

```bash
npm start
```

访问 http://localhost:3000 即可看到效果！

---

### 方法二：手动创建（备选）

如果 Swizzle 不工作，可以手动创建：

**步骤 1：创建目录和文件**

```bash
mkdir -p src/theme/BlogListPage
```

创建文件 `src/theme/BlogListPage/index.js`：

```javascript
import React from 'react';
import BlogListPage from '@theme-original/BlogListPage';
import CategoryNav from '@site/src/components/CategoryNav';

export default function BlogListPageWrapper(props) {
  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <main style={{ flex: 1, minWidth: 0 }}>
        <BlogListPage {...props} />
      </main>
      <CategoryNav />
    </div>
  );
}
```

**步骤 2：重启开发服务器**

```bash
npm start
```

---

## 🎨 自定义板块内容

编辑 `src/components/CategoryNav/index.tsx`，修改 `categories` 数组：

```typescript
const categories = [
  {
    icon: '📝',           // Emoji 图标
    name: '学习笔记',     // 显示名称
    path: '/tags/学习笔记', // 链接路径
    description: '技术学习与知识整理', // 描述文字
  },
  // ... 添加更多板块
];
```

## 📱 响应式设计

右侧板块已适配移动端：
- **桌面端 (>996px)**: 显示在右侧，固定定位
- **移动端 (≤996px)**: 自动隐藏，不影响阅读体验

## 🔧 故障排查

### 右侧板块不显示

1. **检查文件路径**: 确认 `src/theme/BlogListPage/index.js` 存在
2. **重启开发服务器**: 修改后必须重启 `npm start`
3. **清除缓存**: 删除 `.docusaurus` 目录后重新启动

```bash
cd blog
rm -rf .docusaurus
npm start
```

### 样式异常

1. **检查 CSS 文件**: 确认 `CategoryNav.module.css` 存在
2. **浏览器开发者工具**: 按 F12 检查是否有 CSS 加载错误

---

## ✅ 验证清单

- [ ] 运行 `npm run swizzle` 或手动创建组件
- [ ] 修改 `BlogListPage/index.js` 注入 CategoryNav
- [ ] 重启开发服务器 (`npm start`)
- [ ] 访问 http://localhost:3000 查看效果
- [ ] 测试移动端响应式（缩小浏览器窗口）
- [ ] 点击各板块链接确认跳转正常

---

## 💡 提示

- 板块链接指向 `/tags/xxx`，需要确保文章使用了对应的标签
- 如果某些标签不存在，链接会显示空页面（可以后续添加文章）
- 可以随时修改 `CategoryNav/index.tsx` 调整板块内容和样式

---

**需要帮助？** 查看 [Docusaurus Swizzle 文档](https://docusaurus.io/docs/swizzle)
