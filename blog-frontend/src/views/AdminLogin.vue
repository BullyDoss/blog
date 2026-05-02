<template>
  <div class="login-container">
    <div class="login-card">
      <h1>后台管理登录</h1>
      <form @submit.prevent="handleLogin" class="login-form">
        <div class="form-group">
          <label for="username">用户名</label>
          <input
            type="text"
            id="username"
            v-model="loginForm.username"
            placeholder="请输入用户名"
            required
            :disabled="loading"
          />
        </div>
        <div class="form-group">
          <label for="password">密码</label>
          <input
            type="password"
            id="password"
            v-model="loginForm.password"
            placeholder="请输入密码"
            required
            :disabled="loading"
          />
        </div>
        <button type="submit" class="login-btn" :disabled="loading">
          {{ loading ? '登录中...' : '登 录' }}
        </button>
        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>
      </form>
      <router-link to="/" class="back-link">返回首页</router-link>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'AdminLogin',
  data() {
    return {
      loginForm: { username: '', password: '' },
      loading: false,
      errorMsg: ''
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.errorMsg = ''
      try {
        const res = await axios.post('http://localhost:3000/api/admin/login', {
          username: this.loginForm.username,
          password: this.loginForm.password
        })
        localStorage.setItem('adminToken', res.data.token)
        localStorage.setItem('adminUser', this.loginForm.username)
        this.$router.push('/admin')
      } catch (err) {
        console.error('登录失败:', err)
        this.errorMsg = err.response?.status === 401
          ? '用户名或密码错误'
          : err.response?.data?.message || '登录失败，请稍后重试'
      } finally { this.loading = false }
    }
  },
  beforeRouteEnter(to, from, next) {
    const token = localStorage.getItem('adminToken')
    if (token) next('/admin')
    else next()
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
}
.login-card {
  background: #fff;
  padding: 44px 40px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  width: 100%;
  max-width: 380px;
}
.login-card h1 {
  text-align: center;
  color: #111;
  margin-bottom: 32px;
  font-size: 22px;
  font-weight: 600;
}
.form-group { margin-bottom: 18px; }
.form-group label {
  display: block;
  margin-bottom: 6px;
  color: #555;
  font-size: 13px;
  font-weight: 500;
}
.form-group input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
  box-sizing: border-box;
  transition: border-color .2s;
  font-family: inherit;
  color: #333;
}
.form-group input:focus {
  outline: none;
  border-color: #888;
  box-shadow: 0 0 0 2px rgba(0,0,0,.04);
}
.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}
.login-btn {
  width: 100%;
  padding: 13px;
  background: #111;
  color: #fff;
  border: none;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background .15s;
  margin-top: 6px;
  font-family: inherit;
}
.login-btn:hover:not(:disabled) { background: #333; }
.login-btn:disabled { opacity: .4; cursor: not-allowed; }
.error-msg {
  color: #555;
  text-align: center;
  margin-top: 14px;
  font-size: 13px;
  padding: 10px;
  background: #f8f8f8;
  border: 1px solid #eee;
  border-radius: 5px;
}
.back-link {
  display: block;
  text-align: center;
  margin-top: 22px;
  color: #888;
  text-decoration: none;
  font-size: 13px;
}
.back-link:hover { color: #333; }
</style>
