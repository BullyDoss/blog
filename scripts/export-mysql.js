#!/usr/bin/env node

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function exportFromMySQL() {
  console.log('📦 开始从 MySQL 导出文章...\n');

  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: process.env.MYSQL_PORT || 3306,
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '000000',
    database: process.env.MYSQL_DATABASE || 'myblog',
  });

  try {
    const [posts] = await connection.query(
      `SELECT * FROM posts WHERE status = 'published' ORDER BY created_at DESC`
    );

    console.log(`找到 ${posts.length} 篇文章\n`);

    const outputDir = path.join(__dirname, '../blog/blog');
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const post of posts) {
      const date = new Date(post.created_at).toISOString().split('T')[0];
      const slug = post.slug || generateSlug(post.title);
      const dirName = `${date}-${slug}`;
      const dirPath = path.join(outputDir, dirName);

      fs.mkdirSync(dirPath, { recursive: true });

      const frontmatter = `---
slug: ${slug}
title: "${post.title.replace(/"/g, '\\"')}"
author: ${post.author || 'Helloworld'}
author_title: 作者
tags: [${post.category}]
date: ${date}
---

`;

      const content = frontmatter + (post.content || '');

      fs.writeFileSync(path.join(dirPath, 'blog-post.md'), content);
      
      console.log(`✅ 导出: ${dirName}/blog-post.md`);
    }

    console.log(`\n✨ 导出完成！共导出 ${posts.length} 篇文章到 blog/ 目录`);
    console.log('\n下一步:');
    console.log('1. 检查导出的 Markdown 文件');
    console.log('2. 手动调整格式和分类');
    console.log('3. 将图片迁移到 R2 存储');

  } catch (error) {
    console.error('❌ 导出失败:', error.message);
  } finally {
    await connection.end();
  }
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

if (require.main === module) {
  exportFromMySQL();
}

module.exports = { exportFromMySQL };
