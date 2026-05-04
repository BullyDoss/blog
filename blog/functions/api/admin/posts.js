import { jsonResponse, corsHeaders, verifyToken } from '../../_lib.js';

export async function onRequestGet(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyToken(request);

    const result = await env.DB.prepare(
      'SELECT * FROM posts ORDER BY created_at DESC'
    ).all();

    return jsonResponse(result.results, 200, corsHeaders);
  } catch (err) {
    if (err.message.includes('令牌') || err.message.includes('认证')) {
      return jsonResponse({ error: err.message }, 401, corsHeaders);
    }
    console.error('Get posts error:', err);
    return jsonResponse({ error: '服务器内部错误' }, 500, corsHeaders);
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyToken(request);

    const body = await request.json();
    const { slug, title, content, excerpt, category = 'notes' } = body;

    if (!slug || !title || !content) {
      return jsonResponse({ error: '标题、slug 和内容不能为空' }, 400, corsHeaders);
    }

    const result = await env.DB.prepare(
      `INSERT INTO posts (slug, title, content, excerpt, category, status)
       VALUES (?, ?, ?, ?, ?, 'published')`
    ).bind(slug, title, content, excerpt, category).run();

    return jsonResponse({ id: result.meta.last_row_id, message: '创建成功' }, 201, corsHeaders);
  } catch (err) {
    if (err.message.includes('令牌') || err.message.includes('认证')) {
      return jsonResponse({ error: err.message }, 401, corsHeaders);
    }
    console.error('Create post error:', err);
    return jsonResponse({ error: '服务器内部错误' }, 500, corsHeaders);
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    await verifyToken(request);

    const id = params.id;
    const body = await request.json();
    const { title, content, excerpt, slug, category, status } = body;

    await env.DB.prepare(
      `UPDATE posts SET 
        title = COALESCE(?, title), 
        content = COALESCE(?, content), 
        excerpt = COALESCE(?, excerpt), 
        slug = COALESCE(?, slug), 
        category = COALESCE(?, category),
        status = COALESCE(?, status)
       WHERE id = ?`
    ).bind(title, content, excerpt, slug, category, status, id).run();

    return jsonResponse({ message: '更新成功' }, 200, corsHeaders);
  } catch (err) {
    if (err.message.includes('令牌') || err.message.includes('认证')) {
      return jsonResponse({ error: err.message }, 401, corsHeaders);
    }
    console.error('Update post error:', err);
    return jsonResponse({ error: '服务器内部错误' }, 500, corsHeaders);
  }
}

export async function onRequestDelete(context) {
  const { env, params } = context;

  try {
    await verifyToken(context.request);

    const id = params.id;

    await env.DB.prepare('DELETE FROM images WHERE post_id = ?').bind(id).run();
    await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

    return jsonResponse({ message: '删除成功' }, 200, corsHeaders);
  } catch (err) {
    if (err.message.includes('令牌') || err.message.includes('认证')) {
      return jsonResponse({ error: err.message }, 401, corsHeaders);
    }
    console.error('Delete post error:', err);
    return jsonResponse({ error: '服务器内部错误' }, 500, corsHeaders);
  }
}
