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
  reverseGeocodeLocation,
} from '@/services/locationApi'

import {
  fetchCurrentWeather,
  fetchWeatherForecast,
} from '@/services/weatherApi'

import type {
  LocationName,
} from '@/types/location'

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

const selectedLocation =
  ref<LocationName | null>(
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

/*
 * The forecast panel can be completely hidden without
 * throwing away the selected location or forecast data.
 */
const dockOpen =
  ref(true)

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
  dockOpen.value =
    true

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

  /*
   * Run BOTH requests at the same time.
   *
   * The location lookup is allowed to fail without
   * breaking the weather forecast.
   */
  const locationPromise =
    reverseGeocodeLocation(
      point,
      forecastAbort.signal,
    ).catch(
      (error) => {
        if (
          error instanceof DOMException &&
          error.name === 'AbortError'
        ) {
          throw error
        }

        console.warn(
          'Location lookup failed',
          error,
        )

        return null
      },
    )

  const forecastPromise =
    fetchWeatherForecast(
      point,
      forecastAbort.signal,
    )

  try {
    /*
     * Keep ALL existing dock contents visible until both
     * pieces of new information are ready.
     */
    const [
      forecast,
      location,
    ] =
      await Promise.all([
        forecastPromise,
        locationPromise,
      ])

    if (
      sequence !==
      forecastSequence
    ) {
      return
    }

    const previousDate =
      selectedDate.value

    const matchingDate =
      forecast.days.some(
        (day) =>
          day.date ===
          previousDate,
      )

    /*
     * Update everything together.
     *
     * There is no intermediate state where the new weather
     * is shown without its location name.
     */
    selectedForecast.value =
      forecast

    selectedLocation.value =
      location

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
      error instanceof DOMException &&
      error.name === 'AbortError'
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

function closeDock() {
  dockOpen.value =
    false
}

function openDock() {
  dockOpen.value =
    true
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

    <Transition
      name="dock"
    >
      <WeatherForecastDock
        v-if="dockOpen"
        :forecast="
          selectedForecast
        "
        :location="
          selectedLocation
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
        @close="
          closeDock
        "
      />
    </Transition>

    <Transition
      name="dock-reopen"
    >
      <button
        v-if="!dockOpen"
        type="button"
        class="weather-dock-reopen"
        @click="
          openDock
        "
      >
        <span
          class="weather-dock-reopen__dot"
        ></span>

        <span>
          {{
            selectedLocation?.primary ??
            'Näita prognoosi'
          }}
        </span>

        <span
          class="weather-dock-reopen__arrow"
        >
          ↑
        </span>
      </button>
    </Transition>
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

/* -------------------------
   Closed forecast button
------------------------- */

.weather-dock-reopen {
  position:
    absolute;

  left: 50%;

  bottom:
    clamp(
      0.65rem,
      1.4dvh,
      1.2rem
    );

  z-index:
    900;

  display:
    flex;

  align-items:
    center;

  gap:
    0.5rem;

  padding:
    0.6rem
    0.85rem;

  color:
    var(--text);

  background:
    rgba(
      11,
      15,
      18,
      0.9
    );

  border:
    0.0625rem
    solid
    var(--border);

  border-radius:
    999rem;

  backdrop-filter:
    blur(1rem);

  font:
    inherit;

  font-size:
    clamp(
      0.72rem,
      0.82vw,
      0.86rem
    );

  font-weight:
    700;

  cursor:
    pointer;

  transform:
    translateX(-50%);

  transition:
    color
    120ms ease,
    border-color
    120ms ease,
    background
    120ms ease;
}

.weather-dock-reopen:hover {
  color:
    var(--accent);

  background:
    var(--surface);

  border-color:
    var(--accent-border);
}

.weather-dock-reopen__dot {
  width:
    0.5rem;

  aspect-ratio: 1;

  background:
    var(--accent);

  border-radius:
    50%;
}

.weather-dock-reopen__arrow {
  color:
    var(--accent);
}

/* -------------------------
   Dock transitions
------------------------- */

.dock-enter-active,
.dock-leave-active {
  transition:
    opacity
    180ms ease,
    transform
    180ms ease;
}

.dock-enter-from,
.dock-leave-to {
  opacity: 0;

  transform:
    translate(
      -50%,
      1rem
    );
}

.dock-reopen-enter-active,
.dock-reopen-leave-active {
  transition:
    opacity
    150ms ease,
    transform
    150ms ease;
}

.dock-reopen-enter-from,
.dock-reopen-leave-to {
  opacity: 0;

  transform:
    translate(
      -50%,
      0.5rem
    );
}
</style>