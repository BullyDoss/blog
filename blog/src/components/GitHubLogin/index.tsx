import React, { useState, useEffect, useCallback } from 'react';
import styles from './GitHubLogin.module.css';

interface User {
  id: number;
  githubId: number;
  username: string;
  avatarUrl?: string;
  name?: string;
  email?: string;
}

interface GitHubLoginProps {
  onLoginSuccess?: (user: User) => void;
  onLogout?: () => void;
  trigger?: React.ReactNode;
}

const STORAGE_KEY = 'github_auth_token';

function getApiBase() {
  if (typeof window !== 'undefined' && window.__CONFIG__) {
    return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
  }
  return 'https://api.bullydoss.com';
}

export function useGitHubAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem(STORAGE_KEY);
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${getApiBase()}/api/auth/github/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (): Promise<User | null> => {
    const clientId = window.__GITHUB_CLIENT_ID__;
    if (!clientId) {
      alert('GitHub 登录未配置');
      return null;
    }

    const redirectUri = `${window.location.origin}`;
    const scope = 'read:user user:email';
    const state = Math.random().toString(36).substring(7);

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);
    authUrl.searchParams.set('state', state);

    return new Promise((resolve) => {
      const popup = window.open(
        authUrl.toString(),
        'github_login',
        'width=600,height=700,left=100,top=100'
      );

      const messageHandler = async (event: MessageEvent) => {
        if (event.data.type !== 'github-auth') return;

        window.removeEventListener('message', messageHandler);
        popup?.close();

        if (event.data.error) {
          alert(`登录失败: ${event.data.error}`);
          resolve(null);
          return;
        }

        const { token, user } = event.data;
        localStorage.setItem(STORAGE_KEY, token);
        setUser(user);
        resolve(user);
      };

      window.addEventListener('message', messageHandler);

      setTimeout(() => {
        window.removeEventListener('message', messageHandler);
        popup?.close();
        resolve(null);
      }, 120000);
    });
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return { user, loading, login, logout, isAuthenticated: !!user, checkAuth };
}

export default function GitHubLogin({ onLoginSuccess, onLogout, trigger }: GitHubLoginProps) {
  const [showModal, setShowModal] = useState(false);
  const { user, loading, login, logout, isAuthenticated } = useGitHubAuth();

  const handleLogin = async () => {
    const loggedInUser = await login();
    if (loggedInUser) {
      onLoginSuccess?.(loggedInUser);
      setShowModal(false);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
    setShowModal(false);
  };

  if (loading) {
    return <div className={styles.loading}>...</div>;
  }

  const TriggerComponent = trigger || (
    <button className={styles.loginButton}>
      {isAuthenticated ? (
        <span className={styles.userInfo}>
          <img
            src={user?.avatarUrl || `https://github.com/${user?.username}.png`}
            alt={user?.username}
            className={styles.avatar}
          />
          {user?.name || user?.username}
        </span>
      ) : (
        <>🔑 用 GitHub 登录</>
      )}
    </button>
  );

  return (
    <>
      <div onClick={() => setShowModal(true)}>
        {TriggerComponent}
      </div>

      {showModal && (
        <div className={styles.overlay} onClick={() => setShowModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}>
              <h2>GitHub 账号登录</h2>
              <button onClick={() => setShowModal(false)} className={styles.closeBtn}>×</button>
            </div>

            <div className={styles.content}>
              {isAuthenticated ? (
                <div className={styles.loggedIn}>
                  <img
                    src={user?.avatarUrl}
                    alt={user?.username}
                    className={styles.largeAvatar}
                  />
                  <h3>{user?.name || user?.username}</h3>
                  <p>@{user?.username}</p>
                  {user?.email && <p className={styles.email}>{user.email}</p>}

                  <div className={styles.actions}>
                    <button onClick={handleLogout} className={styles.logoutBtn}>
                      退出登录
                    </button>
                  </div>

                  <p className={styles.hint}>
                    登录后可以发表评论和投稿文章
                  </p>
                </div>
              ) : (
                <div className={styles.loginPrompt}>
                  <div className={styles.githubIcon}>
                    <svg height="64" viewBox="0 0 16 16" width="64">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor"/>
                    </svg>
                  </div>
                  <h3>使用 GitHub 账号登录</h3>
                  <p>登录后即可发表评论和投稿文章</p>

                  <button onClick={handleLogin} className={styles.githubLoginBtn}>
                    <svg height="20" viewBox="0 0 16 16" width="20">
                      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" fill="currentColor"/>
                    </svg>
                    用 GitHub 登录
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
