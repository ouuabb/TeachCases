import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Import from '../views/Import.vue'
import Export from '../views/Export.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/import', name: 'Import', component: Import },
  { path: '/export', name: 'Export', component: Export },
]

export default createRouter({
  history: createWebHistory(),
  routes
})
