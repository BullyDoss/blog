import React from 'react';
import BlogLayout from '@theme-original/BlogLayout';
import BlogSidebarNav from '@site/src/components/BlogSidebarNav';

export default function BlogLayoutWrapper(props) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <BlogSidebarNav />
      <main style={{ flex: 1, minWidth: 0 }}>
        <BlogLayout {...props} />
      </main>
    </div>
  );
}
