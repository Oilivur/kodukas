<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <header class="site-header">
      <RouterLink to="/" class="site-brand">
        <span class="site-brand-mark"></span>
      </RouterLink>

      <nav class="site-nav">
        <RouterLink to="/">Kodu</RouterLink>
        <RouterLink to="/weather">Ilm</RouterLink>
      </nav>
    </header>

    <RouterView />
  </div>
</template>