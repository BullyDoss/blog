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
