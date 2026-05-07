import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

export default function AdminPage(): React.ReactElement {
  return (
    <BrowserOnly fallback={<div style={{ textAlign: 'center', padding: '4rem', color: '#666', background: '#f3f4f6', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>加载中...</div>}>
      {() => <AdminDashboard />}
    </BrowserOnly>
  );
}

if (typeof window !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    .admin-full-width { max-width: none !important; width: 100% !important; padding: 0 !important; margin: 0 !important; }
    .admin-full-width > * { max-width: none !important; }
    body.admin-page { overflow-x: hidden; }
  `;
  document.head.appendChild(style);
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
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function formatDateTimeLocal(dateStr?: string): string {
  if (!dateStr) {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now - offset).toISOString().slice(0, 16);
  }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
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
      return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
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
        try { const errorData = JSON.parse(responseText); errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`; } catch { errorMsg = `HTTP ${response.status}: ${responseText.slice(0, 100)}`; }
        throw new Error(errorMsg);
      }
      const data = JSON.parse(responseText);
      onSuccess(data.token);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#ffffff', borderRadius: 8, padding: '2.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', color: '#111827', textAlign: 'center' }}>后台管理登录</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '2rem', fontSize: '0.9rem' }}>登录后可管理文章和审核投稿</p>
        {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{error}</div>)}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required disabled={loading} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.875rem', color: '#374151', marginBottom: '0.5rem' }}>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required disabled={loading} style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '10px', background: loading ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.95rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer' }}>
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="admin-full-width" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column', width: '100vw' }}>
      <header style={{
        background: '#111827',
        color: 'white',
        padding: isMobile ? '0.6rem 1rem' : '0.7rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '0.5rem',
        flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '0.88rem' : '1rem', fontWeight: 600 }}>管理后台</h1>
        <div style={{ display: 'flex', gap: isMobile ? '0.35rem' : '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowEditor(false); setEditingPost(null); }}
            style={{ padding: isMobile ? '3px 10px' : '4px 14px', background: showEditor ? 'transparent' : 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>
            文章管理
          </button>
          <button onClick={() => { setShowEditor(true); setEditingPost(null); }}
            style={{ padding: isMobile ? '3px 10px' : '4px 14px', background: showEditor && !editingPost ? '#fff' : 'transparent', color: showEditor && !editingPost ? '#111827' : '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: showEditor && !editingPost ? 500 : 400 }}>
            写新文章
          </button>
          <button onClick={onLogout}
            style={{ padding: isMobile ? '3px 10px' : '4px 14px', background: 'transparent', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: isMobile ? '0.78rem' : '0.85rem' }}>
            退出
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding: isMobile ? '1rem' : '1.5rem 2rem', maxWidth: '100%', overflowY: 'auto' }}>
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
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) } });
      if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
      return res;
    } catch (err: any) {
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Load failed')) {
        throw new Error(`无法连接API (${url})\n\n可能原因:\n1. Worker未部署或崩溃(缺少D1/R2绑定)\n2. 域名DNS未生效\n3. CORS配置问题\n\n当前API地址: ${apiBase}`);
      }
      throw err;
    }
  };

  const fetchPosts = async () => {
    setLoading(true); setErrorMsg('');
    try { const response = await safeFetch(`${apiBase}/api/admin/posts`); const data = await response.json(); setPosts(data); } catch (err: any) { setErrorMsg(err.message); } finally { setLoading(false); }
  };

  React.useEffect(() => { fetchPosts(); }, [token]);

  const deletePost = async (postId: number) => {
    if (!confirm('确定要删除这篇文章吗？')) return;
    setDeletingId(postId);
    try { await safeFetch(`${apiBase}/api/admin/posts/${postId}`, { method: 'DELETE' }); setPosts(posts.filter(p => p.id !== postId)); } catch (err: any) { alert(err.message); } finally { setDeletingId(null); }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>加载中...</div>;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {errorMsg && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{errorMsg}</div>
      )}

      <div style={{
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500, tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb', width: '35%' }}>标题</th>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb', width: '15%' }}>频道</th>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 20px', textAlign: 'left', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb', width: '20%' }}>时间</th>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 20px', textAlign: 'right', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb', width: '30%' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((post) => (
              <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = '#f9fafb'}
                onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                <td style={{ padding: isMobile ? '11px 12px' : '13px 20px', color: '#111827', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.title}</td>
                <td style={{ padding: isMobile ? '11px 12px' : '13px 20px', color: '#6b7280', fontSize: isMobile ? '0.82rem' : '0.86rem' }}>
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: isMobile ? '0.75rem' : '0.8rem' }}>
                    {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                  </span>
                </td>
                <td style={{ padding: isMobile ? '11px 12px' : '13px 20px', color: '#6b7280', fontSize: isMobile ? '0.82rem' : '0.86rem' }}>{formatDate(post.created_at)}</td>
                <td style={{ padding: isMobile ? '11px 12px' : '13px 20px', textAlign: 'right' }}>
                  <span style={{ display: 'inline-flex', gap: isMobile ? '0.6rem' : '1rem', alignItems: 'center' }}>
                    <button onClick={() => onEdit(post)}
                      style={{ padding: isMobile ? '4px 12px' : '5px 18px', background: '#111827', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 500, transition: 'background 0.15s' }}
                      onMouseEnter={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#374151'}
                      onMouseLeave={(e) => (e.currentTarget as HTMLButtonElement).style.background = '#111827'}>编辑
                    </button>
                    <button onClick={() => deletePost(post.id)} disabled={deletingId === post.id}
                      style={{ padding: isMobile ? '4px 8px' : '5px 12px', background: 'transparent', color: deletingId === post.id ? '#d1d5db' : '#ef4444', border: deletingId === post.id ? '1px solid #e5e7eb' : '1px solid transparent', borderRadius: 5, cursor: deletingId === post.id ? 'not-allowed' : 'pointer', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 500, transition: 'all 0.15s' }}
                      onMouseEnter={(e) => { if (deletingId !== post.id) { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; (e.currentTarget as HTMLButtonElement).style.borderColor = '#fecaca'; } }}
                      onMouseLeave={(e) => { if (deletingId !== post.id) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'transparent'; } }}>
                      {deletingId === post.id ? '...' : '删除'}
                    </button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {posts.length === 0 && !errorMsg && (
        <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1rem' : '5rem 2rem', color: '#9ca3af', fontSize: isMobile ? '0.92rem' : '1rem' }}>暂无文章，快去发布第一篇吧</div>
      )}

      <div style={{ marginTop: '0.75rem', textAlign: 'right', color: '#9ca3af', fontSize: '0.8rem' }}>
        共 {posts.length} 篇文章
      </div>
    </div>
  );
}

function PostEditor({ token, apiBase, post, onSave, onCancel }: { token: string; apiBase: string; post: any | null; onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = React.useState({
    title: post?.title || '', slug: post?.slug || '', content: post?.content || '',
    excerpt: post?.excerpt || '', category: post?.category || 'notes',
    created_at: formatDateTimeLocal(post?.created_at),
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uploadingImg, setUploadingImg] = React.useState(false);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  React.useEffect(() => {
    if (post) setFormData({
      title: post.title || '', slug: post.slug || '', content: post.content || '',
      excerpt: post.excerpt || '', category: post.category || 'notes',
      created_at: formatDateTimeLocal(post.created_at),
    });
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
      const payload = { ...formData };
      delete (payload as any).created_at;
      if (formData.created_at) {
        payload.created_at = new Date(formData.created_at).toISOString();
      }
      if (post) await safeFetch(`${apiBase}/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await safeFetch(`${apiBase}/api/admin/posts`, { method: 'POST', body: JSON.stringify(payload) });
      alert(post ? '更新成功' : '创建成功'); onSave();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const generateSlugFromTitle = () => {
    const slug = formData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').substring(0, 80);
    setFormData({ ...formData, slug });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('只能上传图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('图片大小不能超过 5MB'); return; }

    setUploadingImg(true);
    setError('');
    try {
      const formData_upload = new FormData();
      formData_upload.append('image', file);
      const res = await fetch(`${apiBase}/api/images/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData_upload,
      });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `上传失败 HTTP ${res.status}`); }
      const data = await res.json();
      const imgMarkdown = `\n![${file.name}](${data.url})\n`;
      const ta = textAreaRef.current;
      if (ta) {
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const before = formData.content.substring(0, start);
        const after = formData.content.substring(end);
        setFormData({ ...formData, content: before + imgMarkdown + after });
        setTimeout(() => {
          ta.focus();
          ta.setSelectionRange(start + imgMarkdown.length, start + imgMarkdown.length);
        }, 50);
      } else {
        setFormData({ ...formData, content: formData.content + imgMarkdown });
      }
    } catch (err: any) { setError(`图片上传失败: ${err.message}`); } finally { setUploadingImg(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const insertAtCursor = (text: string) => {
    const ta = textAreaRef.current;
    if (!ta) { setFormData({ ...formData, content: formData.content + text }); return; }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    setFormData({ ...formData, content: before + text + after });
    setTimeout(() => { ta.focus(); ta.setSelectionRange(start + text.length, start + text.length); }, 50);
  };

  return (
    <div style={{ maxWidth: '100%', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.5rem', color: '#111827', fontSize: isMobile ? '1.1rem' : '1.2rem', fontWeight: 700 }}>{post ? '编辑文章' : '写新文章'}</h2>
      {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 6, marginBottom: '1.5rem', fontSize: '0.875rem', lineHeight: 1.6 }}>{error}</div>)}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.87rem', color: '#374151', marginBottom: '0.4rem' }}>标题</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="请输入标题" required disabled={saving}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.93rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = '#111827'}
              onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#d1d5db'} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.87rem', color: '#374151', marginBottom: '0.4rem' }}>URL Slug</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} onBlur={generateSlugFromTitle} placeholder="my-post" disabled={saving}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.93rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: isMobile ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.87rem', color: '#374151', marginBottom: '0.4rem' }}>所属频道</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={saving}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.93rem', outline: 'none', background: 'white' }}>
              {CATEGORIES.map((cat) => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.87rem', color: '#374151', marginBottom: '0.4rem' }}>发布时间</label>
            <input type="datetime-local" value={formData.created_at || ''} onChange={(e) => setFormData({ ...formData, created_at: e.target.value })} disabled={saving}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', color: '#374151' }}
              title="留空则使用当前时间" />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.87rem', color: '#374151', marginBottom: '0.4rem' }}>摘要</label>
            <input type="text" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="简短描述..." disabled={saving}
              style={{ width: '100%', padding: '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.93rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.87rem', color: '#374151' }}>正文 (支持 Markdown)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px',
                background: uploadingImg ? '#e5e7eb' : '#f3f4f6', color: uploadingImg ? '#9ca3af' : '#374151',
                border: '1px dashed #d1d5db', borderRadius: 5, cursor: uploadingImg ? 'not-allowed' : 'pointer',
                fontSize: '0.82rem', fontWeight: 500, transition: 'all 0.15s',
              }}>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImg || saving} style={{ display: 'none' }} />
                📷 {uploadingImg ? '上传中...' : '插入图片'}
              </label>
            </div>
          </div>
          <textarea ref={textAreaRef} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            placeholder="在此输入正文，支持 Markdown...&#10;&#10;快捷键提示:&#10;- **粗体** __斜体__&#10;- # 标题 ## 二级标题&#10;- [链接](url)&#10;- ![图片](url)"
            required disabled={saving} rows={isMobile ? 10 : 14}
            style={{ width: '100%', padding: '12px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.91rem', lineHeight: 1.7, boxSizing: 'border-box', fontFamily: '"SF Mono", Menlo, Consolas, monospace', resize: 'vertical', outline: 'none', background: '#fafafa', transition: 'border-color 0.2s' }}
            onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#111827'}
            onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#d1d5db'} />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button type="submit" disabled={saving}
            style={{ flex: 1, padding: '12px', background: saving ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.94rem', letterSpacing: '0.02em' }}>
            {saving ? '保存中...' : '发布文章'}
          </button>
          <button type="button" onClick={onCancel} disabled={saving}
            style={{ padding: '12px 36px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.94rem' }}>
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
    try { const response = await safeFetch(`${apiBase}/api/admin/posts?category=submit&status=pending`); const data = await response.json(); setSubmissions(data.filter((p: any) => p.status === 'pending')); } catch (err) { console.error('[Admin] 获取投稿失败:', err); } finally { setLoading(false); }
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
