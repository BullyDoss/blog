import React from 'react';
import Link from '@docusaurus/Link';
import styles from './CategoryNav.module.css';

export default function CategoryNav() {
  const categories = [
    {
      icon: '📝',
      name: '学习笔记',
      path: '/tags/学习笔记',
      description: '技术学习与知识整理',
    },
    {
      icon: '🧠',
      name: '思维风暴',
      path: '/tags/思维风暴',
      description: '创意想法和深度思考',
    },
    {
      icon: '💬',
      name: '夸夸其谈',
      path: '/tags/夸夸其谈',
      description: '观点分享与讨论',
    },
    {
      icon: '⚔️',
      name: '打怪经验',
      path: '/tags/打怪经验',
      description: '实战经验与踩坑记录',
    },
    {
      icon: '✍️',
      name: '投稿专区',
      path: '/submit',
      description: '读者投稿展示',
    },
  ];

  return (
    <aside className={styles.container}>
      <div className={styles.card}>
        <h3 className={styles.title}>📚 板块导航</h3>
        <nav className={styles.nav}>
          {categories.map((category) => (
            <Link
              key={category.name}
              to={category.path}
              className={styles.item}
            >
              <span className={styles.icon}>{category.icon}</span>
              <div className={styles.content}>
                <span className={styles.name}>{category.name}</span>
                <span className={styles.desc}>{category.description}</span>
              </div>
              <span className={styles.arrow}>→</span>
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.statsCard}>
        <h4 className={styles.statsTitle}>📊 站点信息</h4>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>技术栈</span>
            <span className={styles.statValue}>Cloudflare 全家桶</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>框架</span>
            <span className={styles.statValue}>Docusaurus</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>评论系统</span>
            <span className={styles.statValue}>Giscus</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>部署</span>
            <span className={styles.statValue}>Cloudflare Pages</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
