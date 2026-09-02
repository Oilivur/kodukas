import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import WeatherView from '@/views/WeatherView.vue'
import TagEditorView from '@/views/TagEditorView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/weather',
      name: 'weather',
      component: WeatherView,
    },
    {
      path: '/tag-editor',
      name: 'tag-editor',
      component: TagEditorView,
    },
  ],
})

export default router