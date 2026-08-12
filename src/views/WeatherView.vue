<script setup lang="ts">
import {
  onBeforeUnmount,
  ref,
} from 'vue'

import {
  RouterLink,
} from 'vue-router'

import WeatherForecastDock from '@/components/weather/WeatherForecastDock.vue'
import WeatherHoverCard from '@/components/weather/WeatherHoverCard.vue'
import WeatherMap from '@/components/weather/WeatherMap.vue'

import {
  fetchCurrentWeather,
  fetchWeatherForecast,
} from '@/services/weatherApi'

import type {
  CurrentWeather,
  MapWeatherPoint,
  WeatherForecast,
} from '@/types/weather'

const hoverPoint =
  ref<MapWeatherPoint | null>(
    null,
  )

const hoverWeather =
  ref<CurrentWeather | null>(
    null,
  )

const hoverLoading =
  ref(false)

const hoverError =
  ref<string | null>(
    null,
  )

const selectedPoint =
  ref<MapWeatherPoint | null>(
    null,
  )

const selectedForecast =
  ref<WeatherForecast | null>(
    null,
  )

const selectedDate =
  ref('')

const selectedLoading =
  ref(false)

const selectedError =
  ref<string | null>(
    null,
  )

const hoverCache =
  new Map<
    string,
    CurrentWeather
  >()

let hoverTimer:
  number | null =
  null

let hoverAbort:
  AbortController | null =
  null

let hoverSequence =
  0

let forecastAbort:
  AbortController | null =
  null

let forecastSequence =
  0

function hoverCacheKey(
  point: MapWeatherPoint,
): string {
  return [
    point.latitude.toFixed(
      2,
    ),

    point.longitude.toFixed(
      2,
    ),
  ].join(',')
}

function clearHoverTimer() {
  if (
    hoverTimer !== null
  ) {
    window.clearTimeout(
      hoverTimer,
    )

    hoverTimer =
      null
  }
}

function handleMapHover(
  point: MapWeatherPoint,
) {
  hoverPoint.value =
    point

  hoverError.value =
    null

  clearHoverTimer()

  const key =
    hoverCacheKey(point)

  const cached =
    hoverCache.get(key)

  if (cached) {
    hoverAbort?.abort()

    hoverWeather.value =
      cached

    hoverLoading.value =
      false

    return
  }

  hoverSequence++

  const sequence =
    hoverSequence

  hoverWeather.value =
    null

  hoverLoading.value =
    true

  hoverAbort?.abort()

  hoverTimer =
    window.setTimeout(
      async () => {
        hoverAbort =
          new AbortController()

        try {
          const weather =
            await fetchCurrentWeather(
              point,
              hoverAbort.signal,
            )

          if (
            sequence !==
            hoverSequence
          ) {
            return
          }

          hoverCache.set(
            key,
            weather,
          )

          hoverWeather.value =
            weather

          hoverLoading.value =
            false
        } catch (error) {
          if (
            error instanceof
            DOMException &&
            error.name ===
            'AbortError'
          ) {
            return
          }

          if (
            sequence !==
            hoverSequence
          ) {
            return
          }

          console.error(
            error,
          )

          hoverLoading.value =
            false

          hoverError.value =
            'Päring ebaõnnestus'
        }
      },
      320,
    )
}

function handleMapLeave() {
  hoverSequence++

  clearHoverTimer()

  hoverAbort?.abort()

  hoverPoint.value =
    null

  hoverWeather.value =
    null

  hoverLoading.value =
    false

  hoverError.value =
    null
}

async function handleMapSelect(
  point: MapWeatherPoint,
) {
  /*
   * Move the selected-point marker immediately,
   * but KEEP the existing forecast visible while
   * the new location is loading.
   */
  selectedPoint.value =
    point

  selectedLoading.value =
    true

  selectedError.value =
    null

  forecastSequence++

  const sequence =
    forecastSequence

  forecastAbort?.abort()

  forecastAbort =
    new AbortController()

  try {
    const forecast =
      await fetchWeatherForecast(
        point,
        forecastAbort.signal,
      )

    /*
     * Ignore an old response if the user clicked
     * somewhere else while it was loading.
     */
    if (
      sequence !==
      forecastSequence
    ) {
      return
    }

    /*
     * If the same calendar date exists in the new
     * forecast, keep it selected.
     *
     * This means switching location while viewing
     * Friday keeps Friday open instead of jumping
     * back to today.
     */
    const previousDate =
      selectedDate.value

    const matchingDate =
      forecast.days.some(
        (day) =>
          day.date ===
          previousDate,
      )

    selectedForecast.value =
      forecast

    selectedDate.value =
      matchingDate
        ? previousDate
        : (
          forecast.days[0]
            ?.date ?? ''
        )

    hoverCache.set(
      hoverCacheKey(
        point,
      ),
      forecast.current,
    )
  } catch (error) {
    if (
      error instanceof
      DOMException &&
      error.name ===
      'AbortError'
    ) {
      return
    }

    if (
      sequence !==
      forecastSequence
    ) {
      return
    }

    console.error(
      error,
    )

    /*
     * Existing forecast remains visible.
     * We merely report that the requested update failed.
     */
    selectedError.value =
      'Uue asukoha ilmaandmeid ei saanud laadida.'
  } finally {
    if (
      sequence ===
      forecastSequence
    ) {
      selectedLoading.value =
        false
    }
  }
}

onBeforeUnmount(() => {
  clearHoverTimer()

  hoverAbort?.abort()

  forecastAbort?.abort()
})
</script>

<template>
  <main
    class="weather-page"
  >
    <WeatherMap
      :selected-point="
        selectedPoint
      "
      @hover="
        handleMapHover
      "
      @leave="
        handleMapLeave
      "
      @select="
        handleMapSelect
      "
    />

    <RouterLink
      class="weather-home"
      to="/"
      aria-label="Tagasi avalehele"
    >
      ←
    </RouterLink>

    <WeatherHoverCard
      :point="
        hoverPoint
      "
      :weather="
        hoverWeather
      "
      :loading="
        hoverLoading
      "
      :error="
        hoverError
      "
    />

    <WeatherForecastDock
      :forecast="
        selectedForecast
      "
      :selected-date="
        selectedDate
      "
      :loading="
        selectedLoading
      "
      :error="
        selectedError
      "
      @select-date="
        selectedDate = $event
      "
    />
  </main>
</template>

<style scoped>
.weather-page {
  position:
    relative;

  width: 100%;

  height:
    100dvh;

  overflow:
    hidden;

  background:
    var(--bg);
}

.weather-home {
  position:
    absolute;

  top:
    clamp(
      0.65rem,
      1.8dvh,
      1.25rem
    );

  left:
    clamp(
      0.65rem,
      1.2vw,
      1.25rem
    );

  z-index:
    1000;

  display:
    grid;

  place-items:
    center;

  width:
    clamp(
      2.6rem,
      3vw,
      3.1rem
    );

  aspect-ratio: 1;

  color:
    var(--text);

  background:
    rgba(
      11,
      15,
      18,
      0.88
    );

  border:
    0.0625rem
    solid
    var(--border);

  border-radius:
    var(--radius);

  backdrop-filter:
    blur(0.9rem);

  font-size:
    clamp(
      1.1rem,
      1.4vw,
      1.4rem
    );

  transition:
    color
    120ms ease,
    border-color
    120ms ease,
    background
    120ms ease;
}

.weather-home:hover {
  color:
    var(--accent);

  background:
    var(--surface);

  border-color:
    var(--accent-border);
}
</style>