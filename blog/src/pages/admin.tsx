import React, { useState, useEffect } from 'react';
import Layout from '@theme/Layout';
import styles from './Admin.module.css';

export default function AdminPage(): React.ReactElement {
  const [token, setToken] = useState(() => localStorage.getItem('admin_token') || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!token);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoggedIn && token) {
      fetchPosts();
    }
  }, [isLoggedIn, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch(`${window.customFields.apiBaseUrl}/api/admin/login`, {
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
      const response = await fetch(`${window.customFields.apiBaseUrl}/api/admin/posts`, {
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
        `${window.customFields.apiBaseUrl}/api/admin/posts/${postId}`,
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
      <Layout title="管理员登录" description="博客管理后台">
        <div className={styles.container}>
          <form onSubmit={handleLogin} className={styles.loginForm}>
            <h2>🔐 管理员登录</h2>
            <input name="username" type="text" placeholder="用户名" required />
            <input name="password" type="password" placeholder="密码" required />
            <button type="submit">登录</button>
          </form>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="管理后台" description="文章管理">
      <div className={styles.container}>
        <header className={styles.header}>
          <h2>📝 文章管理</h2>
          <button onClick={handleLogout} className={styles.logoutBtn}>退出登录</button>
        </header>

        {loading ? (
          <p>加载中...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>标题</th>
                <th>分类</th>
                <th>状态</th>
                <th>日期</th>
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
                    <span className={`${styles.status} ${styles[post.status]}`}>
                      {post.status}
                    </span>
                  </td>
                  <td>{new Date(post.created_at).toLocaleDateString()}</td>
                  <td>
                    <button onClick={() => deletePost(post.id)} className={styles.deleteBtn}>
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  );
}
