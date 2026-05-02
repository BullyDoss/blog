const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const NODE_ENV = process.env.NODE_ENV || 'development';

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer 配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    if (allowed.test(path.extname(file.originalname).toLowerCase())) {
      cb(null, true);
    } else {
      cb(new Error('仅支持图片格式 (jpg/png/gif/webp)'));
    }
  },
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadDir));

// MySQL 连接池配置（支持环境变量）
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '000000',
  database: process.env.MYSQL_DATABASE || 'myblog',
  waitForConnections: true,
  connectionLimit: 10,
});

// ===================== 初始化数据库表 =====================
async function initDatabase() {
  const conn = await pool.getConnection();
  try {
    // 检查并添加 category 字段到 posts 表
    const [cols] = await conn.query("SHOW COLUMNS FROM posts LIKE 'category'");
    if (cols.length === 0) {
      await conn.query(
        "ALTER TABLE posts ADD COLUMN category ENUM('notes', 'brainstorm', 'chat', 'daily', 'submit') NOT NULL DEFAULT 'notes'"
      );
      console.log('已添加 category 字段');
    } else {
      // 确保 daily 在 ENUM 中
      await conn.query(
        "ALTER TABLE posts MODIFY COLUMN category ENUM('notes', 'brainstorm', 'chat', 'daily', 'submit') NOT NULL DEFAULT 'notes'"
      );
    }

    // 创建 images 表
    await conn.query(`
      CREATE TABLE IF NOT EXISTS images (
        id INT AUTO_INCREMENT PRIMARY KEY,
        post_id INT NOT NULL,
        url VARCHAR(500) NOT NULL,
        sort_order INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
      )
    `);

    console.log('数据库初始化完成');
  } catch (err) {
    console.error('数据库初始化错误:', err.message);
  } finally {
    conn.release();
  }
}

initDatabase();

// ===================== 文章接口 =====================

// 获取文章列表（支持 category 筛选）
app.get('/api/posts', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT id, slug, title, excerpt, content, category, created_at FROM posts';
    const params = [];

    if (category && ['notes', 'brainstorm', 'chat', 'daily', 'submit'].includes(category)) {
      sql += ' WHERE category = ?';
      params.push(category);
    }

    sql += ' ORDER BY created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '获取文章列表失败', error: err.message });
  }
});

// 根据 slug 获取单篇文章详情
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM posts WHERE slug = ?',
      [req.params.slug]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: '获取文章详情失败', error: err.message });
  }
});

// ===================== 图片接口 =====================

// 上传图片
app.post('/api/images/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: '请选择图片' });
  }

  const url = `/uploads/${req.file.filename}`;
  res.status(201).json({ url, message: '上传成功' });
});

// 获取某文章的所有图片
app.get('/api/posts/:id/images', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM images WHERE post_id = ? ORDER BY sort_order ASC, created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '获取图片失败', error: err.message });
  }
});

// 绑定图片到文章
app.post('/api/posts/:id/images', async (req, res) => {
  try {
    const { url, sort_order = 0 } = req.body;
    if (!url) {
      return res.status(400).json({ message: '缺少图片 URL' });
    }

    const [result] = await pool.query(
      'INSERT INTO images (post_id, url, sort_order) VALUES (?, ?, ?)',
      [req.params.id, url, sort_order]
    );
    res.status(201).json({ id: result.insertId, url, message: '绑定成功' });
  } catch (err) {
    res.status(500).json({ message: '绑定图片失败', error: err.message });
  }
});

// 删除图片
app.delete('/api/images/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM images WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      const img = rows[0];
      const filePath = path.join(__dirname, img.url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await pool.query('DELETE FROM images WHERE id = ?', [req.params.id]);
    res.json({ message: '删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除图片失败', error: err.message });
  }
});

// ===================== 投稿接口 =====================

app.post('/api/submit', async (req, res) => {
  try {
    const { title, author, content, slug, category = 'submit' } = req.body;
    if (!title || !author || !content || !slug) {
      return res.status(400).json({ message: '请填写完整信息' });
    }

    const excerpt = content.length > 150 ? content.slice(0, 150) + '...' : content;

    const [result] = await pool.query(
      "INSERT INTO posts (slug, title, content, excerpt, category) VALUES (?, ?, ?, ?, ?)",
      [slug, title, content, excerpt, category]
    );

    res.status(201).json({ id: result.insertId, message: '投稿成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '投稿失败，请稍后重试' });
    }
    res.status(500).json({ message: '投稿失败', error: err.message });
  }
});

// ===================== 评论接口 =====================

app.get('/api/posts/:id/comments', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '获取评论失败', error: err.message });
  }
});

app.post('/api/posts/:id/comments', async (req, res) => {
  try {
    const { author, content } = req.body;
    if (!author || !content) {
      return res.status(400).json({ message: '昵称和评论内容不能为空' });
    }
    const [result] = await pool.query(
      'INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)',
      [req.params.id, author, content]
    );
    res.status(201).json({ id: result.insertId, message: '评论成功' });
  } catch (err) {
    res.status(500).json({ message: '评论提交失败', error: err.message });
  }
});

// ===================== 管理员登录接口 =====================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: '用户名和密码不能为空' });
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const user = rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, message: '登录成功' });
  } catch (err) {
    console.error('登录失败:', err);
    res.status(500).json({ message: '服务器错误', error: err.message });
  }
});

// ===================== JWT 鉴权中间件 =====================

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: '未提供认证令牌' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
}

// ===================== 管理员文章管理接口 =====================

app.get('/api/admin/posts', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: '获取文章列表失败', error: err.message });
  }
});

app.post('/api/admin/posts', authenticateToken, async (req, res) => {
  try {
    const { slug, title, content, excerpt, category = 'notes' } = req.body;
    if (!slug || !title || !content) {
      return res.status(400).json({ message: '标题、slug和内容不能为空' });
    }

    const [result] = await pool.query(
      'INSERT INTO posts (slug, title, content, excerpt, category) VALUES (?, ?, ?, ?, ?)',
      [slug, title, content, excerpt || null, category]
    );
    res.status(201).json({ id: result.insertId, message: '文章创建成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '该 slug 已存在，请使用其他 URL 标识' });
    }
    res.status(500).json({ message: '创建文章失败', error: err.message });
  }
});

app.put('/api/admin/posts/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, excerpt, slug, category } = req.body;
    const id = req.params.id;

    const [result] = await pool.query(
      'UPDATE posts SET title = ?, content = ?, excerpt = ?, slug = ?, category = ? WHERE id = ?',
      [title, content, excerpt || null, slug, category || 'notes', id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    res.json({ message: '文章更新成功' });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '该 slug 已存在，请使用其他 URL 标识' });
    }
    res.status(500).json({ message: '更新文章失败', error: err.message });
  }
});

app.delete('/api/admin/posts/:id', authenticateToken, async (req, res) => {
  try {
    // 先删除关联图片
    const [images] = await pool.query('SELECT * FROM images WHERE post_id = ?', [req.params.id]);
    for (const img of images) {
      const filePath = path.join(__dirname, img.url.replace(/^\//, ''));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM images WHERE post_id = ?', [req.params.id]);

    const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '文章不存在' });
    }

    res.json({ message: '文章删除成功' });
  } catch (err) {
    res.status(500).json({ message: '删除文章失败', error: err.message });
  }
});

// ===================== 生产环境：提供前端静态文件 =====================
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'frontend', 'dist');
  app.use(express.static(frontendPath));

  // SPA 路由回退：所有非 API 请求都返回 index.html
  app.get('*', (req, res) => {
    // 排除 API 和 uploads 路径
    if (!req.path.startsWith('/api') && !req.path.startsWith('/uploads')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ message: 'Not Found' });
    }
  });
}

// ===================== 启动服务 =====================
app.listen(PORT, () => {
  console.log(`服务已运行: http://localhost:${PORT} (${NODE_ENV})`);
});
