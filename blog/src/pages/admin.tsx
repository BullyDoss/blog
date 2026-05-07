import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function AdminPage(): React.ReactElement {
  return (
    <BrowserOnly fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#666', background: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}>
      {() => <AdminDashboard />}
    </BrowserOnly>
  );
}

const CATEGORIES = [
  { id: 'notes', label: '学习笔记' },
  { id: 'brainstorm', label: '思维风暴' },
  { id: 'chat', label: '夸夸其谈' },
  { id: 'daily', label: '打怪经验' },
  { id: 'submit', label: '投稿专区' },
];

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000) return '-';
  return d.toLocaleDateString('zh-CN');
}

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
        console.error('[Admin Login] 网络错误:', fetchErr.message);
        if (fetchErr.name === 'AbortError') {
          setError(`连接超时\n\n请检查:\n- API地址: ${apiBase}\n- Worker是否已部署`);
        } else if (fetchErr.message.includes('Failed to fetch') || fetchErr.message.includes('NetworkError')) {
          setError(`网络请求失败 (${fetchErr.message})\n\n请检查:\n1. API域名是否正确: ${apiBase}\n2. Worker是否已部署\n3. 浏览器控制台(F12)查看详情`);
        } else {
          setError(`网络错误: ${fetchErr.message}`);
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f3f4f6',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    }}>
      <div style={{
        maxWidth: 420,
        width: '100%',
        background: '#ffffff',
        borderRadius: 8,
        padding: '2.5rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        border: '1px solid #e5e7eb',
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827', textAlign: 'center' }}>
          后台管理登录
        </h2>

        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>
          登录后可管理文章和审核投稿
        </p>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
            padding: '12px 16px', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required disabled={loading}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required disabled={loading}
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ width: '100%', padding: '10px', background: loading ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.95rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <a href="/" style={{ color: '#6b7280', fontSize: '0.875rem', textDecoration: 'none' }}>返回首页</a>
        </div>
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout, apiBase }: { token: string; onLogout: () => void; apiBase: string }) {
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<any>(null);

  const handleEditPost = (post: any) => { setEditingPost(post); setShowEditor(true); };
  const handleSaveDone = () => { setShowEditor(false); setEditingPost(null); };
  const handleCancelEdit = () => { setShowEditor(false); setEditingPost(null); };

  return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <header style={{
        background: '#111827',
        color: 'white',
        padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.6rem 1rem' : '0.7rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
      }}>
        <h1 style={{ margin: 0, fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.88rem' : '1rem', fontWeight: 600 }}>管理后台</h1>
        <div style={{ display: 'flex', gap: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.35rem' : '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowEditor(false); setEditingPost(null); }}
            style={{ padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '3px 10px' : '4px 14px', background: showEditor ? 'transparent' : 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.78rem' : '0.85rem' }}>
            文章管理
          </button>
          <button onClick={() => { setShowEditor(true); setEditingPost(null); }}
            style={{ padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '3px 10px' : '4px 14px', background: showEditor && !editingPost ? '#fff' : 'transparent', color: showEditor && !editingPost ? '#111827' : '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.78rem' : '0.85rem', fontWeight: showEditor && !editingPost ? 500 : 400 }}>
            写新文章
          </button>
          <button onClick={onLogout}
            style={{ padding: typeof window !== 'undefined' && window.innerWidth < 640 ? '3px 10px' : '4px 14px', background: 'transparent', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: typeof window !== 'undefined' && window.innerWidth < 640 ? '0.78rem' : '0.85rem' }}>
            退出
          </button>
        </div>
      </header>

      <div style={{ padding: '1.5rem 2rem', maxWidth: '100%' }}>
        {showEditor ? (
          <PostEditor token={token} apiBase={apiBase} post={editingPost} onSave={handleSaveDone} onCancel={handleCancelEdit} />
        ) : (
          <>
            <AllPostsManager token={token} apiBase={apiBase} onEdit={handleEditPost} />
            <SubmissionsManager token={token} apiBase={apiBase} />
          </>
        )}
      </div>
    </div>
  );
}

function AllPostsManager({ token, apiBase, onEdit }: { token: string; apiBase: string; onEdit: (post: any) => void }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [errorMsg, setErrorMsg] = React.useState('');
  const [deletingId, setDeletingId] = React.useState<number | null>(null);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) },
      });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        let errDetail = '';
        try { errDetail = JSON.parse(text).error || ''; } catch {}
        throw new Error(errDetail || `HTTP ${res.status}`);
      }
      return res;
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
        throw new Error(`无法连接API (${url})\n\n可能原因:\n1. Worker未部署或崩溃(缺少D1/R2绑定)\n2. 域名DNS未生效\n3. CORS配置问题\n\n当前API地址: ${apiBase}`);
      }
      throw err;
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await safeFetch(`${apiBase}/api/admin/posts`);
      const data = await response.json();
      setPosts(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchPosts(); }, [token]);

  const deletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    setDeletingId(postId);
    try {
      await safeFetch(`${apiBase}/api/admin/posts/${postId}`, { method: 'DELETE' });
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>加载中...</div>;

  return (
    <div style={{ marginBottom: '3rem' }}>
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{errorMsg}</div>
      )}

      {/* 图2 风格表格 */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
        <thead>
          <tr>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 400, fontSize: '0.85rem', color: '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>标题</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 400, fontSize: '0.85rem', color: '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>频道</th>
            <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 400, fontSize: '0.85rem', color: '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>时间</th>
            <th style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 400, fontSize: '0.85rem', color: '#9ca3af', borderBottom: '1px solid #e5e7eb' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map((post) => (
            <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
              <td style={{ padding: '13px 16px', color: '#111827', fontSize: '0.9rem' }}>{post.title}</td>
              <td style={{ padding: '13px 16px', color: '#9ca3af', fontSize: '0.85rem' }}>
                {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
              </td>
              <td style={{ padding: '13px 16px', color: '#9ca3af', fontSize: '0.85rem' }}>{formatDate(post.created_at)}</td>
              <td style={{ padding: '13px 16px', textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', gap: '1rem', alignItems: 'center' }}>
                  <button onClick={() => onEdit(post)}
                    style={{ padding: '4px 14px', background: '#111827', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
                    编辑
                  </button>
                  <button onClick={() => deletePost(post.id)} disabled={deletingId === post.id}
                    style={{ padding: '4px 0', background: 'transparent', color: deletingId === post.id ? '#d1d5db' : '#9ca3af', border: 'none', cursor: deletingId === post.id ? 'not-allowed' : 'pointer', fontSize: '0.82rem' }}>
                    {deletingId === post.id ? '...' : '删除'}
                  </button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>

      {posts.length === 0 && !errorMsg && <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>暂无文章</div>}
    </div>
  );
}

function PostEditor({ token, apiBase, post, onSave, onCancel }: { token: string; apiBase: string; post: any | null; onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = React.useState({
    title: post?.title || '', slug: post?.slug || '', content: post?.content || '',
    excerpt: post?.excerpt || '', category: post?.category || 'notes',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    if (post) setFormData({ title: post.title || '', slug: post.slug || '', content: post.content || '', excerpt: post.excerpt || '', category: post.category || 'notes' });
  }, [post]);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) } });
      if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
      return res;
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) throw new Error(`无法连接API\n\n当前API: ${apiBase}\n请确认Worker已正确部署且绑定了D1数据库`);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) { setError('标题和内容不能为空'); return; }
    setSaving(true); setError('');
    try {
      if (post) await safeFetch(`${apiBase}/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify(formData) });
      else await safeFetch(`${apiBase}/api/admin/posts`, { method: 'POST', body: JSON.stringify(formData) });
      alert(post ? '更新成功' : '创建成功'); onSave();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const generateSlugFromTitle = () => {
    const slug = formData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').substring(0, 80);
    setFormData({ ...formData, slug });
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: '1.15rem', fontWeight: 600 }}>{post ? '编辑文章' : '写新文章'}</h2>
      {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>{error}</div>)}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: typeof window !== 'undefined' && window.innerWidth < 640 ? '1fr' : '1fr 1fr', gap: '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>标题</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="请输入标题" required disabled={saving}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>URL Slug (slug)</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} onBlur={generateSlugFromTitle} placeholder="my-post" disabled={saving}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.92rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>所属频道</label>
          <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={saving}
            style={{ width: '200px', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.92rem', outline: 'none', background: 'white' }}>
            {CATEGORIES.map((cat) => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
          </select>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>摘要</label>
          <input type="text" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="简短描述..." disabled={saving}
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.75rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>正文 (Markdown)</label>
          <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="在此输入正文，支持 Markdown..." required disabled={saving} rows={12}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 4, fontSize: '0.92rem', lineHeight: 1.65, boxSizing: 'border-box', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: '11px', background: saving ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.92rem' }}>
            {saving ? '保存中...' : '发布'}
          </button>
          <button type="button" onClick={onCancel} disabled={saving}
            style={{ padding: '11px 32px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 4, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.92rem' }}>
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

  const safeFetch = async (url: string, options?: RequestInit) => {
    const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) } });
    if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
    return res;
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const response = await safeFetch(`${apiBase}/api/admin/posts?category=submit&status=pending`);
      const data = await response.json();
      setSubmissions(data.filter((p: any) => p.status === 'pending'));
    } catch (err) { console.error('[Admin] 获取投稿失败:', err); } finally { setLoading(false); }
  };

  React.useEffect(() => { fetchSubmissions(); }, [token]);

  const approvePost = async (postId: number) => {
    if (!confirm('确定要批准这篇投稿吗？')) return;
    try { await safeFetch(`${apiBase}/api/admin/posts/${postId}/approve`, { method: 'PUT' }); setSubmissions(submissions.filter(s => s.id !== postId)); } catch (err: any) { alert(`操作失败: ${err.message}`); }
  };
  const rejectPost = async (postId: number) => {
    if (!confirm('确定要拒绝这篇投稿吗？')) return;
    try { await safeFetch(`${apiBase}/api/admin/posts/${postId}/reject`, { method: 'PUT' }); setSubmissions(submissions.filter(s => s.id !== postId)); } catch (err: any) { alert(`操作失败: ${err.message}`); }
  };

  if (loading || submissions.length === 0) return null;

  return (
    <div>
      <h2 style={{ margin: '2rem 0 1.25rem', color: '#111827', fontSize: '1rem', fontWeight: 600 }}>待审核投稿 ({submissions.length})</h2>
      <div style={{ display: 'grid', gap: '0.75rem' }}>
        {submissions.map((sub) => (
          <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid #f3f4f6' }}>
            <div>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: '0.9rem', marginBottom: '0.2rem' }}>{sub.title}</div>
              <div style={{ color: '#9ca3af', fontSize: '0.82rem' }}>作者: {sub.author || '匿名'} | {formatDate(sub.created_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '2rem' }}>
              <button onClick={() => approvePost(sub.id)}
                style={{ padding: '5px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>批准</button>
              <button onClick={() => rejectPost(sub.id)}
                style={{ padding: '5px 16px', background: '#fff', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>拒绝</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
