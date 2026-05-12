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
    .admin-page { --admin-max-width: 1200px; }
    .admin-page .container { max-width: none !important; padding: 0 !important; margin: 0 !important; }
    .admin-page .main-wrapper { padding: 0 !important; max-width: none !important; }
    .admin-page main { max-width: none !important; padding: 0 !important; }
    .admin-page .markdown { max-width: none !important; }
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

function useMediaQuery(maxWidth: number): boolean {
  const [matches, setMatches] = React.useState(false);
  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${maxWidth}px)`);
    setMatches(mql.matches);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [maxWidth]);
  return matches;
}

function AdminDashboard() {
  const [view, setView] = React.useState<'login' | 'dashboard'>('login');
  const [token, setToken] = React.useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('admin_token') || '';
    return '';
  });

  const getApiBase = () => {
    const fallback = 'https://api.bullydoss.com';
    if (typeof window !== 'undefined' && window.__CONFIG__) return window.__CONFIG__.apiBaseUrl || fallback;
    return fallback;
  };

  React.useEffect(() => { if (token) setView('dashboard'); }, [token]);

  const handleLoginSuccess = (newToken: string) => { setToken(newToken); localStorage.setItem('admin_token', newToken); setView('dashboard'); };
  const handleLogout = () => { setToken(''); localStorage.removeItem('admin_token'); setView('login'); };

  if (view === 'login' || !token) return <LoginForm onSuccess={handleLoginSuccess} apiBase={getApiBase()} />;
  return <AdminPanel token={token} onLogout={handleLogout} apiBase={getApiBase()} />;
}

function LoginForm({ onSuccess, apiBase }: { onSuccess: (token: string) => void; apiBase: string }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
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
        console.error('[Admin Login]', fetchErr.message);
        if (fetchErr.name === 'AbortError') setError(`连接超时（30秒）\n\n请检查:\n- 网络连接\n- API地址: ${apiBase}\n- Worker是否已部署`);
        else if (fetchErr.message.includes('Failed to fetch') || fetchErr.message.includes('NetworkError')) setError(`网络请求失败\n\n请检查:\n1. 网络连接\n2. API: ${apiBase}\n3. Worker部署状态`);
        else setError(`错误: ${fetchErr.message}`);
        return;
      }
      clearTimeout(timeoutId);
      const responseText = await response.text();
      if (!response.ok) {
        let errorMsg;
        try { const errorData = JSON.parse(responseText); errorMsg = errorData.error || errorData.message || `HTTP ${response.status}`; } catch { errorMsg = `HTTP ${response.status}`; }
        throw new Error(errorMsg);
      }
      const data = JSON.parse(responseText);
      onSuccess(data.token);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 440, background: '#ffffff', borderRadius: 12, padding: '2.5rem 2.8rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.35rem', color: '#111827', textAlign: 'center' }}>后台管理登录</h2>
        <p style={{ textAlign: 'center', color: '#6b7280', marginBottom: '1.75rem', fontSize: '0.9rem' }}>登录后可管理文章和审核投稿</p>
        {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{error}</div>)}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.15rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>用户名</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="请输入用户名" required disabled={loading} style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.93rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.currentTarget.style.borderColor = '#111827'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'} />
          </div>
          <div style={{ marginBottom: '1.6rem' }}>
            <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.4rem' }}>密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="请输入密码" required disabled={loading} style={{ width: '100%', padding: '11px 14px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.93rem', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' }} onFocus={(e) => e.currentTarget.style.borderColor = '#111827'} onBlur={(e) => e.currentTarget.style.borderColor = '#d1d5db'} />
          </div>
          <button type="submit" disabled={loading} style={{ width: '100%', padding: '12px', background: loading ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 7, fontSize: '0.95rem', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>{loading ? '登录中...' : '登录'}</button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f3f4f6' }}><a href="/" style={{ color: '#6b7280', fontSize: '0.85rem', textDecoration: 'none', transition: 'color 0.2s' }}>返回首页</a></div>
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout, apiBase }: { token: string; onLogout: () => void; apiBase: string }) {
  const [showEditor, setShowEditor] = React.useState(false);
  const [editingPost, setEditingPost] = React.useState<any>(null);
  const isMobile = useMediaQuery(768);
  const isTablet = useMediaQuery(1024);

  const handleEditPost = (post: any) => { setEditingPost(post); setShowEditor(true); };
  const handleSaveDone = () => { setShowEditor(false); setEditingPost(null); };
  const handleCancelEdit = () => { setShowEditor(false); setEditingPost(null); };

  return (
    <div className="admin-page" style={{ minHeight: '100vh', background: '#fff', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        background: '#111827', color: 'white',
        padding: isMobile ? '0.65rem 1.25rem' : '0.75rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: '0.5rem', flexShrink: 0,
      }}>
        <h1 style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1.05rem', fontWeight: 600, letterSpacing: '0.02em' }}>管理后台</h1>
        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => { setShowEditor(false); setEditingPost(null); }}
            style={{ padding: isMobile ? '5px 12px' : '6px 20px', background: showEditor ? 'transparent' : 'rgba(255,255,255,0.12)', color: '#fff', border: showEditor ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent', borderRadius: 6, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.87rem', fontWeight: showEditor ? 400 : 500, transition: 'all 0.2s' }}>文章管理</button>
          <button onClick={() => { setShowEditor(true); setEditingPost(null); }}
            style={{ padding: isMobile ? '5px 12px' : '6px 20px', background: showEditor && !editingPost ? '#fff' : 'transparent', color: showEditor && !editingPost ? '#111827' : '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.87rem', fontWeight: showEditor && !editingPost ? 600 : 400, transition: 'all 0.2s' }}>写新文章</button>
          <button onClick={onLogout}
            style={{ padding: isMobile ? '5px 12px' : '6px 20px', background: 'transparent', color: 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.87rem', transition: 'all 0.2s' }} onMouseEnter={(e) => e.currentTarget.style.color = '#fff'} onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>退出</button>
        </div>
      </header>

      <div style={{ flex: 1, padding: isMobile ? '1rem 1.25rem' : isTablet ? '1.5rem 2rem' : '1.5rem 2rem', width: '100%', boxSizing: 'border-box', overflowY: 'auto' }}>
        {showEditor
          ? <PostEditor token={token} apiBase={apiBase} post={editingPost} onSave={handleSaveDone} onCancel={handleCancelEdit} />
          : (
            <>
              <AllPostsManager token={token} apiBase={apiBase} onEdit={handleEditPost} />
              <SubmissionsManager token={token} apiBase={apiBase} onViewSubmission={handleEditPost} />
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
  const [pinningId, setPinningId] = React.useState<number | null>(null);
  const isMobile = useMediaQuery(768);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
      return res;
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error(`请求超时 (${url})`);
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) throw new Error(`无法连接API\n\n当前API: ${apiBase}\n请确认Worker已正确部署且绑定了D1数据库`);
      throw err;
    }
  };

  const fetchPosts = async () => { setLoading(true); setErrorMsg(''); try { const res = await safeFetch(`${apiBase}/api/admin/posts`); const data = await res.json(); setPosts(data); } catch (err: any) { setErrorMsg(err.message); } finally { setLoading(false); } };
  React.useEffect(() => { fetchPosts(); }, [token]);

  const deletePost = async (postId: number) => { if (!confirm('确定删除？')) return; setDeletingId(postId); try { await safeFetch(`${apiBase}/api/admin/posts/${postId}`, { method: 'DELETE' }); setPosts(posts.filter(p => p.id !== postId)); } catch (err: any) { alert(err.message); } finally { setDeletingId(null); } };

  const togglePin = async (post: any) => {
    const postId = post.id;
    const isCurrentlyPinned = post.is_pinned === 1 || post.is_pinned === true;
    
    setPinningId(postId);
    try {
      if (isCurrentlyPinned) {
        await safeFetch(`${apiBase}/api/admin/posts/${postId}/unpin`, { method: 'PUT' });
        setPosts(posts.map(p => p.id === postId ? { ...p, is_pinned: 0 } : p));
      } else {
        await safeFetch(`${apiBase}/api/admin/posts/${postId}/pin`, { method: 'PUT' });
        setPosts(posts.map(p => p.id === postId ? { ...p, is_pinned: 1 } : p));
      }
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPinningId(null);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>加载中...</div>;

  return (
    <div style={{ marginBottom: '2rem' }}>
      {errorMsg && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.55, whiteSpace: 'pre-line' }}>{errorMsg}</div>)}

      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', border: '1px solid #e5e7eb', borderRadius: 10, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500, tableLayout: 'auto' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>标题</th>
              {!isMobile && <th style={{ padding: '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>频道</th>}
              <th style={{ padding: isMobile ? '10px 12px' : '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>时间</th>
              <th style={{ padding: isMobile ? '10px 12px' : '12px 18px', textAlign: 'right', fontWeight: 600, fontSize: isMobile ? '0.82rem' : '0.87rem', color: '#374151', borderBottom: '2px solid #e5e7eb' }}>操作</th>
            </tr>
          </thead>
          <tbody>{posts.map((post) => {
            const isPinned = post.is_pinned === 1 || post.is_pinned === true;
            return (
            <tr key={post.id} style={{ borderBottom: '1px solid #f3f4f6', background: isPinned ? '#fffbeb' : undefined }} onMouseEnter={(e) => (e.currentTarget as HTMLTableRowElement).style.background = isPinned ? '#fef3c7' : '#f9fafb'} onMouseLeave={(e) => (e.currentTarget as HTMLTableRowElement).style.background = isPinned ? '#fffbeb' : 'transparent'}>
              <td style={{ padding: isMobile ? '11px 12px' : '13px 18px', color: '#111827', fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: 500 }}>
                {isPinned && <span style={{ marginRight: '0.5rem' }}>📌</span>}
                {post.title}
              </td>
              {!isMobile && <td style={{ padding: '13px 18px', color: '#6b7280', fontSize: '0.86rem' }}><span style={{ display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', borderRadius: 4, fontSize: '0.8rem' }}>{CATEGORIES.find(c => c.id === post.category)?.label || post.category}</span></td>}
              <td style={{ padding: isMobile ? '11px 12px' : '13px 18px', color: '#6b7280', fontSize: isMobile ? '0.82rem' : '0.86rem' }}>{formatDate(post.created_at)}</td>
              <td style={{ padding: isMobile ? '11px 12px' : '13px 18px', textAlign: 'right' }}>
                <span style={{ display: 'inline-flex', gap: isMobile ? '0.5rem' : '0.75rem', alignItems: 'center' }}>
                  <button onClick={() => togglePin(post)} disabled={pinningId === post.id} title={isPinned ? '取消置顶' : '置顶文章'} style={{ padding: isMobile ? '4px 10px' : '5px 14px', background: isPinned ? '#f59e0b' : 'transparent', color: isPinned ? 'white' : '#f59e0b', border: isPinned ? 'none' : '1px solid #f59e0b', borderRadius: 5, cursor: pinningId === post.id ? 'not-allowed' : 'pointer', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 500, transition: 'all 0.2s' }}>{pinningId === post.id ? '...' : (isPinned ? '📌 已置顶' : '📌 置顶')}</button>
                  <button onClick={() => onEdit(post)} style={{ padding: isMobile ? '4px 12px' : '5px 16px', background: '#111827', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 500 }}>编辑</button>
                  <button onClick={() => deletePost(post.id)} disabled={deletingId === post.id} style={{ padding: isMobile ? '4px 8px' : '5px 12px', background: 'transparent', color: deletingId === post.id ? '#d1d5db' : '#ef4444', border: deletingId === post.id ? '1px solid #e5e7eb' : '1px solid transparent', borderRadius: 5, cursor: deletingId === post.id ? 'not-allowed' : 'pointer', fontSize: isMobile ? '0.8rem' : '0.84rem', fontWeight: 500 }}>{deletingId === post.id ? '...' : '删除'}</button>
                </span>
              </td>
            </tr>
            );
          })}</tbody>
        </table>
      </div>

      {posts.length === 0 && !errorMsg && (<div style={{ textAlign: 'center', padding: isMobile ? '2.5rem 1rem' : '4rem 2rem', color: '#9ca3af', fontSize: isMobile ? '0.92rem' : '1rem' }}>暂无文章，快去发布第一篇吧</div>)}
      <div style={{ marginTop: '0.75rem', textAlign: 'right', color: '#9ca3af', fontSize: '0.82rem' }}>共 {posts.length} 篇文章</div>
    </div>
  );
}

function PostEditor({ token, apiBase, post, onSave, onCancel }: { token: string; apiBase: string; post: any | null; onSave: () => void; onCancel: () => void }) {
  const [formData, setFormData] = React.useState({ title: post?.title || '', slug: post?.slug || '', content: post?.content || '', excerpt: post?.excerpt || '', category: post?.category || 'notes', created_at: formatDateTimeLocal(post?.created_at) });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [uploadingImg, setUploadingImg] = React.useState(false);
  const textAreaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const isMobile = useMediaQuery(768);
  const isTablet = useMediaQuery(1024);

  React.useEffect(() => { if (post) setFormData({ title: post.title || '', slug: post.slug || '', content: post.content || '', excerpt: post.excerpt || '', category: post.category || 'notes', created_at: formatDateTimeLocal(post.created_at) }); }, [post]);

  const safeFetch = async (url: string, options?: RequestInit) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) }, signal: controller.signal });
      clearTimeout(timeoutId);
      if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
      return res;
    } catch (err: any) {
      if (err.name === 'AbortError') throw new Error(`请求超时\n\n当前API: ${apiBase}`);
      if (err.message.includes('Failed to fetch')) throw new Error(`无法连接API\n\n当前API: ${apiBase}\n请确认Worker已正确部署且绑定了D1数据库`);
      throw err;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) { setError('标题和内容不能为空'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...formData }; delete (payload as any).created_at;
      if (formData.created_at) payload.created_at = new Date(formData.created_at).toISOString();
      if (post && post.status === 'pending') {
        payload.status = 'published';
      }
      if (post) await safeFetch(`${apiBase}/api/admin/posts/${post.id}`, { method: 'PUT', body: JSON.stringify(payload) });
      else await safeFetch(`${apiBase}/api/admin/posts`, { method: 'POST', body: JSON.stringify(payload) });
      alert(post ? (post.status === 'pending' ? '投稿已发布成功！' : '更新成功') : '创建成功'); onSave();
    } catch (err: any) { setError(err.message); } finally { setSaving(false); }
  };

  const generateSlugFromTitle = () => { const slug = formData.title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').substring(0, 80); setFormData({ ...formData, slug }); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (!file.type.startsWith('image/')) { alert('只能上传图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('图片大小不能超过 5MB'); return; }
    setUploadingImg(true); setError('');
    try {
      const fd = new FormData(); fd.append('image', file);
      const res = await fetch(`${apiBase}/api/images/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data.error || `上传失败 HTTP ${res.status}`); }
      const data = await res.json();
      const imgMarkdown = `\n![${file.name}](${data.url})\n`;
      const ta = textAreaRef.current;
      if (ta) { const start = ta.selectionStart, end = ta.selectionEnd; setFormData({ ...formData, content: formData.content.substring(0, start) + imgMarkdown + formData.content.substring(end) }); setTimeout(() => { ta.focus(); ta.setSelectionRange(start + imgMarkdown.length, start + imgMarkdown.length); }, 50); }
      else setFormData({ ...formData, content: formData.content + imgMarkdown });
    } catch (err: any) { setError(`图片上传失败: ${err.message}`); } finally { setUploadingImg(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : isTablet ? '100%' : '900px', margin: '0 auto' }}>
      <h2 style={{ margin: '0 0 1.25rem', color: '#111827', fontSize: isMobile ? '1.1rem' : '1.25rem', fontWeight: 700 }}>{post ? '编辑文章' : '写新文章'}</h2>
      {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.85rem', lineHeight: 1.55 }}>{error}</div>)}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr', gap: isMobile ? '0.85rem' : '1.25rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#374151', marginBottom: '0.35rem' }}>标题</label>
            <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="请输入标题" required disabled={saving} style={{ width: '100%', padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#374151', marginBottom: '0.35rem' }}>URL Slug</label>
            <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} onBlur={generateSlugFromTitle} placeholder="my-post" disabled={saving} style={{ width: '100%', padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.92rem', fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '1fr 1fr 1fr', gap: isMobile ? '0.85rem' : '1.25rem', marginBottom: '1.1rem' }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#374151', marginBottom: '0.35rem' }}>所属频道</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} disabled={saving} style={{ width: '100%', padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.92rem', outline: 'none', background: 'white' }}>{CATEGORIES.map((cat) => (<option key={cat.id} value={cat.id}>{cat.label}</option>))}</select>
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#374151', marginBottom: '0.35rem' }}>发布时间</label>
            <input type="datetime-local" value={formData.created_at || ''} onChange={(e) => setFormData({ ...formData, created_at: e.target.value })} disabled={saving} style={{ width: '100%', padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', color: '#374151' }} title="留空则使用当前时间" />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.86rem', color: '#374151', marginBottom: '0.35rem' }}>摘要</label>
            <input type="text" value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="简短描述..." disabled={saving} style={{ width: '100%', padding: '10px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
          </div>
        </div>

        <div style={{ marginBottom: '1.1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <label style={{ fontWeight: 600, fontSize: '0.86rem', color: '#374151' }}>正文 (支持 Markdown)</label>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 12px', background: uploadingImg ? '#e5e7eb' : '#f3f4f6', color: uploadingImg ? '#9ca3af' : '#374151', border: '1px dashed #d1d5db', borderRadius: 5, cursor: uploadingImg ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: 500 }}>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImg || saving} style={{ display: 'none' }} />{uploadingImg ? '上传中...' : '插入图片'}
            </label>
          </div>
          <textarea ref={textAreaRef} value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="在此输入正文，支持 Markdown..." required disabled={saving} rows={isMobile ? 10 : 14} style={{ width: '100%', padding: '12px 13px', border: '1px solid #d1d5db', borderRadius: 7, fontSize: '0.91rem', lineHeight: 1.7, boxSizing: 'border-box', fontFamily: '"SF Mono", Menlo, Consolas, monospace', resize: 'vertical', outline: 'none', background: '#fafafa' }} />
        </div>

        <div style={{ display: 'flex', gap: '0.85rem' }}>
          <button type="submit" disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.94rem' }}>{saving ? '保存中...' : '发布文章'}</button>
          <button type="button" onClick={onCancel} disabled={saving} style={{ padding: '12px 32px', background: '#fff', color: '#374151', border: '1px solid #d1d5db', borderRadius: 7, cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.94rem' }}>取消</button>
        </div>
      </form>
    </div>
  );
}

function SubmissionsManager({ token, apiBase, onViewSubmission }: { token: string; apiBase: string; onViewSubmission: (post: any) => void }) {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [dismissedIds, setDismissedIds] = React.useState<Set<number>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dismissed_submissions');
      if (stored) return new Set(JSON.parse(stored));
    }
    return new Set();
  });
  const isMobile = useMediaQuery(768);

  const safeFetch = async (url: string, options?: RequestInit) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    const res = await fetch(url, { ...options, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...(options?.headers || {}) }, signal: controller.signal });
    clearTimeout(timeoutId);
    if (!res.ok) { const text = await res.text().catch(() => ''); let errDetail = ''; try { errDetail = JSON.parse(text).error || ''; } catch {} throw new Error(errDetail || `HTTP ${res.status}`); }
    return res;
  };

  const fetchSubmissions = async () => { setLoading(true); try { const res = await safeFetch(`${apiBase}/api/admin/posts?category=submit&status=pending`); const data = await res.json(); setSubmissions(data.filter((p: any) => p.status === 'pending')); } catch (err) { console.error('[Admin]', err); } finally { setLoading(false); } };
  React.useEffect(() => { fetchSubmissions(); }, [token]);

  const handleCloseSingle = (postId: number) => {
    const newDismissed = new Set(dismissedIds);
    newDismissed.add(postId);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_submissions', JSON.stringify([...newDismissed]));
  };

  const handleCloseAll = () => {
    const allIds = submissions.map(s => s.id);
    const newDismissed = new Set([...dismissedIds, ...allIds]);
    setDismissedIds(newDismissed);
    localStorage.setItem('dismissed_submissions', JSON.stringify([...newDismissed]));
  };

  const handleViewSubmission = (sub: any) => {
    onViewSubmission(sub);
  };

  const visibleSubmissions = submissions.filter(sub => !dismissedIds.has(sub.id));

  if (loading || visibleSubmissions.length === 0) return null;

  return (
    <div>
      <h2 style={{ margin: '2rem 0 1rem', color: '#111827', fontSize: isMobile ? '0.95rem' : '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
        <span>
          新投稿通知 ({visibleSubmissions.length})
          <span style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 400, marginLeft: '0.5rem' }}>点击"查看投稿"进行编辑发布或删除</span>
        </span>
        <button onClick={handleCloseAll} style={{ padding: '4px 12px', background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', fontSize: '0.75rem', fontWeight: 500 }}>全部关闭</button>
      </h2>
      <div style={{ display: 'grid', gap: '0.65rem' }}>
        {visibleSubmissions.map((sub) => (
          <div key={sub.id} style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'flex-start' : 'center', gap: isMobile ? '0.5rem' : '1rem', padding: isMobile ? '0.75rem' : '0.85rem 1rem', borderBottom: '1px solid #f3f4f6', borderRadius: 8, background: isMobile ? '#fafafa' : 'transparent' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: '#111827', fontSize: isMobile ? '0.88rem' : '0.9rem', marginBottom: '0.15rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.title}</div>
              <div style={{ color: '#9ca3af', fontSize: isMobile ? '0.78rem' : '0.82rem' }}>作者: {sub.author || '匿名'} | {formatDate(sub.created_at)}</div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
              <button onClick={() => handleViewSubmission(sub)} style={{ padding: isMobile ? '5px 14px' : '5px 18px', background: '#111827', color: 'white', border: 'none', borderRadius: 5, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.83rem', fontWeight: 500 }}>查看投稿</button>
              <button onClick={() => handleCloseSingle(sub.id)} style={{ padding: isMobile ? '5px 14px' : '5px 18px', background: '#fff', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: 5, cursor: 'pointer', fontSize: isMobile ? '0.8rem' : '0.83rem', fontWeight: 500 }}>关闭</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
