import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import GitHubLogin, { useGitHubAuth } from '../components/GitHubLogin';

export default function SubmitPage(): React.ReactElement {
  return (
    <Layout title="投稿专区" description="向 BullyDoss 的笔记投稿">
      <main style={{ padding: '2rem 0' }}>
        <SubmitPageContent />
      </main>
    </Layout>
  );
}

function SubmitPageContent() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
    }
    return 'https://api.bullydoss.com';
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${getApiBase()}/api/posts?category=submit`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (view === 'form') {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 1.5rem' }}>
        <button
          onClick={() => setView('list')}
          style={{
            marginBottom: '1.5rem',
            padding: '10px 20px',
            background: '#f3f4f6',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: 500,
          }}
        >
          返回列表
        </button>
        <SubmitForm onSuccess={() => {
          alert('投稿成功！审核通过后将在此展示。');
          setView('list');
          fetchPosts();
        }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '2.5rem',
        paddingBottom: '2rem',
        borderBottom: '1px solid #e5e7eb',
      }}>
        <h1 style={{ fontSize: '2rem', margin: '0 0 0.75rem', color: '#111827', fontWeight: 600 }}>
          投稿专区
        </h1>
        
        <p style={{ fontSize: '1rem', color: '#6b7280', margin: 0, lineHeight: 1.6 }}>
          分享你的想法和经验，让更多人看到你的精彩内容
        </p>

        <button
          onClick={() => setView('form')}
          style={{
            marginTop: '1.5rem',
            padding: '12px 32px',
            background: '#111827',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: 500,
          }}
        >
          我要投稿
        </button>
      </div>

      {/* Posts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#9ca3af' }}>
          加载中...
        </div>
      ) : posts.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}>
          <h2 style={{ margin: '0 0 0.75rem', color: '#374151', fontSize: '1.25rem', fontWeight: 600 }}>
            还没有投稿文章
          </h2>
          <p style={{ color: '#6b7280', margin: '0 0 1.5rem', fontSize: '1rem' }}>
            成为第一个投稿者，分享你的精彩内容吧
          </p>
          <button
            onClick={() => setView('form')}
            style={{
              padding: '10px 24px',
              background: '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500,
            }}
          >
            立即投稿
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.25rem' }}>
          {posts.map((post) => (
            <article
              key={post.id}
              style={{
                background: 'white',
                borderRadius: 8,
                padding: '1.75rem',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                border: '1px solid #e5e7eb',
                transition: 'box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'}
            >
              <header style={{ marginBottom: '1rem' }}>
                <h2
                  style={{
                    margin: '0 0 0.75rem',
                    fontSize: '1.35rem',
                    color: '#111827',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <a
                    href={`/blog/${post.slug}`}
                    style={{ color: 'inherit', textDecoration: 'none' }}
                  >
                    {post.title}
                  </a>
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  color: '#6b7280',
                  fontSize: '0.9rem',
                }}>
                  <img
                    src={post.avatar_url || `https://github.com/${post.author}.png`}
                    alt={post.author_name || post.author || '匿名'}
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <span>作者: {post.author_name || post.author || '匿名'}</span>
                  <span>|</span>
                  <span>{new Date(post.created_at).toLocaleDateString('zh-CN')}</span>
                </div>
              </header>

              <p style={{
                color: '#4b5563',
                lineHeight: 1.7,
                margin: 0,
                fontSize: '0.95rem',
              }}>
                {post.excerpt}
              </p>

              <footer style={{
                marginTop: '1.25rem',
                paddingTop: '1rem',
                borderTop: '1px solid #f3f4f6',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <span style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  background: '#f3f4f6',
                  color: '#374151',
                  borderRadius: 4,
                  fontSize: '0.85rem',
                  fontWeight: 500,
                }}>
                  用户投稿
                </span>
                <a
                  href={`/blog/${post.slug}`}
                  style={{
                    color: '#111827',
                    textDecoration: 'none',
                    fontWeight: 500,
                    fontSize: '0.9rem',
                  }}
                >
                  阅读全文 ->
                </a>
              </footer>
            </article>
          ))}
        </div>
      )}

      {/* Floating Submit Button */}
      {!loading && posts.length > 0 && (
        <button
          onClick={() => setView('form')}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: '#111827',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1.5rem',
            fontWeight: 700,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            transition: 'all 0.2s ease',
            zIndex: 1000,
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          title="我要投稿"
        >
          +
        </button>
      )}
    </div>
  );
}

function SubmitForm({ onSuccess }: { onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user, isAuthenticated } = useGitHubAuth();

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
    }
    return 'https://api.bullydoss.com';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    if (!title || !content) { setError('请填写标题和内容'); return; }

    setSubmitting(true); setError('');
    try {
      const token = localStorage.getItem('github_auth_token');
      const res = await fetch(`${getApiBase()}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setTitle(''); setContent('');
      alert('投稿成功，等待审核！');
      onSuccess();
    } catch (err: any) {
      setError(`提交失败: ${err.message}`);
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{
      background: 'white',
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
        我要投稿
      </h2>

      <p style={{
        textAlign: 'center',
        color: '#6b7280',
        marginBottom: '2rem',
        fontSize: '0.9rem',
      }}>
        欢迎分享你的想法！投稿内容将在审核后发布到「投稿专区」。
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
        }}>
          {error}
        </div>
      )}

      {!isAuthenticated ? (
        <div style={{
          textAlign: 'center',
          padding: '3rem 2rem',
          background: '#f9fafb',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
        }}>
          <p style={{ margin: '0 0 1.25rem', fontSize: '1rem', color: '#374151', fontWeight: 500 }}>
            需要登录才能投稿
          </p>
          <p style={{ margin: '0 0 1.5rem', color: '#6b7280', fontSize: '0.92rem' }}>
            使用 GitHub 账号登录后即可提交文章投稿
          </p>
          <GitHubLogin />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {user && (
            <div style={{
              marginBottom: '1.25rem',
              padding: '12px 16px',
              background: '#f9fafb',
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}>
              <img src={user.avatarUrl} alt={user.username} style={{ width: 36, height: 36, borderRadius: '50%' }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#111827' }}>
                  {user.name || user.username}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                  @{user.username}
                </div>
              </div>
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontWeight: 500,
              fontSize: '0.875rem',
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              文章标题 *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入一个吸引人的标题"
              required
              disabled={submitting}
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
              正文内容 * (支持 Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="在这里撰写你的文章...&#10;&#10;支持 Markdown 语法：&#10;- **粗体文字**&#10;- *斜体文字*&#10;- # 标题&#10;- 列表项"
              required
              rows={12}
              disabled={submitting}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: 6,
                fontSize: '0.95rem',
                lineHeight: 1.6,
                boxSizing: 'border-box',
                fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                resize: 'vertical',
                outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              width: '100%',
              padding: '12px',
              background: submitting ? '#9ca3af' : '#111827',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              fontSize: '1rem',
              fontWeight: 500,
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? '提交中...' : '提交投稿'}
          </button>

          <p style={{
            marginTop: '1.25rem',
            padding: '1rem',
            background: '#f9fafb',
            borderRadius: 6,
            fontSize: '0.875rem',
            color: '#4b5563',
            lineHeight: 1.6,
            textAlign: 'center',
          }}>
            投稿须知：提交的内容将在审核通过后发布，请确保内容原创且符合社区规范。
          </p>
        </form>
      )}
    </div>
  );
}
