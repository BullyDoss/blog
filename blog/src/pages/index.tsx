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
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#f9fafb',
      padding: '2rem',
    }}>
      {/* Category Tabs */}
      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '1.5rem',
        borderBottom: '1px solid #e5e7eb',
        paddingBottom: '0',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '0.75rem 1.25rem',
              background: activeCategory === cat.id ? '#fff' : 'transparent',
              color: activeCategory === cat.id ? '#111827' : '#6b7280',
              border: 'none',
              borderBottom: activeCategory === cat.id ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: activeCategory === cat.id ? 600 : 400,
              transition: 'all 0.2s',
              marginBottom: '-1px',
            }}
          >
            {cat.label}
          </button>
        ))}
        
        {/* Search Box in Nav */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '200px',
              padding: '6px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: '0.875rem',
              outline: 'none',
            }}
          />
        </div>
      </nav>

      {/* Content Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          加载中...
        </div>
      ) : (
        <div style={{
          background: 'white',
          borderRadius: 8,
          overflow: 'hidden',
          border: '1px solid #e5e7eb',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ 
                  padding: '14px 20px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: '#374151',
                  width: '40%',
                }}>标题</th>
                <th style={{ 
                  padding: '14px 20px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: '#374151',
                  width: '15%',
                }}>频道</th>
                <th style={{ 
                  padding: '14px 20px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: '#374151',
                  width: '20%',
                }}>摘要</th>
                <th style={{ 
                  padding: '14px 20px', 
                  textAlign: 'left', 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: '#374151',
                  width: '15%',
                }}>时间</th>
                <th style={{ 
                  padding: '14px 20px', 
                  textAlign: 'right', 
                  fontWeight: 600, 
                  fontSize: '0.875rem', 
                  color: '#374151',
                  width: '10%',
                }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredPosts.map((post) => (
                <tr key={post.id} style={{ 
                  borderBottom: '1px solid #f3f4f6',
                  transition: 'background 0.15s ease',
                }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <td style={{ 
                    padding: '16px 20px', 
                    fontWeight: 500, 
                    color: '#111827', 
                    fontSize: '0.925rem',
                  }}>
                    {post.title}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 10px',
                      background: '#f3f4f6',
                      color: '#6b7280',
                      borderRadius: 4,
                      fontSize: '0.8rem',
                    }}>
                      {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                    </span>
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    color: '#6b7280', 
                    fontSize: '0.875rem',
                    maxWidth: '300px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                    title={post.excerpt}
                  >
                    {post.excerpt || '-'}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    color: '#9ca3af', 
                    fontSize: '0.85rem',
                  }}>
                    {new Date(post.created_at).toLocaleDateString('zh-CN')}
                  </td>
                  <td style={{ 
                    padding: '16px 20px', 
                    textAlign: 'right',
                  }}>
                    <button
                      style={{
                        padding: '5px 16px',
                        background: '#111827',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      查看
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredPosts.length === 0 && !loading && (
            <div style={{ 
              textAlign: 'center', 
              padding: '4rem 2rem', 
              color: '#9ca3af',
              fontSize: '1rem',
            }}>
              {searchTerm ? '没有找到匹配的文章' : '还没有内容，快去后台发布吧'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
