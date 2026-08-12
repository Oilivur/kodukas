<script setup lang="ts">
import { computed } from 'vue'

import {
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudMoon,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Sun,
} from 'lucide-vue-next'

import {
  weatherCodeLabel,
  weatherIconKind,
} from '@/utils/weather'

const props =
    withDefaults(
        defineProps<{
          code: number
          isDay?: boolean
        }>(),
        {
          isDay: true,
        },
    )

const kind =
    computed(
        () =>
            weatherIconKind(
                props.code,
                props.isDay,
            ),
    )

const label =
    computed(
        () =>
            weatherCodeLabel(
                props.code,
            ),
    )
</script>

<template>
  <span
      class="weather-icon"
      :title="label"
  >
    <Sun
        v-if="kind === 'sun'"
        aria-hidden="true"
    />

    <Moon
        v-else-if="kind === 'moon'"
        aria-hidden="true"
    />

    <CloudSun
        v-else-if="
        kind === 'cloud-sun'
      "
        aria-hidden="true"
    />

    <CloudMoon
        v-else-if="
        kind === 'cloud-moon'
      "
        aria-hidden="true"
    />

    <Cloud
        v-else-if="
        kind === 'cloud'
      "
        aria-hidden="true"
    />

    <CloudFog
        v-else-if="
        kind === 'fog'
      "
        aria-hidden="true"
    />

    <CloudDrizzle
        v-else-if="
        kind === 'drizzle'
      "
        aria-hidden="true"
    />

    <CloudRain
        v-else-if="
        kind === 'rain'
      "
        aria-hidden="true"
    />

    <CloudSnow
        v-else-if="
        kind === 'snow'
      "
        aria-hidden="true"
    />

    <CloudLightning
        v-else
        aria-hidden="true"
    />
  </span>
</template>

<style scoped>
.weather-icon {
  display:
      inline-grid;

  place-items:
      center;

  width:
      1em;

  height:
      1em;

  color:
      currentColor;
}

.weather-icon :deep(svg) {
  width: 100%;
  height: 100%;

  stroke-width:
      1.65;
}
</style>