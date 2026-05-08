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
    { method: 'GET', pattern: /^\/api\/categories$/, handler: 'getCategories' },
    { method: 'POST', pattern: /^\/api\/submit$/, handler: 'submitPost' },
    { method: 'POST', pattern: /^\/api\/images\/upload$/, handler: 'uploadImage' },
    { method: 'GET', pattern: /^\/api\/images\/([^/]+)$/, handler: 'serveImage', params: ['key'] },
    { method: 'GET', pattern: /^\/api\/debug\/r2$/, handler: 'debugR2' },
    { method: 'POST', pattern: /^\/api\/debug\/upload-test$/, handler: 'debugUploadTest' },
    { method: 'POST', pattern: /^\/api\/admin\/login$/, handler: 'adminLogin' },
    { method: 'GET', pattern: /^\/api\/admin\/posts$/, handler: 'getAdminPosts' },
    { method: 'GET', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'getAdminPostById', params: ['id'] },
    { method: 'POST', pattern: /^\/api\/admin\/posts$/, handler: 'createAdminPost' },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'updateAdminPost', params: ['id'] },
    { method: 'DELETE', pattern: /^\/api\/admin\/posts\/(\d+)$/, handler: 'deleteAdminPost', params: ['id'] },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)\/approve$/, handler: 'approvePost', params: ['id'] },
    { method: 'PUT', pattern: /^\/api\/admin\/posts\/(\d+)\/reject$/, handler: 'rejectPost', params: ['id'] },
    { method: 'GET', pattern: /^\/api\/posts\/([^/]+)\/comments$/, handler: 'getComments', params: ['slug'] },
    { method: 'POST', pattern: /^\/api\/posts\/(\d+)\/comments$/, handler: 'addComment', params: ['postId'] },
    { method: 'POST', pattern: /^\/api\/auth\/github\/callback$/, handler: 'githubAuthCallback' },
    { method: 'GET', pattern: /^\/api\/auth\/github\/user$/, handler: 'getGitHubUser' },
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

      case 'serveImage':
        return serveImage(route.params.key, env, corsHeaders);

      case 'debugR2':
        return debugR2(env, corsHeaders);

      case 'debugUploadTest':
        return debugUploadTest(request, env, corsHeaders);

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

      case 'getComments':
        return getComments(route.params.slug, env, corsHeaders);

      case 'addComment':
        return addComment(route.params.postId, request, env, corsHeaders);

      case 'githubAuthCallback':
        return githubAuthCallback(request, env, corsHeaders);

      case 'getGitHubUser':
        return getGitHubUser(request, env, corsHeaders);

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
  try {
    const user = await verifyGitHubToken(request, env);

    const body = await request.json();
    const { title, content } = body;

    if (!title || !content) {
      return jsonResponse({ error: '请填写标题和内容' }, 400, headers);
    }

    const slug = generateSlug(title);
    const excerpt = content.length > 150 ? content.slice(0, 150) + '...' : content;

    const result = await env.DB.prepare(
      `INSERT INTO posts (slug, title, content, excerpt, category, status, author, email)
     VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)`
    ).bind(slug, title, content, excerpt, 'submit', user.username, user.email || null).run();

    return jsonResponse(
      { id: result.meta.last_row_id, message: '投稿成功，等待审核' },
      201,
      headers
    );
  } catch (e) {
    if (e.message && e.message.includes('认证失败')) {
      return jsonResponse({ error: '请先登录后再投稿' }, 401, headers);
    }
    throw e;
  }
}

async function uploadImage(request, env, headers) {
  try {
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

    const arrayBuffer = await file.arrayBuffer();
    await env.IMAGES.put(key, arrayBuffer, {
      httpMetadata: { contentType: file.type },
    });

    const verifyObj = await env.IMAGES.get(key);
    const url = `https://api.bullydoss.com/api/images/${key}`;
    return jsonResponse({ url, message: '上传成功', verified: !!verifyObj, size: verifyObj?.size || 0 }, 201, headers);
  } catch (e) {
    return jsonResponse({ error: '上传失败: ' + e.message }, 500, headers);
  }
}

async function serveImage(key, env, corsHeaders) {
  try {
    const object = await env.IMAGES.get(key);
    if (!object) {
      const listResult = await (async () => { try { const list = await env.IMAGES.list({ prefix: key.substring(0, 10), limit: 5 }); return list.objects.map(o => o.key); } catch(e) { return 'list_error:' + e.message; } })();
      return jsonResponse({ error: '图片不存在', requestedKey: key, nearbyKeys: listResult }, 404, corsHeaders);
    }
    const imgHeaders = new Headers({
      'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
      'Cache-Control': 'public, max-age=31536000',
      'Access-Control-Allow-Origin': '*',
    });
    return new Response(object.body, { headers: imgHeaders });
  } catch (e) {
    return jsonResponse({ error: '获取图片失败', detail: e.message, stack: e.stack?.substring(0, 200) }, 500, corsHeaders);
  }
}

async function debugR2(env, corsHeaders) {
  try {
    const hasBinding = !!env.IMAGES;
    if (!hasBinding) {
      return jsonResponse({ error: 'R2 binding (IMAGES) not found!' }, 500, corsHeaders);
    }
    const testKey = 'test-r2-check.png';
    const object = await env.IMAGES.get(testKey);
    return jsonResponse({
      r2_bound: true,
      test_key: testKey,
      test_object_exists: !!object,
      test_object_size: object?.size || null,
      test_object_type: object?.httpMetadata?.contentType || null,
    }, 200, corsHeaders);
  } catch (e) {
    return jsonResponse({ error: e.message }, 500, corsHeaders);
  }
}

async function debugUploadTest(request, env, corsHeaders) {
  try {
    const formData = await request.formData();
    const file = formData.get('image');
    if (!file) return jsonResponse({ error: 'no file' }, 400, corsHeaders);

    const key = `debug-${Date.now()}.png`;
    const arrayBuffer = await file.arrayBuffer();

    await env.IMAGES.put(key, arrayBuffer, { httpMetadata: { contentType: file.type } });

    const obj = await env.IMAGES.get(key);
    if (!obj) return jsonResponse({ error: 'put succeeded but get returned null!' }, 500, corsHeaders);

    const imageData = await obj.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(imageData.slice(0, 100))));

    return jsonResponse({
      upload_ok: true,
      key: key,
      size_after_upload: obj.size,
      preview_base64_prefix: base64.substring(0, 50),
      r2_binding_works: true,
    }, 200, corsHeaders);
  } catch (e) {
    return jsonResponse({ error: e.message, stack: e.stack }, 500, corsHeaders);
  }
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
  try { await env.DB.prepare('DELETE FROM comments WHERE post_id = ?').bind(id).run(); } catch (e) {}
  try { await env.DB.prepare('DELETE FROM submissions WHERE post_id = ?').bind(id).run(); } catch (e) {}
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

// ===================== 评论相关 =====================

async function getComments(slug, env, headers) {
  try {
    const post = await env.DB.prepare(
      'SELECT id FROM posts WHERE slug = ?'
    ).bind(slug).first();

    if (!post) {
      return jsonResponse({ comments: [] }, 200, headers);
    }

    const result = await env.DB.prepare(
      'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC'
    ).bind(post.id).all();

    return jsonResponse({ comments: result.results || [] }, 200, headers);
  } catch (e) {
    return jsonResponse({ comments: [] }, 200, headers);
  }
}

async function addComment(postId, request, env, headers) {
  try {
    const user = await verifyGitHubToken(request, env);

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return jsonResponse({ error: '请填写评论内容' }, 400, headers);
    }

    const result = await env.DB.prepare(
      `INSERT INTO comments (post_id, author, content) VALUES (?, ?, ?)`
    ).bind(postId, user.username, content.trim()).run();

    return jsonResponse(
      { id: result.meta.last_row_id, message: '评论成功', author: user.username },
      201,
      headers
    );
  } catch (e) {
    if (e.message && e.message.includes('no such table')) {
      return jsonResponse({ error: '评论功能暂未开放' }, 503, headers);
    }
    if (e.message && e.message.includes('认证失败')) {
      return jsonResponse({ error: '请先登录后再评论' }, 401, headers);
    }
    throw e;
  }
}

// ===================== GitHub OAuth 认证相关 =====================

async function githubAuthCallback(request, env, headers) {
  try {
    const { code } = await request.json();

    if (!code) {
      return jsonResponse({ error: '缺少授权码' }, 400, headers);
    }

    const clientId = env.GITHUB_CLIENT_ID;
    const clientSecret = env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return jsonResponse({ error: 'GitHub OAuth 未配置' }, 500, headers);
    }

    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return jsonResponse({ error: `GitHub 认证失败: ${tokenData.error_description || tokenData.error}` }, 401, headers);
    }

    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'User-Agent': 'blog-api',
      },
    });

    if (!userResponse.ok) {
      return jsonResponse({ error: '获取用户信息失败' }, 500, headers);
    }

    const githubUser = await userResponse.json();

    let dbUser = await env.DB.prepare(
      'SELECT * FROM github_users WHERE github_id = ?'
    ).bind(githubUser.id).first();

    if (!dbUser) {
      const result = await env.DB.prepare(
        `INSERT INTO github_users (github_id, username, avatar_url, email, name)
         VALUES (?, ?, ?, ?, ?)`
      ).bind(
        githubUser.id,
        githubUser.login,
        githubUser.avatar_url,
        githubUser.email || null,
        githubUser.name || null
      ).run();

      dbUser = {
        id: result.meta.last_row_id,
        github_id: githubUser.id,
        username: githubUser.login,
        avatar_url: githubUser.avatar_url,
        email: githubUser.email,
        name: githubUser.name,
      };
    } else {
      await env.DB.prepare(
        "UPDATE github_users SET last_login = datetime('now'), avatar_url = ?, username = ? WHERE id = ?"
      ).bind(githubUser.avatar_url, githubUser.login, dbUser.id).run();
    }

    const jwtToken = await generateJWT(
      { userId: dbUser.id, githubId: githubUser.id, username: githubUser.login, type: 'github' },
      env.JWT_SECRET || 'default-secret-change-me'
    );

    return jsonResponse({
      token: jwtToken,
      user: {
        id: dbUser.id,
        githubId: githubUser.id,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        name: githubUser.name,
        email: githubUser.email,
      }
    }, 200, headers);

  } catch (err) {
    console.error('GitHub Auth Error:', err);
    return jsonResponse({ error: 'GitHub 登录失败', detail: err.message }, 500, headers);
  }
}

async function getGitHubUser(request, env, headers) {
  try {
    const payload = await verifyGitHubToken(request, env);

    const user = await env.DB.prepare(
      'SELECT * FROM github_users WHERE id = ?'
    ).bind(payload.userId).first();

    if (!user) {
      return jsonResponse({ error: '用户不存在' }, 404, headers);
    }

    return jsonResponse({
      user: {
        id: user.id,
        githubId: user.github_id,
        username: user.username,
        avatarUrl: user.avatar_url,
        name: user.name,
        email: user.email,
      }
    }, 200, headers);

  } catch (err) {
    return jsonResponse({ error: err.message }, 401, headers);
  }
}

async function verifyGitHubToken(request, env) {
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

    if (payload.type !== 'github') {
      throw new Error('令牌类型无效');
    }

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
