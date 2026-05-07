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
  { id: 'submit', label: '投稿审核' },
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
              onFocus={(e) => e.target.style.borderColor = '#111827'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
              onFocus={(e) => e.target.style.borderColor = '#111827'}
              onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
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
  const [activeTab, setActiveTab] = React.useState<string>('notes');
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
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 600 }}>管理后台</h1>
        
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            onClick={() => setShowEditor(!showEditor)}
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
              border: '1px solid #4b5563',
              borderRadius: 4,
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
            category={activeTab} 
            token={token} 
            apiBase={apiBase}
            onSave={() => setShowEditor(false)}
            onCancel={() => setShowEditor(false)}
          />
        ) : activeTab === 'submit' ? (
          <SubmissionsManager token={token} apiBase={apiBase} />
        ) : (
          <CategoryManager category={activeTab} token={token} apiBase={apiBase} />
        )}
      </div>

      {/* Category Tabs */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        justifyContent: 'center',
        gap: '0',
        padding: '0',
        zIndex: 100,
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              flex: 1,
              padding: '0.875rem 1rem',
              background: activeTab === cat.id ? '#111827' : 'transparent',
              color: activeTab === cat.id ? '#fff' : '#6b7280',
              border: 'none',
              borderBottom: activeTab === cat.id ? '2px solid #111827' : '2px solid transparent',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: activeTab === cat.id ? 600 : 400,
              transition: 'all 0.2s',
            }}
          >
            {cat.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function CategoryManager({ category, token, apiBase }: { category: string; token: string; apiBase: string }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [editingPost, setEditingPost] = React.useState<any>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [error, setError] = React.useState('');

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiBase}/api/admin/posts?category=${category}`, {
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
  }, [category]);

  const deletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPosts(posts.filter(p => p.id !== postId));
        alert('删除成功');
      } else {
        alert('删除失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setShowEditModal(true);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>加载中...</div>;
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '2rem',
        background: '#fef2f2',
        borderRadius: 8,
        color: '#dc2626',
        marginBottom: '2rem'
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
          重试
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
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>
          文章管理 ({CATEGORIES.find(c => c.id === category)?.label})
        </h2>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>共 {posts.length} 篇</span>
      </div>

      <div style={{
        background: 'white',
        borderRadius: 8,
        overflow: 'hidden',
        border: '1px solid #e5e7eb',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>ID</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>标题</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>Slug</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>状态</th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>日期</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, fontSize: '0.85rem', color: '#374151' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.9rem' }}>{post.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 500, color: '#111827', fontSize: '0.9rem' }}>{post.title}</td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.85rem' }}>{post.slug}</td>
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '2px 8px',
                    borderRadius: 4,
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    background: post.status === 'published' ? '#f3f4f6' : '#fef3c7',
                    color: post.status === 'published' ? '#374151' : '#92400e',
                  }}>
                    {post.status === 'published' ? '已发布' : '待审核'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px', color: '#6b7280', fontSize: '0.875rem' }}>{new Date(post.created_at).toLocaleDateString('zh-CN')}</td>
                <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleEdit(post)}
                      style={{
                        padding: '4px 12px',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
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
                        padding: '4px 12px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 500,
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

      {/* Edit Modal */}
      {showEditModal && editingPost && (
        <PostEditorModal
          post={editingPost}
          category={category}
          token={token}
          apiBase={apiBase}
          onSave={() => {
            setShowEditModal(false);
            fetchPosts();
          }}
          onCancel={() => setShowEditModal(false)}
        />
      )}
    </div>
  );
}

function PostEditor({ post, category, token, apiBase, onSave, onCancel }: {
  post: any;
  category: string;
  token: string;
  apiBase: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  const isEdit = !!post;
  const [formData, setFormData] = React.useState({
    title: post?.title || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    category: post?.category || category,
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
      let response: Response;
      
      if (isEdit) {
        response = await fetch(`${apiBase}/api/admin/posts/${post.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      } else {
        response = await fetch(`${apiBase}/api/admin/posts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(formData),
        });
      }

      if (response.ok) {
        alert(isEdit ? '更新成功' : '创建成功');
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
      marginBottom: '4rem',
    }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.25rem', fontWeight: 600 }}>
        {isEdit ? '编辑文章' : '写新文章'}
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
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="my-post"
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  fontSize: '0.95rem',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={generateSlugFromTitle}
                style={{
                  padding: '8px 16px',
                  background: '#f3f4f6',
                  border: '1px solid #d1d5db',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                自动生成
              </button>
            </div>
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
            {CATEGORIES.filter(c => c.id !== 'submit').map((cat) => (
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
            placeholder="文章摘要（可选）"
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
          <label style={{
            display: 'block',
            fontWeight: 500,
            fontSize: '0.875rem',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            正文 (Markdown)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="在此输入正文，支持 Markdown..."
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
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.8rem', color: '#6b7280' }}>
            在此输入正文，支持 Markdown。使用工具栏插入图片...
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '8px 24px',
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
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '8px 32px',
              background: saving ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            {saving ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  );
}

function PostEditorModal({ post, category, token, apiBase, onSave, onCancel }: {
  post: any;
  category: string;
  token: string;
  apiBase: string;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 8,
        maxWidth: 800,
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '2rem',
      }}>
        <PostEditor post={post} category={category} token={token} apiBase={apiBase} onSave={onSave} onCancel={onCancel} />
      </div>
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
    if (!confirm('确定要批准这篇投稿并发布吗？')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
        alert('已批准发布');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  const rejectPost = async (postId: number) => {
    const reason = prompt('请输入拒绝原因（可选）：');
    
    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
        alert('已拒绝该投稿');
      }
    } catch (err) {
      alert('操作失败');
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>加载中...</div>;
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
        paddingBottom: '1rem',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>投稿审核</h2>
        <span style={{ color: '#6b7280', fontSize: '0.9rem' }}>共 {submissions.length} 条待审核</span>
      </div>

      <div style={{ display: 'grid', gap: '1rem' }}>
        {submissions.map((sub) => (
          <div key={sub.id} style={{
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '1.5rem',
          }}>
            <h3 style={{ margin: '0 0 0.75rem', color: '#111827', fontSize: '1.1rem', fontWeight: 600 }}>
              {sub.title}
            </h3>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: '0 0 1rem' }}>
              作者: {sub.author || '匿名'} | 提交时间: {new Date(sub.created_at).toLocaleDateString('zh-CN')}
            </p>
            <p style={{
              color: '#4b5563',
              lineHeight: 1.6,
              margin: '0 0 1.25rem',
              padding: '1rem',
              background: '#f9fafb',
              borderRadius: 4,
              fontSize: '0.9rem',
              maxHeight: 150,
              overflow: 'auto',
            }}>
              {sub.excerpt}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={() => approvePost(sub.id)}
                style={{
                  padding: '8px 20px',
                  background: '#111827',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                批准发布
              </button>
              <button
                onClick={() => rejectPost(sub.id)}
                style={{
                  padding: '8px 20px',
                  background: '#fff',
                  color: '#dc2626',
                  border: '1px solid #fecaca',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                }}
              >
                拒绝
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
          fontSize: '1rem',
        }}>
          暂无待审核投稿
        </div>
      )}
    </div>
  );
}
