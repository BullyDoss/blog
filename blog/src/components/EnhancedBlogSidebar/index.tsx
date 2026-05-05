import React from 'react';
import Link from '@docusaurus/Link';
import styles from './EnhancedBlogSidebar.module.css';

const ICONS = {
  document: '\u{1F4DD}',
  brain: '\u{1F9E0}',
  chat: '\u{1F4AC}',
  sword: '\u{2694}\uFE0F',
  edit: '\u{270D}\uFE0F',
};

export default function EnhancedBlogSidebar({ sidebar }) {
  // 从 props 获取侧边栏数据
  const { items } = sidebar || {};

  return (
    <aside className={styles.sidebar}>
      {/* 标题 */}
      <div className={styles.header}>
        <h3 className={styles.title}>Recent posts</h3>
      </div>

      {/* 文章列表 - 按年份分组显示 */}
      <nav className={styles.postList}>
        {items && items.length > 0 ? (
          items.map((yearGroup) => (
            <div key={yearGroup.year} className={styles.yearGroup}>
              <h4 className={styles.yearTitle}>{yearGroup.year}</h4>
              <ul className={styles.posts}>
                {yearGroup.items.map((post) => (
                  <li key={post.permalink}>
                    <Link to={post.permalink} className={styles.postLink}>
                      <span className={styles.postTitle}>{post.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
          /* 空状态 */
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>暂无文章</p>
            <p className={styles.emptySubtext}>发布第一篇文章后这里会显示</p>
          </div>
        )}
      </nav>

      {/* 底部分类快捷入口 */}
      <div className={styles.quickNav}>
        <h4 className={styles.sectionTitle}>分类浏览</h4>
        <ul className={styles.categoryList}>
          <li>
            <Link to="/tags/学习笔记" className={styles.categoryLink}>
              <span className={styles.catIcon}>{ICONS.document}</span>
              学习笔记
            </Link>
          </li>
          <li>
            <Link to="/tags/思维风暴" className={styles.categoryLink}>
              <span className={styles.catIcon}>{ICONS.brain}</span>
              思维风暴
            </Link>
          </li>
          <li>
            <Link to="/tags/夸夸其谈" className={styles.categoryLink}>
              <span className={styles.catIcon}>{ICONS.chat}</span>
              夸夸其谈
            </Link>
          </li>
          <li>
            <Link to="/tags/打怪经验" className={styles.categoryLink}>
              <span className={styles.catIcon}>{ICONS.sword}</span>
              打怪经验
            </Link>
          </li>
        </ul>

        <Link to="/submit" className={styles.submitLink}>
          <span>{ICONS.edit}</span>
          我要投稿
        </Link>
      </div>
    </aside>
  );
}
