import React from 'react';
import Link from '@docusaurus/Link';
import styles from './BlogSidebarNav.module.css';

const ICONS = {
  document: '\u{1F4DD}',
  brain: '\u{1F9E0}',
  chat: '\u{1F4AC}',
  sword: '\u{2694}\uFE0F',
  folder: '\u{1F4C2}',
  lightning: '\u{26A1}',
  edit: '\u{270D}\uFE0F',
  tag: '\u{1F3F7}\uFE0F',
  calendar: '\u{1F4C5}',
  info: '\u{2139}\uFE0F',
  lock: '\u{1F512}',
  heart: '\u2764}\uFE0F',
};

export default function BlogSidebarNav() {
  const categories = [
    { icon: ICONS.document, name: '学习笔记', path: '/tags/学习笔记' },
    { icon: ICONS.brain, name: '思维风暴', path: '/tags/思维风暴' },
    { icon: ICONS.chat, name: '夸夸其谈', path: '/tags/夸夸其谈' },
    { icon: ICONS.sword, name: '打怪经验', path: '/tags/打怪经验' },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.blogInfo}>
        <h3 className={styles.blogTitle}>{ICONS.document} 文章导航</h3>
        <p className={styles.blogDesc}>按分类浏览或查看归档</p>
      </div>

      <nav className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{ICONS.folder}</span>
          文章分类
        </h4>
        <ul className={styles.categoryList}>
          {categories.map((cat) => (
            <li key={cat.name}>
              <Link to={cat.path} className={styles.categoryLink}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
                <span className={styles.categoryArrow}>&rsaquo;</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav className={styles.section}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{ICONS.lightning}</span>
          快捷入口
        </h4>
        <ul className={styles.quickLinks}>
          <li>
            <Link to="/submit" className={styles.quickLink}>
              <span>{ICONS.edit}</span>
              <span>我要投稿</span>
            </Link>
          </li>
          <li>
            <Link to="/tags" className={styles.quickLink}>
              <span>{ICONS.tag}</span>
              <span>所有标签</span>
            </Link>
          </li>
          <li>
            <Link to="/archive" className={styles.quickLink}>
              <span>{ICONS.calendar}</span>
              <span>文章归档</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className={styles.aboutSection}>
        <h4 className={styles.sectionTitle}>
          <span className={styles.sectionIcon}>{ICONS.info}</span>
          关于本站
        </h4>
        <div className={styles.aboutContent}>
          <p>欢迎来到 BullyDoss 的不务正业笔记！</p>
          <p className={styles.aboutTech}>
            基于 <strong>Cloudflare</strong> 全家桶构建
          </p>
          <Link to="/admin" className={styles.adminLink}>
            {ICONS.lock} 管理后台 &rarr;
          </Link>
        </div>
      </div>

      <div className={styles.sidebarFooter}>
        <p>Built with {ICONS.heart} &amp; Docusaurus</p>
      </div>
    </aside>
  );
}
