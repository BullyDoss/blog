const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function createAdmin() {
  const username = 'admin';
  const password = 'admin123';

  const hash = bcrypt.hashSync(password, 10);

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: '000000',
    database: 'myblog',
  });

  try {
    // 先检查是否已有 admin 用户
    const [existing] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      console.log('管理员账号已存在，无需重复创建。');
      console.log(`用户名: ${username}`);
      console.log(`密码: ${password}`);
      process.exit(0);
    }

    await pool.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, hash]
    );

    console.log('========================================');
    console.log('      管理员账号创建成功！');
    console.log('========================================');
    console.log(`      用户名: ${username}`);
    console.log(`      密码:   ${password}`);
    console.log('========================================');
  } catch (err) {
    console.error('创建管理员失败:', err.message);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

createAdmin();
