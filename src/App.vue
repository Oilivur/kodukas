<script setup lang="ts">
import { computed } from 'vue'
import {
  RouterLink,
  RouterView,
  useRoute,
} from 'vue-router'

const route = useRoute()

const fullScreenView =
    computed(
        () =>
            route.name ===
            'weather',
    )
</script>

<template>
  <div class="app">
    <header
        v-if="!fullScreenView"
        class="site-header"
    >
      <RouterLink
          to="/"
          class="site-brand"
      >
        <span
            class="site-brand-mark"
        ></span>

        Oilivur
      </RouterLink>

      <nav class="site-nav">
        <RouterLink to="/">
          Kodu
        </RouterLink>

        <RouterLink to="/weather">
          Ilm
        </RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>