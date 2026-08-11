<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PanelBox from '@/components/PanelBox.vue'
</script>

<template>
  <main class="page">
    <header class="page-heading">

      <h1>Kraam</h1>

    </header>

    <div class="panel-grid">
      <PanelBox title="Discgolf">
        <div class="link-list">
          <a
              class="site-link"
              href="https://discgolf.ee/"
              target="_blank"
              rel="noopener noreferrer"
          >
            discgolf.ee
          </a>

          <a
              class="site-link"
              href="https://thuledg.ee/"
              target="_blank"
              rel="noopener noreferrer"
          >
            thuledg.ee
          </a>

          <a
              class="site-link"
              href="https://discgolfar.ee/"
              target="_blank"
              rel="noopener noreferrer"
          >
            discgolfar.ee
          </a>
        </div>
      </PanelBox>

      <PanelBox title="Lingid">
        <div class="link-list">
          <a
              class="site-link"
              href="https://www.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
          >
            YouTube
          </a>

          <a
              class="site-link"
              href="https://www.lhv.ee"
              target="_blank"
              rel="noopener noreferrer"
          >
            LHV
          </a>

          <a
              class="site-link"
              href="https://ww-fmovies.com"
              target="_blank"
              rel="noopener noreferrer"
          >
            Filmid
          </a>

          <a
              class="site-link"
              href="https://en.fmoviesz-to.com"
              target="_blank"
              rel="noopener noreferrer"
          >
            Filmid II
          </a>

          <a
              class="site-link"
              href="https://oilivur.github.io/soiduplaanid/"
              target="_blank"
              rel="noopener noreferrer"
          >
            Sõiduplaanid
          </a>
        </div>
      </PanelBox>

    </div>
  </main>
</template>