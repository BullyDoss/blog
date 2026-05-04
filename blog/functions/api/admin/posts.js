const HEADERS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
const CORS_PREFLIGHT = {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  },
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: HEADERS });
}

async function verifyToken(request) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) throw new Error('未提供认证令牌');
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) throw new Error('令牌已过期');
    return payload;
  } catch (e) {
    throw new Error('无效的认证令牌');
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, CORS_PREFLIGHT);
  
  try {
    await verifyToken(request);
    const result = await env.DB.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
    return json(result.results);
  } catch (err) {
    const status = err.message.includes('令牌') || err.message.includes('认证') ? 401 : 500;
    return json({ error: err.message }, status);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  if (request.method === 'OPTIONS') return new Response(null, CORS_PREFLIGHT);

  try {
    await verifyToken(request);
    const { slug, title, content, excerpt, category = 'notes' } = await request.json();
    
    if (!slug || !title || !content) {
      return json({ error: '标题、slug 和内容不能为空' }, 400);
    }

    const result = await env.DB.prepare(
      `INSERT INTO posts (slug, title, content, excerpt, category, status) VALUES (?, ?, ?, ?, ?, 'published')`
    ).bind(slug, title, content, excerpt, category).run();

    return json({ id: result.meta.last_row_id, message: '创建成功' }, 201);
  } catch (err) {
    const status = err.message.includes('令牌') || err.message.includes('认证') ? 401 : 500;
    return json({ error: err.message }, status);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  if (request.method === 'OPTIONS') return new Response(null, CORS_PREFLIGHT);

  try {
    await verifyToken(request);
    const id = params.id;
    const body = await request.json();
    const { title, content, excerpt, slug, category, status } = body;

    await env.DB.prepare(
      `UPDATE posts SET title=COALESCE(?,title), content=COALESCE(?,content), excerpt=COALESCE(?,excerpt), slug=COALESCE(?,slug), category=COALESCE(?,category), status=COALESCE(?,status) WHERE id=?`
    ).bind(title, content, excerpt, slug, category, status, id).run();

    return json({ message: '更新成功' });
  } catch (err) {
    const status = err.message.includes('令牌') || err.message.includes('认证') ? 401 : 500;
    return json({ error: err.message }, status);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  
  try {
    await verifyToken(context.request);
    const id = params.id;
    await env.DB.prepare('DELETE FROM images WHERE post_id=?').bind(id).run();
    await env.DB.prepare('DELETE FROM posts WHERE id=?').bind(id).run();
    return json({ message: '删除成功' });
  } catch (err) {
    const status = err.message.includes('令牌') || err.message.includes('认证') ? 401 : 500;
    return json({ error: err.message }, status);
  }
}
