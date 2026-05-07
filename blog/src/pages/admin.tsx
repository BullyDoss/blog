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

const CATEGORIES = [
  { id: 'notes', label: '📝 学习笔记', icon: '📝' },
  { id: 'brainstorm', label: '🧠 思维风暴', icon: '🧠' },
  { id: 'chat', label: '💬 夸夸其谈', icon: '💬' },
  { id: 'daily', label: '⚔️ 打怪经验', icon: '⚔️' },
  { id: 'submit', label: '📥 投稿审核', icon: '📥' },
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
          setError('❌ 连接超时 (15秒)\n\n可能原因：\n• Worker 未正确部署\n• 网络防火墙阻止\n• API 地址错误');
        } else if (fetchErr.message.includes('Failed to fetch') || fetchErr.message.includes('NetworkError')) {
          setError('❌ 网络请求失败\n\n请检查：\n1. 刷新页面重试\n2. 检查网络连接\n3. 如果问题持续请联系管理员');
        } else {
          setError(`❌ 网络错误: ${fetchErr.message}`);
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
      setError(`❌ ${err.message}`);
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
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout, apiBase }: { token: string; onLogout: () => void; apiBase: string }) {
  const [activeTab, setActiveTab] = React.useState<string>('notes');

  return (
    <div style={{
      maxWidth: 1200,
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
        flexWrap: 'wrap',
      }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveTab(cat.id)}
            style={{
              padding: '14px 24px',
              background: activeTab === cat.id ? '#eff6ff' : 'transparent',
              border: 'none',
              borderBottom: `3px solid ${activeTab === cat.id ? '#3b82f6' : 'transparent'}`,
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              color: activeTab === cat.id ? '#2563eb' : '#6b7280',
              transition: 'all 0.2s',
              marginBottom: -2,
            }}
          >
            {cat.label}
          </button>
        ))}
      </nav>

      <main style={{ minHeight: 400 }}>
        {activeTab === 'submit' 
          ? <SubmissionsManager token={token} apiBase={apiBase} />
          : <CategoryManager category={activeTab} token={token} apiBase={apiBase} />
        }
      </main>
    </div>
  );
}

function CategoryManager({ category, token, apiBase }: { category: string; token: string; apiBase: string }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<any>(null);
  const [error, setError] = React.useState('');

  const categoryInfo = CATEGORIES.find(c => c.id === category);
  
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
        alert('✅ 删除成功');
      } else {
        alert('❌ 删除失败');
      }
    } catch (err) {
      alert('❌ 网络错误');
    }
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleCreate = () => {
    setEditingPost(null);
    setShowEditor(true);
  };

  const handleSaveSuccess = () => {
    setShowEditor(false);
    setEditingPost(null);
    fetchPosts();
  };

  if (showEditor) {
    return (
      <PostEditor
        post={editingPost}
        category={category}
        token={token}
        apiBase={apiBase}
        onSave={handleSaveSuccess}
        onCancel={() => {
          setShowEditor(false);
          setEditingPost(null);
        }}
      />
    );
  }

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
        <span>共 {posts.length} 篇{categoryInfo?.label.replace(/^[^\s]+\s/, '')}</span>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
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
          <button onClick={handleCreate} style={{
            padding: '8px 20px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.9rem',
            fontWeight: 600,
            boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
          }}>
            ➕ 新建文章
          </button>
        </div>
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
              {['ID', '标题', 'Slug', '状态', '创建时间', '操作'].map((th) => (
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
                <td style={{ padding: '14px 18px', fontWeight: 500, color: '#111827', maxWidth: 300 }}>
                  {post.title}
                </td>
                <td style={{ padding: '14px 18px', color: '#6b7280', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {post.slug}
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(post)}
                      style={{
                        padding: '6px 12px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        border: '1px solid #bfdbfe',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      ✏️ 编辑
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      style={{
                        padding: '6px 12px',
                        background: '#fef2f2',
                        color: '#dc2626',
                        border: '1px solid #fecaca',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      🗑️ 删除
                    </button>
                  </div>
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
          📭 暂无文章，点击"新建文章"开始创作吧！
        </div>
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
        alert(isEdit ? '✅ 更新成功' : '✅ 创建成功');
        onSave();
      } else {
        const errorData = await response.json();
        setError(`❌ ${errorData.error || '操作失败'}`);
      }
    } catch (err) {
      setError('❌ 网络错误');
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
      borderRadius: 12,
      padding: '2rem',
      boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      border: '1px solid #e5e7eb',
    }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827' }}>
        {isEdit ? '✏️ 编辑文章' : '➕ 新建文章'}
      </h2>

      {error && (
        <div style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: '1.5rem',
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
            标题 *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="输入文章标题"
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            Slug (URL 路径)
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              value={formData.slug}
              onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              placeholder="自动生成或手动输入"
              style={{
                flex: 1,
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: 8,
                fontSize: '1rem',
                boxSizing: 'border-box',
                fontFamily: 'monospace',
              }}
            />
            <button
              type="button"
              onClick={generateSlugFromTitle}
              style={{
                padding: '12px 20px',
                background: '#f3f4f6',
                border: '2px solid #d1d5db',
                borderRadius: 8,
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.9rem',
              }}
            >
              自动生成
            </button>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{
            display: 'block',
            fontWeight: 600,
            fontSize: '0.9rem',
            color: '#374151',
            marginBottom: '0.5rem',
          }}>
            摘要
          </label>
          <input
            type="text"
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            placeholder="文章摘要（可选，留空则自动生成）"
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '1rem',
              boxSizing: 'border-box',
            }}
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
            内容 * (支持 Markdown)
          </label>
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="在这里撰写你的文章...&#10;&#10;支持 Markdown 语法：**粗体**、*斜体*、# 标题、- 列表等"
            required
            rows={15}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '2px solid #e5e7eb',
              borderRadius: 8,
              fontSize: '1rem',
              lineHeight: 1.6,
              boxSizing: 'border-box',
              fontFamily: 'monospace',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: '12px 24px',
              background: '#f3f4f6',
              color: '#374151',
              border: '2px solid #d1d5db',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
            }}
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{
              padding: '12px 32px',
              background: saving ? '#9ca3af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '1rem',
              boxShadow: saving ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.35)',
            }}
          >
            {saving ? '⏳ 保存中...' : '💾 保存'}
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
    if (!confirm('确定要批准这篇投稿并发布吗？')) return;

    try {
      const response = await fetch(`${apiBase}/api/admin/posts/${postId}/approve`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSubmissions(submissions.filter(s => s.id !== postId));
        alert('✅ 已批准发布');
      }
    } catch (err) {
      alert('❌ 操作失败');
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
        alert('✅ 已拒绝该投稿');
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
              maxHeight: 150,
              overflow: 'auto',
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
                onClick={() => rejectPost(sub.id)}
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
