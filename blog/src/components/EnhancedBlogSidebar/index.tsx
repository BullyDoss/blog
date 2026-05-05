import React from 'react';
import Link from '@docusaurus/Link';
import styles from './EnhancedBlogSidebar.module.css';

export default function EnhancedBlogSidebar(props) {
  const sidebarData = props?.sidebar || props || {};
  const items = Array.isArray(sidebarData?.items) ? sidebarData.items : [];

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>文章导航</h3>
      <nav className={styles.postList}>
        {Array.isArray(items) && items.length > 0 ? (
          items.map((yearGroup) => {
            if (!yearGroup) return null;
            const year = yearGroup.year || '';
            const posts = Array.isArray(yearGroup.items) ? yearGroup.items : [];

            return (
              <div key={year || Math.random()} className={styles.yearGroup}>
                {year && <h4 className={styles.yearTitle}>{year}</h4>}
                {posts.length > 0 && (
                  <ul className={styles.posts}>
                    {posts.map((post) => {
                      if (!post) return null;
                      return (
                        <li key={post.permalink || Math.random()}>
                          <Link to={post.permalink || '#'} className={styles.postLink}>
                            {post.title || '无标题'}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            暂无文章
          </div>
        )}
      </nav>
    </aside>
  );
}
