import React, { useState } from 'react';
import Navbar from '@theme-original/Navbar';

export default function NavbarWrapper(props) {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div style={{ position: 'relative' }}>
      <Navbar {...props} />
      <div style={{
        position: 'absolute',
        right: '1.5rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 20,
      }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('blogSearch', { detail: e.target.value }));
            }
          }}
          placeholder="搜索文章..."
          style={{
            width: '200px',
            padding: '6px 14px',
            border: '1px solid #d1d5db',
            borderRadius: 20,
            fontSize: '0.85rem',
            outline: 'none',
            background: '#f9fafb',
            boxSizing: 'border-box',
            transition: 'width 0.3s ease, background 0.2s',
          }}
          onFocus={(e) => { e.target.style.width = '280px'; e.target.style.background = '#fff'; }}
          onBlur={(e) => { e.target.style.width = '200px'; e.target.style.background = '#f9fafb'; }}
        />
      </div>
    </div>
  );
}
