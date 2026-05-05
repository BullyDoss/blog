import React from 'react';
import Link from '@docusaurus/Link';
import styles from './BlogSidebarNav.module.css';

export default function BlogSidebarNav() {
  const categories = [
    { icon: '📝', name: '学习笔记', path: '/tags/学习笔记', count: 0 },
    { icon: '🧠', name: '思维风暴', path: '/tags/思维风暴', count: 0 },
    { icon: '💬', name: '夸夸其谈', path: '/tags/夸夸其谈', count: 0 },
    { icon: '⚔️', name: '打怪经验', path: '/tags/打怪经验', count: 0 },
  ];

  return (
    <aside className={styles.sidebar}>
      {/* 博客信息 */}
      <div className={styles.blogInfo}>
        <h3 className={styles.blogTitle}>📝 文章导航</h3>
        <p className={styles.blogDesc}>按分类浏览或查看归档</p>
      </div>

      {/* 分类导航 */}
      <nav className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon">📂</span>
          文章分类
        </h4>
        <ul className={styles.categoryList}>
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link to={cat.path} className={styles.categoryLink}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryArrow}>›</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* 快捷入口 */}
      <nav className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>⚡</span>
          快捷入口
        </h4>
        <ul className={styles.quickLinks}>
          <li>
            <Link to="/submit" className={styles.quickLink}>
              <span>✍️</span>
              <span>我要投稿</span>
            </Link>
          </li>
          <li>
            <Link to="/tags" className={styles.quickLink}>
              <span>🏷️</span>
              <span>所有标签</span>
            </Link>
          </li>
          <li>
            <Link to="/archive" className={styles.quickLink}>
              <span="📅"></span>
              <span>文章归档</span>
            </Link>
          </li>
        </ul>
      </nav>

      {/* 关于信息 */}
      <div className={styles.aboutSection}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>ℹ️</span>
          关于本站
        </h4>
        <div className={styles.aboutContent}>
          <p>欢迎来到 BullyDoss 的不务正业笔记！</p>
          <p className={styles.aboutTech}>
            基于 <strong>Cloudflare</strong> 全家桶构建
          </p>
          <Link to="/admin" className={styles.adminLink}>
            🔐 管理后台 →
          </Link>
        </div>
      </div>

      {/* 底部装饰 */}
      <div className={styles.sidebarFooter}>
        <p>Built with ❤️ & Docusaurus</p>
      </div>
    </aside>
  );
}
