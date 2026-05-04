import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

export default function AdminPage(): React.ReactElement {
  return (
    <Layout title="管理后台" description="博客管理后台">
      <BrowserOnly fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>⏳ 加载中...</div>}>
        {() => <AdminDashboard />}
      </BrowserOnly>
    </Layout>
  );
}

function AdminDashboard() {
  const [view, setView] = React.useState<'login' | 'dashboard'>('login');
  const [token, setToken] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token') || '';
    }
    return '';
  });

  React.useEffect(() => {
    if (token) setView('dashboard');
  }, [token]);

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('admin_token', newToken);
    setView('dashboard');
  };

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('admin_token');
    setView('login');
  };

  if (view === 'login' || !token) {
    return <LoginForm onSuccess={handleLoginSuccess} />;
  }

  return <AdminPanel token={token} onLogout={handleLogout} />;
}

function LoginForm({ onSuccess }: { onSuccess: (token: string) => void }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBase = 'https://blog-api.bullydoss-blog.workers.dev';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `服务器错误 (${response.status})`);
      }

      const data = await response.json();
      onSuccess(data.token);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setError('❌ 连接超时，请检查网络或 API 地址');
      } else if (err.message.includes('fetch')) {
        setError('❌ 无法连接到 API 服务器\n\n请确认：\n• Worker 是否已部署\n• API 地址是否正确：https://blog-api.bullydoss-blog.workers.dev');
      } else {
        setError(`❌ ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: 420,
      margin: '3rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: 16,
        padding: '2.5rem',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{
          fontSize: '1.75rem',
          fontWeight: 700,
          marginBottom: '0.5rem',
          color: '#111827',
          textAlign: 'center',
        }}>
          🔐 管理员登录
        </h2>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.95rem',
        }}>
          登录后可管理文章和审核投稿
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '14px 18px',
            borderRadius: 10,
            marginBottom: '1.5rem',
            fontSize: '0.9rem',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: '#f9fafb',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: 600,
              fontSize: '0.9rem',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 10,
                fontSize: '1rem',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
                background: '#f9fafb',
              }}
              onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
              onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 10,
              fontSize: '1.05rem',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.35)',
            }}
          >
            {loading ? '⏳ 登录中...' : '🚀 登 录'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: '#f0fdf4',
          borderRadius: 8,
          fontSize: '0.85rem',
          color: '#166534',
          lineHeight: 1.6,
        }}>
          🔒 安全提示：<br/>
          此登录页面连接到 Cloudflare Workers 后端 API<br/>
          请使用管理员账号登录
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = React.useState<'posts' | 'submissions'>('posts');

  return (
    <div style={{
      maxWidth: 1100,
      margin: '2rem auto',
      padding: '0 1.5rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        paddingBottom: '1.5rem',
        borderBottom: '2px solid #e5e7eb',
      }}>
        <h1 style={{ fontSize: '2rem', margin: 0, color: '#111827' }}>
          📊 管理后台
        </h1>
        <button
          onClick={onLogout}
          style={{
            padding: '10px 24px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 8,
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)',
          }}
        >
          🚪 退出登录
        </button>
      </header>

      <nav style={{
        display: 'flex',
        gap: '0.5rem',
        marginBottom: '2rem',
        borderBottom: '2px solid #e5e7eb',
      }}>
        {(['posts', 'submissions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '14px 28px',
              background: activeTab === tab ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeTab === tab ? '#3b82f6' : 'transparent'}`,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === tab ? '#2563eb' : '#6b7280',
              transition: 'all 0.2s',
              marginBottom: -2,
            }}
          >
            {tab === 'posts' ? '📝 文章管理' : '📥 投稿审核'}
          </button>
        ))}
      </nav>

      <main style={{ minHeight: 400 }}>
        {activeTab === 'posts' 
          ? <PostsManager token={token} /> 
          : <SubmissionsManager token={token} />
        }
      </main>
    </div>
  );
}

function PostsManager({ token }: { token: string }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const apiBase = 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 401 || response.status === 403) {
        setError('登录已过期，请重新登录');
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setError(`获取文章失败 (${response.status})`);
      }
    } catch (err) {
      setError('网络错误，无法连接到 API');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, [token]);

  const deletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) return;

    try {
      const apiBase = 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        alert('✅ 删除成功');
      } else {
        alert('❌ 删除失败');
      }
    } catch (err) {
      alert('❌ 网络错误');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>
        ⏳ 加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#fef2f2',
        borderRadius: 12,
        color: '#dc2626',
      }}>
        {error}
        <br />
        <button onClick={fetchPosts} style={{
          marginTop: '1rem',
          padding: '8px 20px',
          background: '#dc2626',
          color: 'white',
          border: 'none',
          borderRadius: 6,
          cursor: 'pointer',
        }}>
          🔄 重试
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontWeight: 600,
        color: '#374151',
      }}>
        <span>共 {posts.length} 篇文章</span>
        <button onClick={fetchPosts} style={{
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}>
          🔄 刷新
        </button>
      </div>

      <div style={{
        background: 'white',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        border: '1px solid #e5e7eb',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              {['ID', '标题', '分类', '状态', '创建时间', '操作'].map((th) => (
                <th key={th} style={{
                  padding: '14px 18px',
                  textAlign: 'left',
                  fontWeight: 700,
                  color: '#374151',
                  fontSize: '0.85rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  borderBottom: '2px solid #e5e7eb',
                }}>
                  {th}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{
                borderBottom: '1px solid #f3f4f6',
                transition: 'background 0.15s',
              }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
              >
                <td style={{ padding: '14px 18px', color: '#6b7280' }}>{post.id}</td>
                <td style={{ padding: '14px 18px', fontWeight: 500, color: '#111827' }}>{post.title}</td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: '#f3f4f6',
                    color: '#374151',
                  }}>
                    {post.category}
                  </span>
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: 20,
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    background: post.status === 'published' ? '#d1fae5' : '#fef3c7',
                    color: post.status === 'published' ? '#065f46' : '#92400e',
                  }}>
                    {post.status === 'published' ? '✅ 已发布' : '⏳ 待审核'}
                  </span>
                </td>
                <td style={{ padding: '14px 18px', color: '#6b7280', fontSize: '0.9rem' }}>
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                </td>
                <td style={{ padding: '14px 18px' }}>
                  <button
                    onClick={() => deletePost(post.id)}
                    style={{
                      padding: '8px 16px',
                      background: '#fef2f2',
                      color: '#dc2626',
                      border: '1px solid #fecaca',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#fee2e2';
                      e.currentTarget.style.borderColor = '#fca5a5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#fef2f2';
                      e.currentTarget.style.borderColor = '#fecaca';
                    }}
                  >
                    🗑️ 删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          fontSize: '1.1rem',
        }}>
          📭 暂无文章
        </div>
      )}
    </div>
  );
}

function SubmissionsManager({ token }: { token: string }) {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const apiBase = 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/posts?status=pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubmissions(data.filter((p: any) => p.status === 'pending'));
      }
    } catch (err) {
      console.error('获取投稿失败:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchSubmissions();
  }, [token]);

  const approvePost = async (postId: number) => {
    try {
      const apiBase = 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: 'published' }),
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
        alert('✅ 已批准发布');
      }
    } catch (err) {
      alert('❌ 操作失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#6b7280' }}>⏳ 加载中...</div>;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        fontWeight: 600,
        color: '#374151',
      }}>
        <span>共 {submissions.length} 条待审核投稿</span>
        <button onClick={fetchSubmissions} style={{
          padding: '8px 16px',
          background: '#f3f4f6',
          border: '1px solid #d1d5db',
          borderRadius: 6,
          cursor: 'pointer',
          fontSize: '0.9rem',
        }}>
          🔄 刷新
        </button>
      </div>

      <div style={{ display: 'grid', gap: '1.25rem' }}>
        {submissions.map((sub) => (
          <div key={sub.id} style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'box-shadow 0.2s',
          }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)'}
          >
            <h3 style={{ margin: '0 0 0.75rem', color: '#111827', fontSize: '1.2rem' }}>
              {sub.title}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              👤 作者：{sub.author || '匿名'} | 📅 提交时间：{new Date(sub.created_at).toLocaleDateString('zh-CN')}
            </p>
            <p style={{
              color: '#4b5563',
              lineHeight: 1.6,
              margin: '0 0 1.25rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: 8,
              fontSize: '0.95rem',
            }}>
              {sub.excerpt}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => approvePost(sub.id)}
                style={{
                  padding: '10px 20px',
                  background: '#d1fae5',
                  color: '#065f46',
                  border: '1px solid #a7f3d0',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#a7f3d0'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#d1fae5'}
              >
                ✅ 批准发布
              </button>
              <button
                onClick={() => alert('拒绝功能开发中...')}
                style={{
                  padding: '10px 20px',
                  background: '#fef2f2',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fee2e2'}
                onMouseLeave={(e) => e.currentTarget.style.background = '#fef2f2'}
              >
                ❌ 拒绝
              </button>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          color: '#9ca3af',
          fontSize: '1.1rem',
        }}>
          🎉 暂无待审核投稿
        </div>
      )}
    </div>
  );
}
