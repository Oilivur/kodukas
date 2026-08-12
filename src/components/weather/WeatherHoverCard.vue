<script setup lang="ts">
import WeatherIcon from '@/components/weather/WeatherIcon.vue'

import type {
  CurrentWeather,
  MapWeatherPoint,
} from '@/types/weather'

import {
  formatCoordinate,
  roundTemperature,
  weatherCodeLabel,
  windDirectionLabel,
} from '@/utils/weather'

defineProps<{
  point:
      MapWeatherPoint | null

  weather:
      CurrentWeather | null

  loading:
      boolean

  error:
      string | null
}>()
</script>

<template>
  <aside
      v-if="point"
      class="hover-weather"
  >
    <div
        v-if="loading"
        class="hover-loading"
    >
      <span>
        {{ formatCoordinate(point.latitude) }}° N
      </span>

      <span>
        {{ formatCoordinate(point.longitude) }}° E
      </span>

      <strong>
        Laadin ilma...
      </strong>
    </div>

    <div
        v-else-if="error"
        class="hover-loading"
    >
      <strong>
        Ilmaandmeid ei saanud laadida
      </strong>
    </div>

    <template
        v-else-if="weather"
    >
      <div
          class="hover-primary"
      >
        <WeatherIcon
            class="hover-icon"
            :code="
            weather.weatherCode
          "
            :is-day="
            weather.isDay
          "
        />

        <div>
          <strong
              class="hover-temperature"
          >
            {{
              roundTemperature(
                  weather.temperature,
              )
            }}
          </strong>

          <span>
            {{
              weatherCodeLabel(
                  weather.weatherCode,
              )
            }}
          </span>
        </div>
      </div>

      <div
          class="hover-metrics"
      >
        <span>
          Tunne
          {{
            roundTemperature(
                weather.apparentTemperature,
            )
          }}
        </span>

        <span>
          Tuul
          {{
            weather.windSpeed.toFixed(
                1,
            )
          }}
          m/s
          {{
            windDirectionLabel(
                weather.windDirection,
            )
          }}
        </span>

        <span>
          Pilvisus
          {{
            Math.round(
                weather.cloudCover,
            )
          }}%
        </span>

        <span>
          Sadu
          {{
            weather.precipitation.toFixed(
                1,
            )
          }}
          mm
        </span>
      </div>
    </template>
  </aside>
</template>

<style scoped>
.hover-weather {
  position:
      absolute;

  top:
      clamp(
          0.7rem,
          1.8dvh,
          1.25rem
      );

  left: 50%;

  z-index:
      950;

  display:
      flex;

  align-items:
      center;

  gap:
      clamp(
          0.8rem,
          1.4vw,
          1.4rem
      );

  width:
      min(
          36rem,
          calc(
              100% -
              10rem
          )
      );

  padding:
      0.7rem
      0.9rem;

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
      blur(1rem);

  transform:
      translateX(-50%);

  pointer-events:
      none;
}

.hover-primary {
  display:
      flex;

  align-items:
      center;

  gap:
      0.65rem;

  flex-shrink: 0;
}

.hover-primary > div {
  display:
      flex;

  flex-direction:
      column;

  gap:
      0.1rem;
}

.hover-icon {
  font-size:
      clamp(
          1.8rem,
          2.4vw,
          2.6rem
      );

  color:
      var(--accent);
}

.hover-temperature {
  font-size:
      clamp(
          1.25rem,
          1.7vw,
          1.7rem
      );

  line-height: 1;
}

.hover-primary span {
  color:
      var(--text-muted);

  font-size:
      0.78rem;
}

.hover-metrics {
  display:
      flex;

  flex-wrap:
      wrap;

  gap:
      0.35rem
      0.9rem;

  color:
      var(--text-muted);

  font-size:
      clamp(
          0.72rem,
          0.8vw,
          0.86rem
      );
}

.hover-loading {
  display:
      flex;

  align-items:
      center;

  gap:
      0.8rem;

  color:
      var(--text-muted);

  font-size:
      0.8rem;
}

.hover-loading strong {
  color:
      var(--text);
}

@media (
hover: none
) {
  .hover-weather {
    display: none;
  }
}
</style>