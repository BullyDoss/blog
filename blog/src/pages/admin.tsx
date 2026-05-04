import React from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';
import styles from './admin.module.css';

export default function AdminPage(): React.ReactElement {
  return (
    <Layout title="管理后台" description="博客管理后台">
      <BrowserOnly fallback={<div className={styles.loading}>加载管理后台...</div>}>
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
    if (token) {
      setView('dashboard');
    }
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;

    try {
      const apiBase = (window as any).__CONFIG__?.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        onSuccess(data.token);
      } else {
        setError(data.error || '登录失败');
      }
    } catch (err) {
      setError('网络错误，请检查连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <h2 className={styles.title}>🔐 管理员登录</h2>
        <p className={styles.subtitle}>登录后可管理文章和审核投稿</p>
        
        {error && <div className={styles.error}>{error}</div>}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="username">用户名</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="请输入用户名"
              required
              disabled={loading}
            />
          </div>
          
          <div className={styles.field}>
            <label htmlFor="password">密码</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="请输入密码"
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </div>
  );
}

function AdminPanel({ token, onLogout }: { token: string; onLogout: () => void }) {
  const [activeTab, setActiveTab] = React.useState<'posts' | 'submissions'>('posts');

  return (
    <div className={styles.adminContainer}>
      <header className={styles.header}>
        <h1>📊 管理后台</h1>
        <button onClick={onLogout} className={styles.logoutBtn}>退出登录</button>
      </header>

      <nav className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'posts' ? styles.active : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 文章管理
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'submissions' ? styles.active : ''}`}
          onClick={() => setActiveTab('submissions')}
        >
          📥 投稿审核
        </button>
      </nav>

      <main className={styles.content}>
        {activeTab === 'posts' ? <PostsManager token={token} /> : <SubmissionsManager token={token} />}
      </main>
    </div>
  );
}

function PostsManager({ token }: { token: string }) {
  const [posts, setPosts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const apiBase = (window as any).__CONFIG__?.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
      const response = await fetch(`${apiBase}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 401 || response.status === 403) {
        window.location.reload();
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
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复！')) return;

    try {
      const apiBase = (window as any).__CONFIG__?.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
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

  if (loading) return <div className={styles.loading}>加载中...</div>;

  return (
    <div>
      <div className={styles.tableHeader}>
        <span>共 {posts.length} 篇文章</span>
        <button onClick={fetchPosts} className={styles.refreshBtn}>🔄 刷新</button>
      </div>
      
      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>分类</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id}>
              <td>{post.id}</td>
              <td>{post.title}</td>
              <td><span className={styles.badge}>{post.category}</span></td>
              <td>
                <span className={`${styles.badge} ${post.status === 'published' ? styles.success : styles.warning}`}>
                  {post.status === 'published' ? '已发布' : '待审核'}
                </span>
              </td>
              <td>{new Date(post.created_at).toLocaleDateString('zh-CN')}</td>
              <td>
                <button
                  onClick={() => deletePost(post.id)}
                  className={styles.deleteBtn}
                >
                  🗑️ 删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {posts.length === 0 && <p className={styles.empty}>暂无文章</p>}
    </div>
  );
}

function SubmissionsManager({ token }: { token: string }) {
  const [submissions, setSubmissions] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const apiBase = (window as any).__CONFIG__?.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
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
      const apiBase = (window as any).__CONFIG__?.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
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

  if (loading) return <div className={styles.loading}>加载中...</div>;

  return (
    <div>
      <div className={styles.tableHeader}>
        <span>共 {submissions.length} 条待审核投稿</span>
        <button onClick={fetchSubmissions} className={styles.refreshBtn}>🔄 刷新</button>
      </div>

      <div className={styles.submissionList}>
        {submissions.map(sub => (
          <div key={sub.id} className={styles.submissionCard}>
            <h3>{sub.title}</h3>
            <p className={styles.meta}>
              作者：{sub.author || '匿名'} | 
              提交时间：{new Date(sub.created_at).toLocaleDateString('zh-CN')}
            </p>
            <p className={styles.excerpt}>{sub.excerpt}</p>
            <div className={styles.actions}>
              <button onClick={() => approvePost(sub.id)} className={styles.approveBtn}>
                ✅ 批准发布
              </button>
              <button onClick={() => alert('删除功能开发中')} className={styles.deleteBtn}>
                ❌ 拒绝
              </button>
            </div>
          </div>
        ))}
      </div>

      {submissions.length === 0 && <p className={styles.empty}>🎉 暂无待审核投稿</p>}
    </div>
  );
}
