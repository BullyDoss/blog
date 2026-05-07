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

function BlogLayout() {
  const [activeCategory, setActiveCategory] = useState('notes');
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
    }
    return 'https://api.bullydoss.com';
  };

  useEffect(() => {
    fetchAllPosts();
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

  const currentCategory = CATEGORIES.find(c => c.id === activeCategory);
  const categoryPosts = allPosts.filter(p => p.category === activeCategory);
  const selectedPost = allPosts.find(p => p.id === selectedPostId);

  const handlePostClick = (post: any) => {
    setSelectedPostId(post.id);
    setActiveCategory(post.category);
  };

  const handleBackToList = () => {
    setSelectedPostId(null);
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: 'calc(100vh - 60px)',
      marginTop: '0',
    }}>
      {/* Left Sidebar - Fixed */}
      <aside style={{
        width: '280px',
        flexShrink: 0,
        borderRight: '1px solid #e5e7eb',
        background: '#fff',
        overflowY: 'auto',
        position: 'sticky',
        top: '0',
        height: 'calc(100vh - 60px)',
      }}>
        {/* Sidebar Header */}
        <div style={{
          padding: '1.5rem 1.25rem',
          borderBottom: '1px solid #e5e7eb',
          fontWeight: 600,
          fontSize: '0.9rem',
          color: '#374151',
        }}>
          文章导航
        </div>

        {/* All Posts List */}
        <div style={{ padding: '0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.875rem' }}>
              加载中...
            </div>
          ) : allPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9ca3af', fontSize: '0.85rem' }}>
              暂无文章
            </div>
          ) : (
            allPosts.map((post) => {
              const isSelected = post.id === selectedPostId;
              return (
              <article
                key={post.id}
                onClick={() => handlePostClick(post)}
                style={{
                  padding: '0.875rem 1.25rem',
                  cursor: 'pointer',
                  borderBottom: '1px solid #f9fafb',
                  transition: 'background 0.15s ease',
                  background: isSelected ? '#111827' : (post.category === activeCategory && !selectedPostId ? '#f9fafb' : 'transparent'),
                }}
                onMouseEnter={(e) => {
                  if (!isSelected && post.category !== activeCategory) {
                    e.currentTarget.style.background = '#f9fafb';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected && post.category !== activeCategory) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.625rem',
                  marginBottom: '0.25rem',
                }}>
                  <span style={{
                    display: 'inline-block',
                    padding: '1px 6px',
                    background: isSelected ? 'rgba(255,255,255,0.15)' : '#f3f4f6',
                    color: isSelected ? '#d1d5db' : '#6b7280',
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
                    fontSize: '0.875rem',
                    color: isSelected ? '#fff' : '#374151',
                    fontWeight: isSelected || (post.category === activeCategory && !selectedPostId) ? 600 : 400,
                    lineHeight: 1.4,
                    flex: 1,
                  }}>
                    {post.title}
                  </span>
                </div>
                <div style={{
                  textAlign: 'right',
                  fontSize: '0.75rem',
                  color: isSelected ? '#9ca3af' : '#9ca3af',
                  paddingLeft: '4rem',
                }}>
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                </div>
              </article>
              );
            })
          )}
        </div>
      </aside>

      {/* Right Content Area */}
      <main style={{
        flex: 1,
        overflowY: 'auto',
        background: '#fff',
      }}>
        {/* Category Tabs */}
        <nav style={{
          display: 'flex',
          gap: '2rem',
          padding: '0 3rem',
          borderBottom: '1px solid #e5e7eb',
          background: '#fff',
          position: 'sticky',
          top: '0',
          zIndex: 10,
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setActiveCategory(cat.id); setSelectedPostId(null); }}
              style={{
                padding: '1rem 0',
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

        {/* Content: Detail View or Category List */}
        <div style={{ padding: '3rem 4rem', minHeight: 'calc(100vh - 120px)' }}>
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
          ) : selectedPost ? (
            <ArticleDetail
              post={selectedPost}
              categories={CATEGORIES}
              onBack={handleBackToList}
              apiBase={getApiBase()}
            />
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
                    {currentCategory?.desc}
                  </p>
                )}
              </header>

              {/* Posts List or Empty State */}
              {categoryPosts.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '6rem 2rem',
                  color: '#9ca3af',
                  fontSize: '1rem',
                }}>
                  还没有内容，快去后台发布吧
                </div>
              ) : (
                <div style={{ maxWidth: '700px' }}>
                  {categoryPosts.map((post) => (
                    <article
                      key={post.id}
                      onClick={() => handlePostClick(post)}
                      style={{
                        marginBottom: '2.5rem',
                        paddingBottom: '2rem',
                        borderBottom: categoryPosts.indexOf(post) < categoryPosts.length - 1 ? '1px solid #f3f4f6' : 'none',
                        cursor: 'pointer',
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
                      <p style={{
                        margin: '0 0 0.75rem',
                        color: '#6b7280',
                        fontSize: '0.95rem',
                        lineHeight: 1.6,
                      }}>
                        {post.excerpt || '-'}
                      </p>
                      <div style={{
                        textAlign: 'right',
                        fontSize: '0.875rem',
                        color: '#9ca3af',
                      }}>
                        {new Date(post.created_at).toLocaleDateString('zh-CN')}
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function ArticleDetail({ post, categories, onBack, apiBase }: {
  post: any;
  categories: typeof CATEGORIES;
  onBack: () => void;
  apiBase: string;
}) {
  const [comments, setComments] = useState<any[]>([]);
  const [commentName, setCommentName] = useState('');
  const [commentContent, setCommentContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    setCommentsLoading(true);
    try {
      const response = await fetch(`${apiBase}/api/posts/${post.slug}/comments`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim()) return;

    setSubmitting(true);
    try {
      const response = await fetch(`${apiBase}/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: commentName.trim(),
          content: commentContent.trim(),
        }),
      });

      if (response.ok) {
        setCommentName('');
        setCommentContent('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const postCategory = categories.find(c => c.id === post.category);

  return (
    <div style={{ maxWidth: '720px' }}>
      {/* Article Title & Meta */}
      <header style={{ marginBottom: '2.5rem' }}>
        <h1 style={{
          margin: '0 0 0.5rem',
          fontSize: '2rem',
          fontWeight: 700,
          color: '#111827',
        }}>
          {post.title}
        </h1>
        <p style={{
          margin: 0,
          fontSize: '0.95rem',
          color: '#9ca3af',
        }}>
          {new Date(post.created_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </header>

      {/* Article Content */}
      <article style={{
        marginBottom: '4rem',
        fontSize: '1rem',
        lineHeight: 1.8,
        color: '#374151',
      }}>
        <p style={{ margin: '0 0 1.25rem' }}>{post.excerpt || post.content || '-'}</p>
      </article>

      {/* Divider */}
      <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '0 0 2.5rem' }} />

      {/* Comments Section */}
      <section>
        <h2 style={{
          margin: '0 0 1.5rem',
          fontSize: '1.125rem',
          fontWeight: 600,
          color: '#111827',
        }}>
          评论 ({comments.length})
        </h2>

        {/* Comments List */}
        <div style={{ marginBottom: '2rem' }}>
          {commentsLoading ? (
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>加载评论中...</div>
          ) : comments.length === 0 ? (
            <div style={{ color: '#9ca3af', fontSize: '0.9rem' }}>暂无评论，快来抢沙发吧</div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} style={{
                display: 'flex',
                gap: '0.75rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '1px solid #f3f4f6',
              }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#111827',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  flexShrink: 0,
                }}>
                  {(comment.author || '匿')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '0.75rem',
                    marginBottom: '0.375rem',
                  }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#111827' }}>
                      {comment.author || '匿名'}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>
                      {new Date(comment.created_at).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#374151', lineHeight: 1.6 }}>
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment Form */}
        <form onSubmit={handleSubmitComment}>
          <div style={{ marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              placeholder="昵称"
              required
              style={{
                width: '100%',
                maxWidth: '240px',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: '0.9rem',
                boxSizing: 'border-box',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div style={{ marginBottom: '0.75rem' }}>
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="写下你的想法..."
              required
              rows={4}
              style={{
                width: '100%',
                padding: '10px 14px',
                border: '1px solid #e5e7eb',
                borderRadius: 6,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 28px',
              background: submitting ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '0.9rem',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
            }}
          >
            {submitting ? '发布中...' : '发布'}
          </button>
        </form>
      </section>
    </div>
  );
}
