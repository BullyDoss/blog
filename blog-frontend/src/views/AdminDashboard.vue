<template>
  <div class="admin-dashboard">
    <header class="admin-header">
      <h1>管理后台</h1>
      <nav class="admin-nav">
        <button @click="currentView = 'list'" :class="{ active: currentView === 'list' }">文章管理</button>
        <button @click="showCreateForm" :class="{ active: currentView === 'create' }">写新文章</button>
        <button @click="handleLogout" class="logout-btn">退出</button>
      </nav>
    </header>

    <main v-if="currentView === 'list'" class="admin-main admin-full">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="posts.length === 0" class="empty-state">暂无文章</div>
      <table v-else class="posts-table">
        <thead>
          <tr>
            <th>标题</th>
            <th>频道</th>
            <th>时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="post in posts" :key="post.id">
            <td class="post-title">{{ post.title }}</td>
            <td><span class="cat-badge">{{ categoryName(post.category) }}</span></td>
            <td>{{ new Date(post.created_at).toLocaleDateString() }}</td>
            <td class="actions">
              <button @click="editPost(post)" class="edit-btn">编辑</button>
              <button @click="confirmDelete(post)" class="delete-btn">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </main>

    <main v-else-if="currentView === 'create' || currentView === 'edit'" class="admin-main admin-full">
      <h2>{{ currentView === 'create' ? '写新文章' : '编辑文章' }}</h2>
      <form @submit.prevent="submitPost" class="post-form">
        <div class="form-row">
          <div class="form-group flex-2">
            <label>标题</label>
            <input type="text" v-model="formData.title" placeholder="请输入标题" required />
          </div>
          <div class="form-group flex-1">
            <label>URL 标识 (Slug)</label>
            <input type="text" v-model="formData.slug" placeholder="my-post" required />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group flex-1">
            <label>所属频道</label>
            <select v-model="formData.category">
              <option value="notes">学习笔记</option>
              <option value="brainstorm">思维风暴</option>
              <option value="chat">夸夸其谈</option>
              <option value="daily">投稿专区</option>
              <option value="submit">我要投稿</option>
            </select>
          </div>
          <div class="form-group flex-1"></div>
        </div>

        <div class="form-group">
          <label>摘要</label>
          <textarea v-model="formData.excerpt" placeholder="简短描述..." rows="2"></textarea>
        </div>

        <div class="form-group">
          <label>正文（Markdown）</label>
          <div class="editor-toolbar">
            <label class="toolbar-btn" title="上传图片并插入到正文">
              <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" @change="uploadAndInsert" hidden />
              <span>插入图片</span>
            </label>
            <span v-if="uploadStatus" class="upload-status">{{ uploadStatus }}</span>
          </div>
          <textarea v-model="formData.content" placeholder="在此输入正文，支持 Markdown。使用工具栏插入图片..." rows="16" required ref="contentArea"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" :disabled="submitting" class="save-btn">
            {{ submitting ? '保存中...' : (currentView === 'create' ? '发布' : '保存修改') }}
          </button>
          <button type="button" @click="cancelEdit" class="cancel-btn">取消</button>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
        <div v-if="successMsg" class="success-msg">{{ successMsg }}</div>
      </form>
    </main>

    <!-- 删除确认 -->
    <div v-if="showDeleteDialog" class="modal-overlay" @click.self="showDeleteDialog = false">
      <div class="modal-content">
        <h3>确认删除</h3>
        <p>确定要删除 "{{ postToDelete?.title }}" 吗？</p>
        <div class="modal-actions">
          <button @click="deletePost" :disabled="deleting" class="confirm-delete-btn">
            {{ deleting ? '删除中...' : '确认删除' }}
          </button>
          <button @click="showDeleteDialog = false" class="cancel-delete-btn">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminDashboard',
  data() {
    return {
      posts: [],
      loading: true,
      currentView: 'list',
      formData: { title: '', slug: '', excerpt: '', content: '', category: 'notes' },
      editingPostId: null,
      submitting: false, errorMsg: '', successMsg: '',
      showDeleteDialog: false, postToDelete: null, deleting: false,
      uploadStatus: '',
    }
  },
  computed: {
    token() { return localStorage.getItem('adminToken') }
  },
  methods: {
    getAuthHeaders() { return { Authorization: 'Bearer ' + this.token } },
    categoryName(c) {
      const m = { notes: '学习笔记', brainstorm: '思维风暴', chat: '夸夸其谈', daily: '投稿专区', submit: '我要投稿' }
      return m[c] || c
    },

    async fetchPosts() {
      this.loading = true
      try {
        const res = await axios.get('http://localhost:3000/api/admin/posts', { headers: this.getAuthHeaders() })
        this.posts = res.data
      } catch (e) { console.error(e) } finally { this.loading = false }
    },

    showCreateForm() { this.currentView = 'create'; this.resetForm() },

    editPost(post) {
      this.currentView = 'edit'
      this.editingPostId = post.id
      this.formData = {
        title: post.title, slug: post.slug, excerpt: post.excerpt || '',
        content: post.content, category: post.category || 'notes'
      }
    },

    resetForm() {
      this.formData = { title: '', slug: '', excerpt: '', content: '', category: 'notes' }
      this.editingPostId = null; this.errorMsg = ''; this.successMsg = ''
    },

    cancelEdit() { this.currentView = 'list'; this.resetForm() },

    async uploadAndInsert(e) {
      const file = e.target.files[0]
      if (!file) return
      this.uploadStatus = '上传中...'
      try {
        const fd = new FormData()
        fd.append('image', file)
        const res = await axios.post('http://localhost:3000/api/images/upload', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }, timeout: 15000
        })
        const imageUrl = 'http://localhost:3000' + res.data.url
        const md = '\n![](' + imageUrl + ')\n'
        this.formData.content += md
        this.uploadStatus = '已插入'
        setTimeout(() => { this.uploadStatus = '' }, 2000)
      } catch (err) {
        this.uploadStatus = '上传失败'
        setTimeout(() => { this.uploadStatus = '' }, 2000)
      } finally { e.target.value = '' }
    },

    async submitPost() {
      if (!this.formData.title || !this.formData.slug || !this.formData.content) {
        this.errorMsg = '请填写必填字段'; return
      }
      this.submitting = true; this.errorMsg = ''; this.successMsg = ''
      try {
        if (this.currentView === 'create') {
          await axios.post('http://localhost:3000/api/admin/posts', this.formData, { headers: this.getAuthHeaders() })
          this.successMsg = '发布成功'
        } else {
          await axios.put('http://localhost:3000/api/admin/posts/' + this.editingPostId, this.formData, { headers: this.getAuthHeaders() })
          this.successMsg = '更新成功'
        }
        setTimeout(() => { this.fetchPosts(); this.currentView = 'list'; this.resetForm() }, 800)
      } catch (err) {
        this.errorMsg = err.response?.data?.message || '保存失败'
      } finally { this.submitting = false }
    },

    confirmDelete(post) { this.postToDelete = post; this.showDeleteDialog = true },

    async deletePost() {
      if (!this.postToDelete) return
      this.deleting = true
      try {
        await axios.delete('http://localhost:3000/api/admin/posts/' + this.postToDelete.id), { headers: this.getAuthHeaders() })
        this.showDeleteDialog = false; this.postToDelete = null; this.fetchPosts()
      } catch (e) { alert('删除失败') } finally { this.deleting = false }
    },

    handleLogout() {
      localStorage.removeItem('adminToken'); localStorage.removeItem('adminUser')
      this.$router.push('/admin/login')
    }
  },
  mounted() { this.fetchPosts() }
}
</script>

<style scoped>
.admin-dashboard { min-height: 100vh; background: #f5f5f5; }
.admin-header {
  background: #111; color: #fff; padding: 16px 28px;
  display: flex; justify-content: space-between; align-items: center;
}
.admin-header h1 { margin: 0; font-size: 18px; font-weight: 600; }
.admin-nav { display: flex; gap: 8px; }
.admin-nav button {
  background: rgba(255,255,255,.12); border: none; color: #fff;
  padding: 7px 14px; border-radius: 4px; cursor: pointer; font-size: 13px; transition: background .15s;
  font-family: inherit;
}
.admin-nav button:hover, .admin-nav button.active { background: rgba(255,255,255,.22); }
.logout-btn { background: rgba(255,255,255,.06) !important; }
.logout-btn:hover { background: rgba(255,255,255,.18) !important; }

.admin-full { padding: 28px 36px; }

.admin-main h2 { color: #111; margin-bottom: 20px; font-weight: 700; font-size: 20px; }
.loading, .empty-state { text-align: center; padding: 60px; color: #999; font-size: 15px; }

.posts-table { width: 100%; background: #fff; border-radius: 6px; overflow: hidden; border: 1px solid #eee; }
.posts-table thead { background: #fafafa; border-bottom: 1px solid #eee; }
.posts-table th {
  padding: 10px 14px; text-align: left; font-size: 12px; color: #888;
  font-weight: 500; text-transform: uppercase; letter-spacing: .5px;
}
.posts-table td { padding: 10px 14px; font-size: 14px; border-bottom: 1px solid #f5f5f5; }
.posts-table tbody tr:last-child td { border-bottom: none; }
.posts-table tbody tr:hover { background: #fafafa; }
.post-title { font-weight: 500; }
.cat-badge {
  display: inline-block; padding: 2px 10px; border-radius: 3px; font-size: 12px;
  background: #eee; color: #555;
}

.actions { display: flex; gap: 6px; }
.edit-btn, .delete-btn {
  padding: 5px 12px; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; transition: all .1s;
  font-family: inherit;
}
.edit-btn { background: #111; color: #fff; }
.edit-btn:hover { background: #333; }
.delete-btn { background: #eee; color: #666; }
.delete-btn:hover { background: #ddd; color: #333; }

.post-form { background: #fff; padding: 28px; border-radius: 8px; border: 1px solid #eee; }
.form-row { display: flex; gap: 14px; }
.form-group.flex-2 { flex: 2; }
.form-group.flex-1 { flex: 1; margin-bottom: 16px; }
.form-group { margin-bottom: 16px; }
.form-group label {
  display: block; margin-bottom: 5px; color: #555; font-weight: 500; font-size: 13px;
}
.form-group select {
  width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 5px;
  font-size: 14px; box-sizing: border-box; font-family: inherit; transition: border-color .15s;
  background: #fff; color: #333; cursor: pointer; appearance: auto;
}
.form-group input, .form-group textarea {
  width: 100%; padding: 10px 14px; border: 1px solid #ddd; border-radius: 5px;
  font-size: 14px; box-sizing: border-box; font-family: inherit; transition: border-color .15s;
  background: #fff; color: #333; resize: vertical;
}
.form-group select:focus { outline: none; border-color: #888; }
.form-group input:focus, .form-group textarea:focus { outline: none; border-color: #888; }

.editor-toolbar {
  display: flex; align-items: center; gap: 12px; margin-bottom: 8px;
}
.toolbar-btn {
  display: inline-flex; align-items: center; padding: 5px 14px;
  border: 1px solid #ddd; border-radius: 4px; cursor: pointer;
  font-size: 12px; color: #555; background: #fafafa;
  transition: all .15s; user-select: none;
}
.toolbar-btn:hover { background: #eee; border-color: #bbb; }
.upload-status { font-size: 12px; color: #888; }

.form-actions { display: flex; gap: 10px; margin-top: 18px; }
.save-btn {
  flex: 1; padding: 11px; background: #111; color: #fff; border: none;
  border-radius: 5px; cursor: pointer; font-size: 14px; font-weight: 600; transition: background .15s;
  font-family: inherit;
}
.save-btn:hover:not(:disabled) { background: #333; }
.save-btn:disabled { opacity: .4; cursor: not-allowed; }
.cancel-btn {
  padding: 11px 24px; background: #e5e5e5; color: #555; border: none;
  border-radius: 5px; cursor: pointer; font-size: 14px; transition: background .15s;
  font-family: inherit;
}
.cancel-btn:hover { background: #ddd; }

.error-msg, .success-msg {
  margin-top: 12px; font-size: 13px; padding: 10px 14px; border-radius: 5px;
}
.error-msg { color: #555; background: #f8f8f8; border: 1px solid #eee; }
.success-msg { color: #555; background: #f8f8f8; border: 1px solid #ddd; }

.modal-overlay {
  position: fixed; top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,.4); display: flex; justify-content: center; align-items: center; z-index: 1000;
}
.modal-content { background: #fff; padding: 24px; border-radius: 8px; max-width: 400px; width: 90%; }
.modal-content h3 { margin-top: 0; color: #111; font-size: 16px; }
.modal-content p { color: #555; line-height: 1.5; margin: 10px 0; font-size: 14px; }
.modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 16px; }
.confirm-delete-btn {
  padding: 8px 20px; background: #111; color: #fff; border: none;
  border-radius: 4px; cursor: pointer; font-size: 13px; transition: background .15s;
  font-family: inherit;
}
.confirm-delete-btn:hover:not(:disabled) { background: #333; }
.confirm-delete-btn:disabled { opacity: .4; cursor: not-allowed; }
.cancel-delete-btn {
  padding: 8px 20px; background: #e5e5e5; color: #555; border: none;
  border-radius: 4px; cursor: pointer; font-size: 13px; transition: background .15s;
  font-family: inherit;
}
.cancel-delete-btn:hover { background: #ddd; }
</style>
