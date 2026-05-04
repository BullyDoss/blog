import { jsonResponse, corsHeaders, verifyPassword, generateJWT } from '../../_lib.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return jsonResponse({ error: '用户名和密码不能为空' }, 400, corsHeaders);
    }

    const user = await env.DB.prepare(
      'SELECT * FROM users WHERE username = ?'
    ).bind(username).first();

    if (!user) {
      return jsonResponse({ error: '用户名或密码错误' }, 401, corsHeaders);
    }

    const validPassword = await verifyPassword(password, user.password_hash);
    if (!validPassword) {
      return jsonResponse({ error: '用户名或密码错误' }, 401, corsHeaders);
    }

    const token = await generateJWT(
      { userId: user.id, username: user.username },
      env.JWT_SECRET
    );

    return jsonResponse({ token, message: '登录成功' }, 200, corsHeaders);
  } catch (err) {
    console.error('Login error:', err);
    return jsonResponse({ error: '服务器内部错误' }, 500, corsHeaders);
  }
}
