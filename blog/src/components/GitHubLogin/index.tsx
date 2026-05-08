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
  compact?: boolean;
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
    if (!clientId || clientId === 'YOUR_GITHUB_CLIENT_ID') {
      alert('登录功能暂未开放');
      return null;
    }

    const redirectUri = `${window.location.origin}/github-callback`;
    const scope = 'read:user user:email';

    const authUrl = new URL('https://github.com/login/oauth/authorize');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('scope', scope);

    const width = 600;
    const height = 700;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    return new Promise((resolve) => {
      const popup = window.open(
        authUrl.toString(),
        'github_login',
        `width=${width},height=${height},left=${left},top=${top},resizable,scrollbars,status`
      );

      if (!popup) {
        alert('弹出窗口被拦截，请允许弹出窗口后重试');
        resolve(null);
        return;
      }

      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          resolve(null);
        }
      }, 1000);

      const messageHandler = async (event: MessageEvent) => {
        if (event.data.type !== 'github-auth') return;

        clearInterval(checkClosed);
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
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        if (!popup.closed) popup.close();
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

export default function GitHubLogin({ onLoginSuccess, onLogout, trigger, compact }: GitHubLoginProps) {
  const { user, loading, login, logout, isAuthenticated } = useGitHubAuth();

  const handleLogin = async () => {
    const loggedInUser = await login();
    if (loggedInUser) {
      onLoginSuccess?.(loggedInUser);
    }
  };

  const handleLogout = () => {
    logout();
    onLogout?.();
  };

  if (loading) {
    return <div className={styles.loading} />;
  }

  if (isAuthenticated && user) {
    return (
      <div className={styles.loggedInContainer}>
        <img
          src={user.avatarUrl || `https://github.com/${user.username}.png`}
          alt={user.username}
          className={styles.avatar}
        />
        <span className={styles.userName}>{user.name || user.username}</span>
        {!compact && (
          <button onClick={handleLogout} className={styles.logoutBtn}>
            退出
          </button>
        )}
      </div>
    );
  }

  const LoginButton = trigger || (
    <button onClick={handleLogin} className={styles.loginBtn}>
      <svg height="16" viewBox="0 0 16 16" width="16" fill="currentColor">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
      </svg>
      使用 GitHub 登录
    </button>
  );

  return <div onClick={handleLogin}>{LoginButton}</div>;
}
