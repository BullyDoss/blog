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
  { id: 'submit', label: '投稿专区', desc: '' },
];

function BlogLayout() {
  const [activeCategory, setActiveCategory] = useState('notes');
  const [posts, setPosts] = useState<any[]>([]);
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
      }
    } catch (err) {
      console.error('Failed to fetch posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      marginTop: '20px',
      background: '#fff',
    }}>
      {/* Left Sidebar */}
      <aside style={{
        width: sidebarOpen ? '260px' : '0',
        borderRight: '1px solid #e5e7eb',
        overflow: 'hidden',
        transition: 'width 0.3s ease',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sidebar Header */}
        <div style={{ 
          padding: '1.25rem 1rem', 
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: '0.95rem', 
            fontWeight: 600, 
            color: '#111827',
            flex: 1,
          }}>
            BullyDoss的不务正业笔记
          </h2>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>v</span>
        </div>

        {/* Search Box */}
        <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="搜索..."
            style={{
              width: '100%',
              padding: '6px 10px',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              fontSize: '0.875rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Articles Navigation */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto',
          padding: '0.75rem 0',
        }}>
          <div style={{ 
            padding: '0 1rem', 
            marginBottom: '0.5rem',
            fontSize: '0.8rem',
            fontWeight: 600,
            color: '#6b7280',
          }}>
            文章导航
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.85rem' }}>
              加载中...
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.8rem' }}>
              暂无文章
            </div>
          ) : (
            posts.map((post) => (
              <article
                key={post.id}
                style={{
                  padding: '0.625rem 1rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  borderBottom: '1px solid #f9fafb',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.5rem',
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
                    fontSize: '0.85rem',
                    color: '#374151',
                    fontWeight: 500,
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

      {/* Main Content */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Top Search Bar */}
        <div style={{
          padding: '1rem 2rem',
          borderBottom: '1px solid #e5e7eb',
        }}>
          <input
            type="text"
            placeholder="搜索..."
            style={{
              width: '240px',
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: 4,
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>

        {/* Category Tabs */}
        <nav style={{
          display: 'flex',
          gap: '2rem',
          padding: '0 2rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: '0.875rem 0',
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

        {/* Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '3rem 4rem',
        }}>
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
              {posts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '4rem 2rem',
                  color: '#9ca3af',
                  fontSize: '1rem',
                }}>
                  还没有内容，快去后台发布吧
                </div>
              ) : (
                <div style={{ maxWidth: '700px' }}>
                  {posts.map((post) => (
                    <article
                      key={post.id}
                      style={{
                        marginBottom: '2.5rem',
                        paddingBottom: '2rem',
                        borderBottom: '1px solid #f3f4f6',
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
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                      }}>
                        <span>{post.excerpt}</span>
                        <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Toggle */}
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '0.5rem',
          zIndex: 100,
        >
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#111827',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            v
          </button>
          <button
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: '#fff',
              color: '#111827',
              border: '1px solid #d1d5db',
              cursor: 'pointer',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            o
          </button>
        </div>
      </main>
    </div>
  );
}
