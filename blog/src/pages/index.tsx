import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';

export default function HomePage(): React.ReactElement {
  return (
    <Layout title="BullyDoss的不务正业笔记" description="学习笔记 · 思维风暴 · 夸夸其谈 · 打怪经验">
      <BlogLayout />
    </Layout>
  );
}

const CATEGORIES = [
  { id: 'notes', label: '学习笔记' },
  { id: 'brainstorm', label: '思维风暴' },
  { id: 'chat', label: '夸夸其谈' },
  { id: 'daily', label: '打怪经验' },
  { id: 'submit', label: '投稿专区' },
];

function BlogLayout() {
  const [activeCategory, setActiveCategory] = useState('notes');
  const [posts, setPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
    }
    return 'https://api.bullydoss.com';
  };

  useEffect(() => {
    fetchPosts();
  }, [activeCategory]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/api/posts?category=${activeCategory}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
        if (data.length > 0 && !selectedPost) {
          setSelectedPost(data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      marginTop: '20px',
    }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? '280px' : '0',
        borderRight: '1px solid #e5e7eb',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0,
      }}>
        <div style={{ padding: '1.5rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#374151' }}>
            BullyDoss的不务正业笔记
          </h2>
        </div>

        {/* Category Tabs */}
        <nav style={{ 
          display: 'flex', 
          flexDirection: 'column',
          gap: '0.25rem',
          padding: '0.75rem 1rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.id);
                setSelectedPost(null);
              }}
              style={{
                padding: '0.625rem 0.875rem',
                background: activeCategory === cat.id ? '#f3f4f6' : 'transparent',
                color: activeCategory === cat.id ? '#111827' : '#6b7280',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: activeCategory === cat.id ? 600 : 400,
                textAlign: 'left',
                transition: 'all 0.15s ease',
                width: '100%',
              }}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Post List */}
        <div style={{ 
          overflowY: 'auto', 
          height: 'calc(100vh - 300px)',
          padding: '0.75rem 1rem'
        }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.9rem' }}>
              加载中...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              暂无文章
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                onClick={() => setSelectedPost(post)}
                style={{
                  padding: '0.875rem 0',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <h3 style={{
                  margin: '0 0 0.375rem',
                  fontSize: '0.9rem',
                  fontWeight: selectedPost?.id === post.id ? 600 : 500,
                  color: selectedPost?.id === post.id ? '#111827' : '#374151',
                  lineHeight: 1.4,
                }}>
                  {post.title}
                </h3>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8rem',
                  color: '#9ca3af',
                }}>
                  <span>{CATEGORIES.find(c => c.id === post.category)?.label || post.category}</span>
                  <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </article>
            ))
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#ffffff',
      }}>
        {/* Toggle Sidebar Button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{
            position: 'fixed',
            left: sidebarOpen ? '290px' : '1rem',
            top: '80px',
            zIndex: 10,
            padding: '0.5rem',
            background: '#fff',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            transition: 'left 0.3s ease',
          }}
        >
          {sidebarOpen ? '<' : '>'}
        </button>

        {loading ? (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%' ,
            color: '#9ca3af'
          }}>
            加载中...
          </div>
        ) : !selectedPost ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#9ca3af',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>[]</div>
            <p style={{ margin: 0, fontSize: '1.125rem' }}>请选择一篇文章</p>
          </div>
        ) : (
          <article style={{ maxWidth: '800px', margin: '0 auto', padding: '3rem 2rem' }}>
            <header style={{ marginBottom: '2.5rem', paddingBottom: '2rem', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{
                display: 'inline-block',
                padding: '0.25rem 0.75rem',
                background: '#f3f4f6',
                color: '#374151',
                borderRadius: '4px',
                fontSize: '0.85rem',
                fontWeight: 500,
                marginBottom: '1rem',
              }}>
                {CATEGORIES.find(c => c.id === selectedPost.category)?.label}
              </div>
              
              <h1 style={{
                margin: '0 0 1rem',
                fontSize: '2.25rem',
                fontWeight: 700,
                color: '#111827',
                lineHeight: 1.3,
              }}>
                {selectedPost.title}
              </h1>
              
              <div style={{
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.9rem',
                color: '#6b7280',
              }}>
                <span>作者: {selectedPost.author || 'BullyDoss'}</span>
                <span>{new Date(selectedPost.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </header>

            <div style={{
              color: '#374151',
              lineHeight: 1.8,
              fontSize: '1.05rem',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}>
              {selectedPost.content}
            </div>

            <footer style={{
              marginTop: '3rem',
              paddingTop: '2rem',
              borderTop: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.9rem',
              color: '#9ca3af',
            }}>
              <span>ID: {selectedPost.id}</span>
              <span>Slug: {selectedPost.slug}</span>
            </footer>
          </article>
        )}
      </main>
    </div>
  );
}
