import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

export default function AdminPage(): React.ReactElement {
  return (
    <Layout title="管理后台" description="博客管理后台">
      <BrowserOnly fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#666' }}>加载中...</div>}>
        {() => <AdminDashboard />}
      </BrowserOnly>
    </Layout>
  );
}

const CATEGORIES = [
  { id: 'notes', label: '学习笔记' },
  { id: 'brainstorm', label: '思维风暴' },
  { id: 'chat', label: '夸夸其谈' },
  { id: 'daily', label: '打怪经验' },
];

function AdminDashboard() {
  const [view, setView] = React.useState<'login' | 'dashboard'>('login');
  const [token, setToken] = React.useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token') || '';
    }
    return '';
  });

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
    }
    return 'https://api.bullydoss.com';
  };

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
    return <LoginForm onSuccess={handleLoginSuccess} apiBase={getApiBase()} />;
  }

  return <AdminPanel token={token} onLogout={handleLogout} apiBase={getApiBase()} />;
}

function LoginForm({ onSuccess, apiBase }: { onSuccess: (token: string) => void; apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      let response: Response;
      try {
        response = await fetch(`${apiBase}/api/admin/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
          signal: controller.signal,
        });
      } catch (fetchErr: any) {
        clearTimeout(timeoutId);
        if (fetchErr.name === 'AbortError') {
          setError('[ERROR] 连接超时 (15秒)\n\n可能原因：\n- Worker 未正确部署\n- 网络防火墙阻止\n- API 地址错误');
        } else if (fetchErr.message.includes('Failed to fetch') || fetchErr.message.includes('NetworkError')) {
          setError('[ERROR] 网络请求失败\n\n请检查：\n1. 刷新页面重试\n2. 检查网络连接\n3. 如果问题持续请联系管理员');
        } else {
          setError(`[ERROR] 网络错误: ${fetchErr.message}`);
        }
        return;
      }

      clearTimeout(timeoutId);

      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`;
        } catch {
          errorMsg = `HTTP ${response.status}: ${responseText.slice(0, 100)}`;
        }
        throw new Error(errorMsg);
      }

      const data = JSON.parse(responseText);
      onSuccess(data.token);
    } catch (err: any) {
      setError(`[ERROR] ${err.message}`);
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
        borderRadius: 8,
        padding: '2.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#111827',
          textAlign: 'center',
        }}>
          管理员登录
        </h2>
        
        <p style={{
          textAlign: 'center',
          color: '#6b7280',
          marginBottom: '2rem',
          fontSize: '0.9rem',
        }}>
          登录后可管理文章和审核投稿
        </p>

        {error && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: 6,
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
              fontWeight: 500,
              fontSize: '0.875rem',
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
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.875rem',
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
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px',
              background: loading ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.95rem',
              fontWeight: 500,
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout, apiBase }: { token: string; onLogout: () => void; apiBase: string }) {
  const [showEditor, setShowEditor] = React.useState(false);

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#f9fafb',
    }}>
      {/* Header */}
      <header style={{
        background: '#111827',
        color: 'white',
        padding: '0.875rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 600 }}>管理后台</h1>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button
            onClick={() => setShowEditor(false)}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              opacity: showEditor ? 0.7 : 1,
            }}
          >
            文章管理
          </button>
          <button
            onClick={() => setShowEditor(true)}
            style={{
              padding: '0.5rem 1rem',
              background: '#fff',
              color: '#111827',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            写新文章
          </button>
          <button
            onClick={onLogout}
            style={{
              padding: '0.5rem 1rem',
              background: 'transparent',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            退出
          </button>
        </div>
      </header>

      {/* Content */}
      <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
        {showEditor ? (
          <PostEditor 
            token={token} 
            apiBase={apiBase}
            onSave={() => setShowEditor(false)}
            onCancel={() => setShowEditor(false)}
          />
        ) : (
          <>
            <AllPostsManager token={token} apiBase={apiBase} />
            <SubmissionsManager token={token} apiBase={apiBase} />
          </>
        )}
      </div>
    </div>
  );
}

function AllPostsManager({ token, apiBase }: { token: string; apiBase: string }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPosts(data.filter((p: any) => p.category !== 'submit'));
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchPosts();
  }, [token]);

  const deletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>加载中...</div>;
  }

  return (
    <div style={{ marginBottom: '3rem' }}>
      <div style={{
        background: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>标题</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>频道</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>时间</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '14px 16px', fontWeight: 500, color: '#111827', fontSize: '0.9rem' }}>{post.title}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 10px',
                    background: '#f3f4f6',
                    color: '#6b7280',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                  }}>
                    {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                  </span>
                </td>
                <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '0.875rem' }}>{new Date(post.created_at).toLocaleDateString('zh-CN')}</td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', alignItems: 'center' }}>
                    <button
                      style={{
                        padding: '5px 14px',
                        background: '#111827',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                      }}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        padding: '5px 14px',
                        background: 'transparent',
                        color: '#6b7280',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                      }}
                    >
                      删除
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {posts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
            暂无文章
          </div>
        )}
      </div>
    </div>
  );
}

function PostEditor({ token, apiBase, onSave, onCancel }: {
  token: string;
  apiBase: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = React.useState({
    title: '',
    slug: '',
    content: '',
    excerpt: '',
    category: 'notes',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content) {
      setError('标题和内容不能为空');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch(`${apiBase}/api/admin/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('创建成功');
        onSave();
      } else {
        const errorData = await response.json();
        setError(`[ERROR] ${errorData.error || '操作失败'}`);
      }
    } catch (err) {
      setError('[ERROR] 网络错误');
    } finally {
      setSaving(false);
    }
  };

  const generateSlugFromTitle = () => {
    const slug = formData.title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 80);
    setFormData({ ...formData, slug });
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 8,
      padding: '2rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
    }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
        写新文章
      </h2>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: 6,
          marginBottom: '1.5rem',
          fontSize: '0.9rem',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              标题
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="请输入标题"
              required
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: '0.95rem',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              URL 别名 (Slug)
            </label>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="my-post"
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                fontSize: '0.95rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
                outline: 'none',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            所属频道
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            style={{
              width: '200px',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: '0.95rem',
              outline: 'none',
              background: 'white',
            }}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            摘要
          </label>
          <input
            type="text"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="简短描述..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: '0.95rem',
              boxSizing: 'border-box',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '0.5rem',
          }}>
            <label style={{
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#374151',
            }}>
              正文 (Markdown)
            </label>
            <button
              type="button"
              style={{
                padding: '4px 12px',
                background: '#f3f4f6',
                border: '1px solid #d1d5db',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '0.8rem',
                color: '#374151',
              }}
            >
              插入图片
            </button>
          </div>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="在此输入正文，支持 Markdown。使用工具栏插入图片..."
            required
            rows={12}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              fontSize: '0.95rem',
              lineHeight: 1.6,
              boxSizing: 'border-box',
              fontFamily: 'monospace',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px',
              background: saving ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {saving ? '保存中...' : '发布'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 32px',
              background: '#fff',
              color: '#374151',
              border: '1px solid #d1d5db',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            取消
          </button>
        </div>
      </form>
    </div>
  );
}

function SubmissionsManager({ token, apiBase }: { token: string; apiBase: string }) {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/admin/posts?category=submit&status=pending`, {
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
    if (!confirm('确定要批准这篇投稿吗？')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const rejectPost = async (postId: number) => {
    if (!confirm('确定要拒绝这篇投稿吗？')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}/reject`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading || submissions.length === 0) {
    return null;
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.125rem', fontWeight: 600 }}>
        待审核投稿 ({submissions.length})
      </h2>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {submissions.map((sub) => (
          <div key={sub.id} style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '1.25rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 0.375rem', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>
                {sub.title}
              </h3>
              <p style={{ color: '#6b7280', fontSize: '0.875rem', margin: 0 }}>
                作者: {sub.author || '匿名'} | {new Date(sub.created_at).toLocaleDateString('zh-CN')}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
              <button
                onClick={() => approvePost(sub.id)}
                style={{
                  padding: '6px 16px',
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                批准
              </button>
              <button
                onClick={() => rejectPost(sub.id)}
                style={{
                  padding: '6px 16px',
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}
              >
                拒绝
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
