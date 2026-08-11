<script setup lang="ts">
defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <section class="panel">
    <h2>{{ title }}</h2>

    <p v-if="description" class="panel-description">
      {{ description }}
    </p>

    <slot />
  </section>
</template>