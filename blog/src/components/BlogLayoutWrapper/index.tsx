import React, { useEffect, useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CategoryNav from '@site/src/components/CategoryNav';

export default function BlogLayoutWrapper({ children }) {
  const { siteConfig } = useDocusaurusContext();
  const [isBlogPage, setIsBlogPage] = useState(false);

  useEffect(() => {
    // 检查是否是博客列表页或文章详情页
    const path = window.location.pathname;
    const isBlog = path === '/' || /^\/\d{4}/.test(path) || path.includes('/tags/');
    setIsBlogPage(isBlog);
  }, []);

  if (!isBlogPage) {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', gap: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <main style={{ flex: 1, minWidth: 0 }}>
        {children}
      </main>
      <CategoryNav />
    </div>
  );
}
