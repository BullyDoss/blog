import React, { useState } from 'react';
import Browser from '@docusaurus/BrowserOnly';
import Layout from '@theme/Layout';

export default function AdminPage(): React.ReactElement {
  return (
    <Layout title="管理员登录" description="博客管理后台">
      <Browser>
        {() => <AdminContent />}
      </Browser>
    </Layout>
  );
}

function AdminContent() {
  const [token, setToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token') || '';
    }
    return '';
  });
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${window.customFields?.apiBaseUrl || ''}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password'),
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setToken(data.token);
        localStorage.setItem('admin_token', data.token);
        setIsLoggedIn(true);
      } else {
        alert(data.error || '登录失败');
      }
    } catch (err) {
      alert('网络错误');
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${window.customFields?.apiBaseUrl || ''}/api/admin/posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      } else if (response.status === 401 || response.status === 403) {
        handleLogout();
      }
    } catch (err) {
      console.error('获取文章失败:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoggedIn && token) {
    fetchPosts();
  }

  const handleLogout = () => {
    setToken('');
    localStorage.removeItem('admin_token');
    setIsLoggedIn(false);
    setPosts([]);
  };

  const deletePost = async (postId) => {
    if (!confirm('确定要删除这篇文章吗？')) return;

    try {
      const response = await fetch(
        `${window.customFields?.apiBaseUrl || ''}/api/admin/posts/${postId}`,
        { 
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

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

  if (!isLoggedIn) {
    return (
      <div style={{ maxWidth: 400, margin: '4rem auto', padding: '2.5rem', background: 'var(--ifm-background-surface-color)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '2rem' }}>🔐 管理员登录</h2>
        <form onSubmit={handleLogin}>
          <input name="username" type="text" placeholder="用户名" required style={{ width: '100%', padding: '12px 16px', marginBottom: '1rem', border: '2px solid var(--ifm-color-emphasis-300)', borderRadius: 8 }} />
          <input name="password" type="password" placeholder="密码" required style={{ width: '100%', padding: '12px 16px', marginBottom: '1rem', border: '2px solid var(--ifm-color-emphasis-300)', borderRadius: 8 }} />
          <button type="submit" style={{ width: '100%', padding: '14px', background: 'var(--ifm-color-primary)', color: 'white', border: 'none', borderRadius: 8, fontSize: '1rem', fontWeight: 600 }}>登录</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: '0 1rem' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid var(--ifm-color-emphasis-200)' }}>
        <h2>📝 文章管理</h2>
        <button onClick={handleLogout} style={{ padding: '10px 20px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>退出登录</button>
      </header>

      {loading ? (
        <p>加载中...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--ifm-background-surface-color)', borderRadius: 12, overflow: 'hidden' }}>
          <thead style={{ background: 'var(--ifm-color-emphasis-100)' }}>
            <tr>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>ID</th>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>标题</th>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>分类</th>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>状态</th>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>日期</th>
              <th style={{ padding: '14px 18px', textAlign: 'left' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.map(post => (
              <tr key={post.id} style={{ borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                <td style={{ padding: '14px 18px' }}>{post.id}</td>
                <td style={{ padding: '14px 18px' }}>{post.title}</td>
                <td style={{ padding: '14px 18px' }}>{post.category}</td>
                <td style={{ padding: '14px 18px' }}>{post.status}</td>
                <td style={{ padding: '14px 18px' }}>{new Date(post.created_at).toLocaleDateString()}</td>
                <td style={{ padding: '14px 18px' }}>
                  <button onClick={() => deletePost(post.id)} style={{ padding: '8px 16px', background: '#ef4444', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
