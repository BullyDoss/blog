// v2.6 - fix deploy workflow + frontend improvements
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return handleAPI(request, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    console.log('Cron job triggered:', event.cron);
  },
};

const VALID_CATEGORIES = ['notes', 'brainstorm', 'chat', 'daily', 'submit'];
const CATEGORY_LABELS = {
  notes: '学习笔记',
  brainstorm: '思维风暴',
  chat: '夸夸其谈',
  daily: '打怪经验',
  submit: '投稿'
};

function matchRoute(method, pathname) {
  const routes = [
    { method: 'GET', pattern: /^\/api\/posts$/, handler: 'getPosts' },
    { method: 'GET', pattern: /^\/api\/posts\/([^/]+)$/, handler: 'getPostBySlug', params: ['slug'] },
    { method: 'GET', pattern: /^api\/categories$/, handler: 'getCategories' },
    { method: 'POST', pattern: /^\/api\/submit$/, handler: 'submitPost' },
    { method: 'POST', pattern: /^\/api\/images\/upload$/, handler: 'uploadImage' },
    { method: 'POST', pattern: /^\/api\/admin\/login$/, handler: 'adminLogin' },
    { method: 'GET', pattern: /^\/api\/admin\/posts$/, handler: 'getAdminPosts' },
    { method: 'GET', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'getAdminPostById', params: ['id'] },
    { method: 'POST', pattern: /^\/api\/admin\/posts$/, handler: 'createAdminPost' },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'updateAdminPost', params: ['id'] },
    { method: 'DELETE', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'deleteAdminPost', params: ['id'] },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)\/approve$/, handler: 'approvePost', params: ['id'] },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)\/reject$/, handler: 'rejectPost', params: ['id'] },
  ];

  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (match) {
      const params = {};
      if (route.params) {
        route.params.forEach((name, i) => {
          params[name] = match[i + 1];
        });
      }
      return { handler: route.handler, params };
    }
  }

  return null;
}

async function handleAPI(request, env) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const route = matchRoute(request.method, url.pathname);

    if (!route) {
      return jsonResponse({ error: 'Not Found', path: url.pathname }, 404, corsHeaders);
    }

    switch (route.handler) {
      case 'getPosts':
        return getPosts(url, env, corsHeaders);

      case 'getPostBySlug':
        return getPostBySlug(route.params.slug, env, corsHeaders);

      case 'getCategories':
        return getCategories(corsHeaders);

      case 'submitPost':
        return submitPost(request, env, corsHeaders);

      case 'uploadImage':
        return uploadImage(request, env, corsHeaders);

      case 'adminLogin':
        return adminLogin(request, env, corsHeaders);

      case 'getAdminPosts':
        return verifyToken(request, env).then(() => getAdminPosts(url, env, corsHeaders));

      case 'getAdminPostById':
        return verifyToken(request, env).then(() => getAdminPostById(route.params.id, env, corsHeaders));

      case 'createAdminPost':
        return verifyToken(request, env).then(() => createAdminPost(request, env, corsHeaders));

      case 'updateAdminPost':
        return verifyToken(request, env).then(() => updateAdminPost(route.params.id, request, env, corsHeaders));

      case 'deleteAdminPost':
        return verifyToken(request, env).then(() => deleteAdminPost(route.params.id, env, corsHeaders));

      case 'approvePost':
        return verifyToken(request, env).then(() => approvePost(route.params.id, env, corsHeaders));

      case 'rejectPost':
        return verifyToken(request, env).then(() => rejectPost(route.params.id, request, env, corsHeaders));

      default:
        return jsonResponse({ error: 'Not Found' }, 404, corsHeaders);
    }
  } catch (err) {
    console.error('API Error:', err);
    return jsonResponse({ error: 'Internal Server Error', detail: err.message }, 500, corsHeaders);
  }
}

async function getPosts(url, env, headers) {
  const category = url.searchParams.get('category');

  let sql = `SELECT id, slug, title, excerpt, category, status, author, created_at 
             FROM posts WHERE status = 'published'`;
  const params = [];

  if (category && VALID_CATEGORIES.includes(category)) {
    sql += ' AND category = ?';
    params.push(category);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse(result.results, 200, headers);
}

async function getPostBySlug(slug, env, headers) {
  const result = await env.DB.prepare(
    'SELECT * FROM posts WHERE slug = ? AND status = ?'
  ).bind(slug, 'published').first();

  if (!result) {
    return jsonResponse({ error: '文章不存在' }, 404, headers);
  }

  const images = await env.DB.prepare(
    'SELECT * FROM images WHERE post_id = ? ORDER BY sort_order ASC'
  ).bind(result.id).all();

  return jsonResponse({ ...result, images: images.results }, 200, headers);
}

async function getCategories(headers) {
  return jsonResponse({
    categories: VALID_CATEGORIES.map(cat => ({
      id: cat,
      label: CATEGORY_LABELS[cat] || cat
    }))
  }, 200, headers);
}

async function submitPost(request, env, headers) {
  const body = await request.json();
  const { title, author, content, email } = body;

  if (!title || !author || !content) {
    return jsonResponse({ error: '请填写必要信息' }, 400, headers);
  }

  const slug = generateSlug(title);
  const excerpt = content.length > 150 ? content.slice(0, 150) + '...' : content;

  const result = await env.DB.prepare(
    `INSERT INTO posts (slug, title, content, excerpt, category, status, author, email)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
  ).bind(slug, title, content, excerpt, 'submit', author, email).run();

  return jsonResponse(
    { id: result.meta.last_row_id, message: '投稿成功，等待审核' },
    201,
    headers
  );
}

async function uploadImage(request, env, headers) {
  const formData = await request.formData();
  const file = formData.get('image');

  if (!file || !(file instanceof File)) {
    return jsonResponse({ error: '请选择图片' }, 400, headers);
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return jsonResponse({ error: '仅支持 JPG/PNG/GIF/WebP 格式' }, 400, headers);
  }

  if (file.size > 5 * 1024 * 1024) {
    return jsonResponse({ error: '图片大小不能超过 5MB' }, 400, headers);
  }

  const ext = file.name.split('.').pop() || 'jpg';
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  await env.IMAGES.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  const url = `${env.R2_PUBLIC_URL}/${key}`;
  return jsonResponse({ url, message: '上传成功' }, 201, headers);
}

// ===================== 认证相关 =====================

async function adminLogin(request, env, headers) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return jsonResponse({ error: '用户名和密码不能为空' }, 400, headers);
  }

  const adminUser = env.ADMIN_USERNAME || 'admin';
  const adminPass = env.ADMIN_PASSWORD || 'admin123456';

  if (username !== adminUser || password !== adminPass) {
    return jsonResponse({ error: '用户名或密码错误' }, 401, headers);
  }

  const token = await generateJWT(
    { userId: 1, username: adminUser },
    env.JWT_SECRET || 'default-secret-change-me'
  );

  return jsonResponse({ token, message: '登录成功' }, 200, headers);
}

async function verifyToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];

  if (!token) {
    throw new Error('未提供认证令牌');
  }

  try {
    const secret = env.JWT_SECRET || 'default-secret-change-me';
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('令牌格式无效');
    }

    const payload = JSON.parse(atob(parts[1]));

    const expectedSignature = await generateSignature(parts[0], parts[1], secret);
    if (parts[2] !== expectedSignature) {
      throw new Error('令牌签名无效');
    }

    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('令牌已过期');
    }

    return payload;
  } catch (err) {
    throw new Error(`认证失败: ${err.message}`);
  }
}

async function generateJWT(payload, secret) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const data = btoa(JSON.stringify({
    ...payload,
    exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
    iat: Math.floor(Date.now() / 1000),
  }));
  const signature = await generateSignature(header, data, secret);
  return `${header}.${data}.${signature}`;
}

async function generateSignature(header, data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(`${header}.${data}`)
  );
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

// ===================== 后台管理 - 增强版 =====================

async function getAdminPosts(url, env, headers) {
  const category = url.searchParams.get('category');
  const status = url.searchParams.get('status');

  let sql = 'SELECT * FROM posts WHERE 1=1';
  const params = [];

  if (category && VALID_CATEGORIES.includes(category)) {
    sql += ' AND category = ?';
    params.push(category);
  }

  if (status && ['published', 'pending'].includes(status)) {
    sql += ' AND status = ?';
    params.push(status);
  }

  sql += ' ORDER BY created_at DESC';

  const result = await env.DB.prepare(sql).bind(...params).all();
  return jsonResponse(result.results, 200, headers);
}

async function getAdminPostById(id, env, headers) {
  const result = await env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(id).first();

  if (!result) {
    return jsonResponse({ error: '文章不存在' }, 404, headers);
  }

  return jsonResponse(result, 200, headers);
}

async function createAdminPost(request, env, headers) {
  const body = await request.json();
  const { title, content, category = 'notes', excerpt, tags, created_at } = body;

  if (!title || !content) {
    return jsonResponse({ error: '标题和内容不能为空' }, 400, headers);
  }

  if (!VALID_CATEGORIES.includes(category)) {
    return jsonResponse({ error: '无效的分类' }, 400, headers);
  }

  const slug = body.slug || generateSlug(title);
  const autoExcerpt = excerpt || (content.length > 150 ? content.slice(0, 150) + '...' : content);

  const createdAt = created_at ? new Date(created_at).toISOString() : new Date().toISOString();

  const result = await env.DB.prepare(
    `INSERT INTO posts (slug, title, content, excerpt, category, status, author, created_at)
     VALUES (?, ?, ?, ?, ?, 'published', 'admin', ?)`
  ).bind(slug, title, content, autoExcerpt, category, createdAt).run();

  return jsonResponse(
    { id: result.meta.last_row_id, message: '创建成功' },
    201,
    headers
  );
}

async function updateAdminPost(id, request, env, headers) {
  const body = await request.json();
  const { title, content, excerpt, slug, category, status, created_at } = body;

  const existingPost = await env.DB.prepare(
    'SELECT * FROM posts WHERE id = ?'
  ).bind(id).first();

  if (!existingPost) {
    return jsonResponse({ error: '文章不存在' }, 404, headers);
  }

  const finalCreatedAt = created_at ? new Date(created_at).toISOString() : (existingPost.created_at || new Date().toISOString());

  await env.DB.prepare(
    `UPDATE posts SET 
      title = COALESCE(?, title), 
      content = COALESCE(?, content), 
      excerpt = COALESCE(?, excerpt), 
      slug = COALESCE(?, slug), 
      category = COALESCE(?, category),
      status = COALESCE(?, status),
      created_at = ?,
      updated_at = datetime('now')
     WHERE id = ?`
  ).bind(
    title || null,
    content || null,
    excerpt || null,
    slug || null,
    category || null,
    status || null,
    finalCreatedAt,
    id
  ).run();

  return jsonResponse({ message: '更新成功' }, 200, headers);
}

async function deleteAdminPost(id, env, headers) {
  await env.DB.prepare('DELETE FROM images WHERE post_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM submissions WHERE post_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM posts WHERE id = ?').bind(id).run();

  return jsonResponse({ message: '删除成功' }, 200, headers);
}

async function approvePost(id, env, headers) {
  await env.DB.prepare(
    "UPDATE posts SET status = 'published', updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();

  return jsonResponse({ message: '已批准发布' }, 200, headers);
}

async function rejectPost(id, request, env, headers) {
  const body = await request.json();
  const { reason } = body || {};

  await env.DB.prepare(
    "UPDATE posts SET status = 'rejected', updated_at = datetime('now') WHERE id = ?"
  ).bind(id).run();

  return jsonResponse({ message: '已拒绝', reason }, 200, headers);
}

// ===================== 工具函数 =====================

function jsonResponse(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}
