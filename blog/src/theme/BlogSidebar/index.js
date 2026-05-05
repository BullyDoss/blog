import React from 'react';
import BlogSidebar from '@theme-original/BlogSidebar';
import EnhancedBlogSidebar from '@site/src/components/EnhancedBlogSidebar';

export default function BlogSidebarWrapper(props) {
  // 使用增强版侧边栏
  return <EnhancedBlogSidebar {...props} />;
}
