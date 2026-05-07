import React, { useState } from 'react';
import styles from './SubmitForm.module.css';

export default function SubmitForm() {
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    content: '',
    category: 'submit',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const getApiBase = () => {
    if (typeof window !== 'undefined' && window.__CONFIG__) {
      return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
    }
    return 'https://blog-api.bullydoss-blog.workers.dev';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${getApiBase()}/api/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: '✅ 投稿成功！审核通过后将发布。' });
        setFormData({ title: '', author: '', content: '', category: 'submit', email: '' });
      } else {
        setMessage({ type: 'error', text: `❌ ${data.message || '投稿失败'}` });
      }
    } catch (err) {
      setMessage({ type: 'error', text: '❌ 网络错误，请稍后重试' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <h2>📝 我要投稿</h2>
      <p className={styles.description}>
        欢迎分享你的想法！投稿内容将在审核后发布到「投稿专区」。
      </p>

      {message.text && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="title">文章标题 *</label>
          <input
            id="title"
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
            placeholder="输入文章标题"
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label htmlFor="author">你的昵称 *</label>
            <input
              id="author"
              type="text"
              value={formData.author}
              onChange={(e) => setFormData({ ...formData, author: e.target.value })}
              required
              placeholder="昵称或笔名"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="email">联系邮箱</label>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="可选，用于通知审核结果"
            />
          </div>
        </div>

        <div className={styles.field}>
          <label htmlFor="content">正文内容 * (支持 Markdown)</label>
          <textarea
            id="content"
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            required
            rows={12}
            placeholder="在这里撰写你的文章...&#10;&#10;支持 Markdown 语法：**粗体**、*斜体*、# 标题、- 列表等"
          />
        </div>

        <button type="submit" disabled={submitting} className={styles.submitBtn}>
          {submitting ? '提交中...' : '🚀 提交投稿'}
        </button>
      </form>
    </div>
  );
}
