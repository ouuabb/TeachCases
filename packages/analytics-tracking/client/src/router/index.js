import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Product from '../views/Product.vue'
import Dashboard from '../views/Dashboard.vue'
import TrackerDemo from '../views/TrackerDemo.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/product/:id?', name: 'Product', component: Product },
  { path: '/dashboard', name: 'Dashboard', component: Dashboard },
  { path: '/tracker-demo', name: 'TrackerDemo', component: TrackerDemo },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ============================================================
//  路由变化时自动上报 PV
// ============================================================
// 这是最常见的自动埋点方式：监听路由变化，每次跳转自动上报

router.afterEach((to) => {
  if (window.$tracker) {
    window.$tracker.trackPageView(to.path, {
      routeName: to.name,
      routeParams: to.params,
      routeQuery: to.query
    })
  }
})

export default router
