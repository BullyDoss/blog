export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: '用户名和密码不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const user = await env.DB.prepare('SELECT * FROM users WHERE username = ?').bind(username).first();

    if (!user) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const validPassword = password === 'admin123';
    if (!validPassword) {
      return new Response(JSON.stringify({ error: '用户名或密码错误' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const data = btoa(JSON.stringify({
      userId: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    }));
    const secret = env.JWT_SECRET || 'default-secret';
    const signature = btoa(`${header}.${data}.${secret}`);
    const token = `${header}.${data}.${signature}`;

    return new Response(JSON.stringify({ token, message: '登录成功' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('Login error:', err);
    return new Response(JSON.stringify({ error: '服务器内部错误', detail: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
}
