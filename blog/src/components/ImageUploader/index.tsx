import React, { useRef, useState, useCallback } from 'react';
import styles from './ImageUploader.module.css';

interface ImageUploaderProps {
  onUploadSuccess?: (url: string) => void;
  maxFileSize?: number;
}

function getApiBase() {
  if (typeof window !== 'undefined' && window.__CONFIG__) {
    return window.__CONFIG__.apiBaseUrl || 'https://blog-api.bullydoss-blog.workers.dev';
  }
  return 'https://blog-api.bullydoss-blog.workers.dev';
}

export default function ImageUploader({ onUploadSuccess, maxFileSize = 5 }: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
      alert('仅支持 JPG/PNG/GIF/WebP 格式');
      return;
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      alert(`图片大小不能超过 ${maxSize}MB`);
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`${getApiBase()}/api/images/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok && data.url) {
        setPreview(data.url);
        onUploadSuccess?.(data.url);
        alert(`✅ 图片已上传！\n\nMarkdown: ![图片](${data.url})`);
      } else {
        alert(`❌ 上传失败：${data.message || data.error}`);
      }
    } catch (err) {
      alert('❌ 网络错误，请检查网络连接');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [maxFileSize, onUploadSuccess]);

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className={styles.input}
        id="image-upload"
      />

      <label htmlFor="image-upload" className={styles.label}>
        {uploading ? (
          <span className={styles.uploading}>⏳ 上传中...</span>
        ) : (
          <>
            📷 点击上传图片
            <span className={styles.hint}>（JPG/PNG/GIF/WebP，最大 {maxFileSize}MB）</span>
          </>
        )}
      </label>

      {preview && (
        <div className={styles.preview}>
          <img src={preview} alt="预览" />
          <p className={styles.previewUrl}>{preview}</p>
        </div>
      )}
    </div>
  );
}
