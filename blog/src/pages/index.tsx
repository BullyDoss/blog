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
  { id: 'notes', label: '学习笔记', desc: '记录知识，沉淀思考' },
  { id: 'brainstorm', label: '思维风暴', desc: '提问、分享想法、碰撞灵感' },
  { id: 'chat', label: '夸夸其谈', desc: '分享生活，记录瞬间' },
  { id: 'daily', label: '打怪经验', desc: '' },
  { id: 'submit', label: '投稿专区', desc: '精选投稿内容展示' },
];

function BlogLayout() {
  const [activeCategory, setActiveCategory] = useState('notes');
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
    }
    return 'https://api.bullydoss.com';
  };

  useEffect(() => {
    fetchAllPosts();
  }, []);

  const fetchAllPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/api/posts`);
      if (response.ok) {
        const data = await response.json();
        setAllPosts(data);
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  const categoryPosts = allPosts.filter(p => p.category === activeCategory);

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      marginTop: '0',
    }}>
      {/* Left Sidebar - Fixed */}
      <aside style={{
        width: '280px',
        flexShrink: 0,
        borderRight: '1px solid #e5e7eb',
        background: '#fff',
        overflowY: 'auto',
        position: 'sticky',
        top: '0',
        height: 'calc(100vh - 60px)',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#374151',
        }}>
          文章导航
        </div>

        {/* All Posts List */}
        <div style={{ padding: '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              加载中...
            </div>
          ) : allPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
              暂无文章
            </div>
          ) : (
            allPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setActiveCategory(post.category)}
                style={{
                  padding: '0.875rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f9fafb',
                  transition: 'background 0.15s ease',
                  background: post.category === activeCategory ? '#f9fafb' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (post.category !== activeCategory) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (post.category !== activeCategory) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: 3,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}>
                    {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                  </span>
                  <span style={{
                    fontSize: '0.875rem',
                    color: '#374151',
                    fontWeight: post.category === activeCategory ? 600 : 400,
                    lineHeight: 1.4,
                    flex: 1,
                  }}>
                    {post.title}
                  </span>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  color: '#9ca3af',
                  paddingLeft: '4rem',
                }}>
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                </div>
              </article>
            ))
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#fff',
      }}>
        {/* Category Tabs */}
        <nav style={{
          display: 'flex',
          gap: '2rem',
          padding: '0 3rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          position: 'sticky',
          top: '0',
          zIndex: 10,
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '1rem 0',
                background: 'transparent',
                color: activeCategory === cat.id ? '#111827' : '#6b7280',
                border: 'none',
                borderBottom: activeCategory === cat.id ? '2px solid #111827' : '2px solid transparent',
                cursor: 'pointer',
                fontSize: '0.95rem',
                fontWeight: activeCategory === cat.id ? 600 : 400,
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </nav>

        {/* Category Content */}
        <div style={{ padding: '3rem 4rem', minHeight: 'calc(100vh - 120px)' }}>
          {loading ? (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              color: '#9ca3af'
            }}>
              加载中...
            </div>
          ) : (
            <>
              {/* Category Header */}
              <header style={{ marginBottom: '3rem' }}>
                <h1 style={{
                  margin: '0 0 0.5rem',
                  fontSize: '2rem',
                  fontWeight: 700,
                  color: '#111827',
                }}>
                  {currentCategory?.label}
                </h1>
                {currentCategory?.desc && (
                  <p style={{
                    margin: 0,
                    fontSize: '1rem',
                    color: '#6b7280',
                  }}>
                    {currentCategory.desc}
                  </p>
                )}
              </header>

              {/* Posts List or Empty State */}
              {categoryPosts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '6rem 2rem',
                  color: '#9ca3af',
                  fontSize: '1rem',
                }}>
                  还没有内容，快去后台发布吧
                </div>
              ) : (
                <div style={{ maxWidth: '700px' }}>
                  {categoryPosts.map((post) => (
                    <article
                      key={post.id}
                      style={{
                        marginBottom: '2.5rem',
                        paddingBottom: '2rem',
                        borderBottom: categoryPosts.indexOf(post) < categoryPosts.length - 1 ? '1px solid #f3f4f6' : 'none',
                      }}
                    >
                      <h2 style={{
                        margin: '0 0 0.5rem',
                        fontSize: '1.35rem',
                        fontWeight: 600,
                        color: '#111827',
                      }}>
                        {post.title}
                      </h2>
                      <p style={{
                        margin: '0 0 0.75rem',
                        color: '#6b7280',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                      }}>
                        {post.excerpt || '-'}
                      </p>
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                      }}>
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
