<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">数据埋点教学</div>
      <div class="nav-links">
        <router-link to="/">首页</router-link>
        <router-link to="/product/1">商品页</router-link>
        <router-link to="/tracker-demo">埋点演示</router-link>
        <router-link to="/dashboard">数据看板</router-link>
      </div>
    </nav>

    <main class="content">
      <router-view />
    </main>

    <footer class="footer">
      <p>数据埋点教学项目 | 前端 Vue 3 + 后端 Express</p>
    </footer>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f5f7fa;
  color: #333;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.navbar {
  background: #1a1a2e;
  color: white;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.nav-brand {
  font-size: 18px;
  font-weight: bold;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-links a {
  color: rgba(255,255,255,0.8);
  text-decoration: none;
  font-size: 14px;
  padding: 6px 12px;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: white;
  background: rgba(255,255,255,0.15);
}

.content {
  flex: 1;
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
}

.footer {
  text-align: center;
  padding: 16px;
  color: #999;
  font-size: 13px;
  border-top: 1px solid #eee;
  background: white;
}
</style>
