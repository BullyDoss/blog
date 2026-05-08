import React, { useEffect } from 'react';

export default function GitHubCallback() {
  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const error = urlParams.get('error');

      if (error) {
        window.opener?.postMessage({ type: 'github-auth', error }, '*');
        window.close();
        return;
      }

      if (!code) {
        window.opener?.postMessage({ type: 'github-auth', error: '未收到授权码' }, '*');
        window.close();
        return;
      }

      try {
        let apiBase;
        if (window.__CONFIG__) {
          apiBase = window.__CONFIG__.apiBaseUrl || 'https://api.bullydoss.com';
        } else {
          apiBase = 'https://api.bullydoss.com';
        }

        const response = await fetch(`${apiBase}/api/auth/github/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `HTTP ${response.status}`);
        }

        const data = await response.json();
        window.opener?.postMessage(
          { type: 'github-auth', token: data.token, user: data.user },
          '*'
        );
        window.close();
      } catch (err: any) {
        window.opener?.postMessage({ type: 'github-auth', error: err.message }, '*');
        window.close();
      }
    };

    handleCallback();
  }, []);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }}>
      <div style={{ fontSize: '2rem' }}>⏳</div>
      <p style={{ color: '#6b7280', margin: 0 }}>正在完成 GitHub 登录...</p>
      <p style={{ color: '#9ca3af', fontSize: '0.88rem', margin: 0 }}>
        如果窗口没有自动关闭，请手动关闭
      </p>
    </div>
  );
}
