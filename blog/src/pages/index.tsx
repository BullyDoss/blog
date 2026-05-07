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

function formatDate(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return '-';
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(dateStr: string | null | undefined) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime()) || d.getFullYear() < 2000 || d.getFullYear() > 2100) return '-';
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[d.getDay()]} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function renderMarkdown(text: string): string {
  if (!text) return '<p>-</p>';
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width:100%;border-radius:8px;margin:1rem 0;" loading="lazy" />');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.+?)__/g, '<em>$1</em>');
  html = html.replace(/`([^`]+)`/g, '<code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:0.88em;">$1</code>');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener" style="color:#111827;text-decoration:underline;">$1</a>');
  html = html.replace(/^### (.+)$/gm, '<h3 style="font-size:1.15rem;font-weight:600;margin:1.5rem 0 0.5rem;color:#111827;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size:1.3rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#111827;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size:1.6rem;font-weight:700;margin:1.5rem 0 0.5rem;color:#111827;">$1</h1>');
  html = html.replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #e5e7eb;padding-left:1rem;color:#6b7280;margin:1rem 0;">$1</blockquote>');
  html = html.replace(/^- (.+)$/gm, '<li style="margin:0.25rem 0 0.25rem 1.5rem;">$1</li>');
  html = html.replace(/(<li.*<\/li>\n?)+/g, (m) => `<ul style="margin:0.5rem 0;padding-left:1.5rem;">${m}</ul>`);
  html = html.replace(/\n\n/g, '</p><p style="margin:0 0 1rem;line-height:1.8;">');
  html = html.replace(/\n/g, '<br />');
  return `<p style="margin:0 0 1rem;line-height:1.8;">${html}</p>`;
}

function BlogLayout() {
  const [activeCategory, setActiveCategory] = useState<string>('notes');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState<boolean>(false);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
    }
    return 'https://api.bullydoss.com';
  };

  useEffect(() => {
    fetchAllPosts();
    const handleSearch = (e: any) => { setSearchQuery(e.detail); };
    window.addEventListener('blogSearch', handleSearch);
    return () => window.removeEventListener('blogSearch', handleSearch);
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

  let displayPosts = allPosts;
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase().trim();
    displayPosts = allPosts.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.excerpt?.toLowerCase().includes(q) ||
      p.content?.toLowerCase().includes(q)
    );
  }

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  const categoryPosts = displayPosts.filter(p => p.category === activeCategory);
  const selectedPost = allPosts.find(p => p.id === selectedPostId);

  const handlePostClick = (post: any) => {
    setSelectedPostId(post.id);
    setActiveCategory(post.category);
    setIsMobileSidebarOpen(false);
  };

  const handleBackToList = () => {
    setSelectedPostId(null);
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      background: '#fff',
    }}>

      <div style={{ display: 'flex', position: 'relative' }}>
        {/* Left Sidebar */}
        <aside style={{
          width: isMobile ? (isMobileSidebarOpen ? '260px' : '0') : '260px',
          flexShrink: 0,
          borderRight: isMobile ? 'none' : '1px solid #e5e7eb',
          background: '#fff',
          overflowY: 'auto',
          height: isMobile ? 'auto' : 'calc(100vh - 110px)',
          position: isMobile ? 'fixed' : 'relative',
          top: isMobile ? '52px' : 'auto',
          left: isMobile ? 0 : 'auto',
          zIndex: isMobile ? 50 : 1,
          transition: 'width 0.2s ease',
          boxShadow: isMobile && isMobileSidebarOpen ? '2px 0 12px rgba(0,0,0,0.08)' : 'none',
          overflowX: 'hidden',
        }} onClick={() => { if (isMobile && isMobileSidebarOpen) setIsMobileSidebarOpen(false); }}>
          {!isMobile || isMobileSidebarOpen ? (
            <>
              <div style={{
                padding: '1.25rem 1rem',
                borderBottom: '1px solid #e5e7eb',
                fontWeight: 600,
                fontSize: '0.85rem',
                color: '#374151',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                文章导航
                {isMobile && (
                  <button onClick={(e) => { e.stopPropagation(); setIsMobileSidebarOpen(false); }}
                    style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: '#9ca3af' }}>×</button>
                )}
              </div>

              <div style={{ padding: '0' }}>
                {loading ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af', fontSize: '0.85rem' }}>加载中...</div>
                ) : displayPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#9ca3af', fontSize: '0.82rem' }}>暂无文章</div>
                ) : (
                  displayPosts.map((post) => {
                    const isSelected = post.id === selectedPostId;
                    return (
                      <article key={post.id} onClick={(e) => { e.stopPropagation(); handlePostClick(post); }}
                        style={{
                          padding: '0.75rem 1rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f9fafb',
                          transition: 'background 0.15s ease',
                          background: isSelected ? '#111827' : (post.category === activeCategory && !selectedPostId ? '#f9fafb' : 'transparent'),
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '2px' }}>
                          <span style={{
                            display: 'inline-block', padding: '1px 5px', background: isSelected ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                            color: isSelected ? '#d1d5db' : '#6b7280', borderRadius: 3, fontSize: '0.68rem',
                            fontWeight: 500, whiteSpace: 'nowrap', flexShrink: 0, marginTop: '2px',
                          }}>
                            {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                          </span>
                          <span style={{
                            fontSize: '0.84rem', color: isSelected ? '#fff' : '#374151',
                            fontWeight: isSelected || (post.category === activeCategory && !selectedPostId) ? 600 : 400,
                            lineHeight: 1.35, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                          }}>{post.title}</span>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.72rem', color: isSelected ? '#9ca3af' : '#9ca3af', paddingLeft: '3.5rem' }}>
                          {formatDate(post.created_at)}
                        </div>
                      </article>
                    );
                  })
                )}
              </div>
            </>
          ) : null}
        </aside>

        {/* Mobile overlay */}
        {isMobile && isMobileSidebarOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 40, top: '52px' }}
            onClick={() => setIsMobileSidebarOpen(false)} />
        )}

        {/* Right Content Area */}
        <main style={{
          flex: 1,
          overflowY: 'auto',
          background: '#fff',
          minWidth: 0,
        }}>
          {/* Category Tabs */}
          <nav style={{
            display: 'flex',
            gap: isMobile ? '1rem' : '2rem',
            padding: isMobile ? '0 1.25rem' : '0 3rem',
            borderBottom: '1px solid #e5e7eb',
            background: '#fff',
            position: 'relative',
            zIndex: 10,
            alignItems: 'center',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}>
            {isMobile && (
              <button onClick={() => setIsMobileSidebarOpen(true)}
                style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: '#374151', padding: '0.5rem 0.25rem', flexShrink: 0, lineHeight: 1 }}>☰</button>
            )}
            {CATEGORIES.map((cat) => (
              <button key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setSelectedPostId(null); setShowSubmitForm(false); }}
                style={{
                  padding: isMobile ? '0.75rem 0' : '1rem 0',
                  background: 'transparent',
                  color: (activeCategory === 'submit' && !showSubmitForm) && cat.id === 'submit' ? '#111827' : (activeCategory === cat.id ? '#111827' : '#6b7280'),
                  border: 'none',
                  borderBottom: (activeCategory === 'submit' && !showSubmitForm) && cat.id === 'submit' ? '2px solid #111827' : (activeCategory === cat.id ? '2px solid #111827' : '2px solid transparent'),
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.88rem' : '0.95rem',
                  fontWeight: ((activeCategory === 'submit' && !showSubmitForm) && cat.id === 'submit') ? 600 : (activeCategory === cat.id ? 600 : 400),
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {cat.label}
              </button>
            ))}
            {activeCategory === 'submit' && (
              <button onClick={() => setShowSubmitForm(!showSubmitForm)}
                style={{
                  padding: isMobile ? '0.4rem 1rem' : '0.5rem 1.25rem',
                  background: showSubmitForm ? '#111827' : 'transparent',
                  color: showSubmitForm ? '#fff' : '#6b7280',
                  border: showSubmitForm ? 'none' : '1px solid #d1d5db',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: showSubmitForm ? 500 : 400,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                我要投稿
              </button>
            )}
          </nav>

          {/* Content Area */}
          <div style={{ padding: isMobile ? '1.5rem 1.25rem' : '2.5rem 3rem', minHeight: 'calc(100vh - 120px)' }}>
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#9ca3af' }}>加载中...</div>
            ) : selectedPost ? (
              <ArticleDetail post={selectedPost} categories={CATEGORIES} onBack={handleBackToList} apiBase={getApiBase()} isMobile={isMobile} />
            ) : showSubmitForm && activeCategory === 'submit' ? (
              <SubmitFormPanel apiBase={getApiBase()} onSuccess={() => { setShowSubmitForm(false); fetchAllPosts(); }} isMobile={isMobile} />
            ) : (
              <>
                <header style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
                  <h1 style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: '#111827' }}>
                    {currentCategory?.label}
                  </h1>
                  {currentCategory?.desc && (
                    <p style={{ margin: 0, fontSize: isMobile ? '0.88rem' : '1rem', color: '#6b7280' }}>{currentCategory?.desc}</p>
                  )}
                </header>

                {categoryPosts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: isMobile ? '3rem 1rem' : '6rem 2rem', color: '#9ca3af', fontSize: isMobile ? '0.92rem' : '1rem' }}>
                    还没有内容，快去后台发布吧
                  </div>
                ) : (
                  <div style={{ maxWidth: '100%' }}>
                    {categoryPosts.map((post) => (
                      <article key={post.id} onClick={() => handlePostClick(post)}
                        style={{
                          marginBottom: isMobile ? '1.5rem' : '2.5rem',
                          paddingBottom: isMobile ? '1.2rem' : '2rem',
                          borderBottom: categoryPosts.indexOf(post) < categoryPosts.length - 1 ? '1px solid #f3f4f6' : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                          <span style={{ display: 'inline-block', padding: '2px 8px', background: '#f3f4f6', color: '#6b7280', borderRadius: 4, fontSize: isMobile ? '0.72rem' : '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {CATEGORIES.find(c => c.id === post.category)?.label || post.category}
                          </span>
                          <span style={{ fontSize: isMobile ? '0.75rem' : '0.82rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                        <h2 style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '1.15rem' : '1.35rem', fontWeight: 600, color: '#111827', lineHeight: 1.4 }}>
                          {post.title}
                        </h2>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: isMobile ? '0.88rem' : '0.95rem', lineHeight: 1.6 }}>
                          {post.excerpt || '-'}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SubmitFormPanel({ apiBase, onSuccess, isMobile }: { apiBase: string; onSuccess: () => void; isMobile: boolean }) {
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [content, setContent] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !author || !content) { setError('请填写所有字段'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await fetch(`${apiBase}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, author, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setTitle(''); setAuthor(''); setContent('');
      alert('投稿成功，等待审核！');
      onSuccess();
    } catch (err: any) {
      setError(`提交失败: ${err.message}\n\n当前API: ${apiBase}\n请确认Worker已部署且CORS已配置`);
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : 600, margin: '0 auto' }}>
      <h1 style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '1.4rem' : '1.75rem', fontWeight: 700, color: '#111827' }}>我要投稿</h1>
      <p style={{ margin: '0 0 isMobile ? 1.5rem : 2rem', fontSize: '0.92rem', color: '#6b7280' }}>分享你的想法、经验或故事，我们会审核后发布</p>

      {error && (<div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '10px 14px', borderRadius: 6, marginBottom: '1rem', fontSize: '0.85rem', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{error}</div>)}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem' }}>标题</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入标题" required disabled={submitting}
            style={{ width: '100%', padding: isMobile ? '10px 12px' : '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.1rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem' }}>昵称</label>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder="你的昵称" required disabled={submitting}
            style={{ width: '100%', padding: isMobile ? '10px 12px' : '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.92rem', boxSizing: 'border-box', outline: 'none' }} />
        </div>

        <div style={{ marginBottom: '1.4rem' }}>
          <label style={{ display: 'block', fontWeight: 500, fontSize: '0.85rem', color: '#374151', marginBottom: '0.35rem' }}>正文内容</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="写下你想分享的内容..." required disabled={submitting} rows={isMobile ? 6 : 8}
            style={{ width: '100%', padding: isMobile ? '10px 12px' : '10px 14px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.92rem', lineHeight: 1.65, boxSizing: 'border-box', resize: 'vertical', outline: 'none' }} />
        </div>

        <button type="submit" disabled={submitting}
          style={{ width: '100%', padding: isMobile ? '11px' : '12px', background: submitting ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 6, cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: 500, fontSize: '0.95rem' }}>
          {submitting ? '提交中...' : '提交投稿'}
        </button>
      </form>
    </div>
  );
}

function ArticleDetail({ post, categories, onBack, apiBase, isMobile }: {
  post: any; categories: typeof CATEGORIES; onBack: () => void; apiBase: string; isMobile: boolean;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => { fetchComments(); }, [post.id]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/posts/${post.slug}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) { console.error('Failed to fetch comments:', err); }
    finally { setCommentsLoading(false); }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim()) return;
    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/posts/${post.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: commentName.trim(), content: commentContent.trim() }),
      });
      if (response.ok) { setCommentName(''); setCommentContent(''); fetchComments(); }
    } catch (err) { console.error('Failed to submit comment:', err); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ maxWidth: isMobile ? '100%' : '720px', margin: '0 auto' }}>
      <header style={{ marginBottom: isMobile ? '1.5rem' : '2.5rem' }}>
        <h1 style={{ margin: '0 0 0.4rem', fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: 700, color: '#111827' }}>{post.title}</h1>
        <p style={{ margin: 0, fontSize: '0.9rem', color: '#9ca3af' }}>
          {formatDateTime(post.created_at)}
        </p>
      </header>

      <article style={{ marginBottom: isMobile ? '2.5rem' : '4rem', fontSize: isMobile ? '0.95rem' : '1rem', lineHeight: 1.8, color: '#374151' }}
        dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || post.excerpt || '-') }} />

      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 isMobile ? 1.5rem : 2.5rem' }} />

      <section>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: isMobile ? '1rem' : '1.125rem', fontWeight: 600, color: '#111827' }}>
          评论 ({comments.length})
        </h2>

        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          {commentsLoading ? (<div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>加载评论中...</div>)
            : comments.length === 0 ? (<div style={{ color: '#9ca3af', fontSize: '0.88rem' }}>暂无评论，快来抢沙发吧</div>)
            : (comments.map((comment) => (
              <div key={comment.id} style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid #f3f4f6' }}>
                <div style={{
                  width: isMobile ? '30px' : '36px', height: isMobile ? '30px' : '36px', borderRadius: '50%',
                  background: '#111827', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight: 600, flexShrink: 0,
                }}>{(comment.author || '匿')[0].toUpperCase()}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.65rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, fontSize: isMobile ? '0.85rem' : '0.9rem', color: '#111827' }}>{comment.author || '匿名'}</span>
                    <span style={{ fontSize: isMobile ? '0.75rem' : '0.8rem', color: '#9ca3af' }}>{formatDate(comment.created_at)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: isMobile ? '0.86rem' : '0.9rem', color: '#374151', lineHeight: 1.6 }}>{comment.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmitComment}>
          <div style={{ marginBottom: '0.65rem' }}>
            <input type="text" value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="昵称" required
              style={{ width: '100%', maxWidth: isMobile ? '100%' : '240px', padding: '9px 13px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div style={{ marginBottom: '0.65rem' }}>
            <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="写下你的想法..." required rows={isMobile ? 3 : 4}
              style={{ width: '100%', padding: '9px 13px', border: '1px solid #e5e7eb', borderRadius: 6, fontSize: '0.88rem', lineHeight: 1.6, boxSizing: 'border-box', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
          <button type="submit" disabled={submitting}
            style={{ padding: isMobile ? '9px 22px' : '10px 28px', background: submitting ? '#9ca3af' : '#111827', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.88rem', fontWeight: 500, cursor: submitting ? 'not-allowed' : 'pointer' }}>
            {submitting ? '发布中...' : '发布'}
          </button>
        </form>
      </section>
    </div>
  );
}
