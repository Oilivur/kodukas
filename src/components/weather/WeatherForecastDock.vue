<script setup lang="ts">
import {
  computed,
} from 'vue'

import WeatherIcon from '@/components/weather/WeatherIcon.vue'

import type {
  WeatherForecast,
} from '@/types/weather'

import {
  formatCoordinate,
  roundTemperature,
  weatherCodeLabel,
  windDirectionLabel,
} from '@/utils/weather'

const props =
    defineProps<{
      forecast:
          WeatherForecast | null

      selectedDate:
          string

      loading:
          boolean

      error:
          string | null
    }>()

const emit =
    defineEmits<{
      selectDate: [
        date: string,
      ]
    }>()

const selectedHours =
    computed(
        () => {
          if (!props.forecast) {
            return []
          }

          return props.forecast
              .hours
              .filter(
                  (hour) =>
                      hour.time.startsWith(
                          props.selectedDate,
                      ),
              )
        },
    )

const weekdayFormatter =
    new Intl.DateTimeFormat(
        'et-EE',
        {
          weekday:
              'short',

          timeZone:
              'Europe/Tallinn',
        },
    )

const dateFormatter =
    new Intl.DateTimeFormat(
        'et-EE',
        {
          day:
              'numeric',

          month:
              'numeric',

          timeZone:
              'Europe/Tallinn',
        },
    )

function parseDate(
  date: string,
): Date {
  return new Date(
    `${date}T12:00:00Z`,
  )
}

function weekday(
    date: string,
): string {
  return weekdayFormatter
      .format(
          parseDate(date),
      )
      .replace('.', '')
}

function shortDate(
    date: string,
): string {
  return dateFormatter.format(
      parseDate(date),
  )
}

function hourLabel(
    time: string,
): string {
  return time.slice(
      11,
      16,
  )
}
</script>

<template>
  <section
      class="forecast-dock"
      :class="{
      'forecast-dock--loaded':
        forecast,
    }"
  >
    <div
        v-if="loading"
        class="forecast-message"
    >
      <span class="eyebrow">
        ILM
      </span>

      <strong>
        Laadin prognoosi...
      </strong>
    </div>

    <div
        v-else-if="error"
        class="forecast-message"
    >
      <span class="eyebrow">
        ILM
      </span>

      <strong>
        Prognoosi ei saanud laadida
      </strong>

      <span>
        {{ error }}
      </span>
    </div>

    <div
        v-else-if="!forecast"
        class="forecast-message"
    >
      <span class="eyebrow">
        ILM
      </span>

      <strong>
        Vali asukoht kaardilt
      </strong>

      <span>
        Liiguta hiirt hetkeilma vaatamiseks.
        Klõpsa kaardil prognoosi avamiseks.
      </span>
    </div>

    <template v-else>
      <header
          class="selected-weather"
      >
        <div
            class="selected-weather__condition"
        >
          <WeatherIcon
              class="selected-weather__icon"
              :code="
              forecast.current.weatherCode
            "
              :is-day="
              forecast.current.isDay
            "
          />

          <div>
            <div
                class="selected-weather__temperature"
            >
              {{
                roundTemperature(
                    forecast.current.temperature,
                )
              }}
            </div>

            <strong>
              {{
                weatherCodeLabel(
                    forecast.current.weatherCode,
                )
              }}
            </strong>
          </div>
        </div>

        <div
            class="selected-weather__metrics"
        >
          <span>
            Tunne
            {{
              roundTemperature(
                  forecast.current
                      .apparentTemperature,
              )
            }}
          </span>

          <span>
            Tuul
            {{
              forecast.current.windSpeed.toFixed(
                  1,
              )
            }}
            m/s
            {{
              windDirectionLabel(
                  forecast.current.windDirection,
              )
            }}
          </span>

          <span>
            Niiskus
            {{
              Math.round(
                  forecast.current.relativeHumidity,
              )
            }}%
          </span>

          <span>
            Pilvisus
            {{
              Math.round(
                  forecast.current.cloudCover,
              )
            }}%
          </span>

          <span>
            Sadu
            {{
              forecast.current.precipitation.toFixed(
                  1,
              )
            }}
            mm
          </span>
        </div>

        <div
            class="selected-weather__location"
        >
          <strong>
            Valitud asukoht
          </strong>

          <span>
            {{
              formatCoordinate(
                  forecast.dataPoint.latitude,
              )
            }}° N ·
            {{
              formatCoordinate(
                  forecast.dataPoint.longitude,
              )
            }}° E
          </span>
        </div>
      </header>

      <div
          class="week-row"
      >
        <article
            v-for="
            day in forecast.days
          "
            :key="day.date"
            class="week-day"
        >
          <strong>
            {{
              weekday(
                  day.date,
              )
            }}
          </strong>

          <span
              class="week-day__date"
          >
            {{
              shortDate(
                  day.date,
              )
            }}
          </span>

          <WeatherIcon
              class="week-day__icon"
              :code="
              day.weatherCode
            "
          />

          <div
              class="week-day__temperatures"
          >
            <span>
              Päev
              {{
                roundTemperature(
                    day.dayTemperature,
                )
              }}
            </span>

            <span>
              Öö
              {{
                roundTemperature(
                    day.nightTemperature,
                )
              }}
            </span>
          </div>

          <span
              v-if="
              day.precipitationProbability > 0
            "
              class="week-day__rain"
          >
            {{
              Math.round(
                  day.precipitationProbability,
              )
            }}%
          </span>
        </article>
      </div>

      <div
          class="forecast-detail"
      >
        <nav
            class="day-selector"
            aria-label="Vali päev"
        >
          <button
              v-for="
              day in forecast.days
            "
              :key="day.date"
              type="button"
              :class="{
              active:
                selectedDate ===
                day.date,
            }"
              @click="
              emit(
                'selectDate',
                day.date,
              )
            "
          >
            {{
              weekday(
                  day.date,
              )
            }}

            <span>
              {{
                shortDate(
                    day.date,
                )
              }}
            </span>
          </button>
        </nav>

        <div
            class="hour-row"
        >
          <article
              v-for="
              hour in selectedHours
            "
              :key="hour.time"
              class="hour-card"
          >
            <time>
              {{
                hourLabel(
                    hour.time,
                )
              }}
            </time>

            <WeatherIcon
                class="hour-card__icon"
                :code="
                hour.weatherCode
              "
                :is-day="
                hour.isDay
              "
            />

            <strong>
              {{
                roundTemperature(
                    hour.temperature,
                )
              }}
            </strong>

            <span>
              Vihm
              {{
                Math.round(
                    hour.precipitationProbability,
                )
              }}%
            </span>

            <span>
              {{
                hour.windSpeed.toFixed(
                    1,
                )
              }}
              m/s
              {{
                windDirectionLabel(
                    hour.windDirection,
                )
              }}
            </span>
          </article>
        </div>
      </div>

      <footer
          class="weather-source"
      >
        Ilmaandmed:
        <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noopener noreferrer"
        >
          Open-Meteo
        </a>
      </footer>
    </template>
  </section>
</template>

<style scoped>
.forecast-dock {
  position:
      absolute;

  left:
      clamp(
          0.65rem,
          1.2vw,
          1.3rem
      );

  right:
      clamp(
          0.65rem,
          1.2vw,
          1.3rem
      );

  bottom:
      clamp(
          0.65rem,
          1.3dvh,
          1.3rem
      );

  z-index:
      900;

  padding:
      clamp(
          0.8rem,
          1.2vw,
          1.15rem
      );

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
      var(--radius);

  backdrop-filter:
      blur(1.1rem);
}

.forecast-message {
  display:
      flex;

  flex-direction:
      column;

  justify-content:
      center;

  gap:
      0.25rem;

  min-height:
      clamp(
          3.8rem,
          7dvh,
          5rem
      );
}

.forecast-message strong {
  font-size:
      clamp(
          0.95rem,
          1vw,
          1.1rem
      );
}

.forecast-message
> span:last-child {
  color:
      var(--text-muted);

  font-size:
      0.82rem;
}

.selected-weather {
  display:
      grid;

  grid-template-columns:
    auto
    minmax(
      0,
      1fr
    )
    auto;

  align-items:
      center;

  gap:
      clamp(
          1rem,
          2vw,
          2rem
      );

  padding-bottom:
      0.8rem;

  border-bottom:
      0.0625rem
      solid
      var(--border);
}

.selected-weather__condition {
  display:
      flex;

  align-items:
      center;

  gap:
      0.7rem;
}

.selected-weather__condition
> div {
  display:
      flex;

  flex-direction:
      column;

  gap:
      0.1rem;
}

.selected-weather__icon {
  color:
      var(--accent);

  font-size:
      clamp(
          2.4rem,
          3.2vw,
          3.4rem
      );
}

.selected-weather__temperature {
  font-size:
      clamp(
          1.8rem,
          2.5vw,
          2.6rem
      );

  font-weight:
      700;

  line-height:
      0.95;
}

.selected-weather__condition
strong {
  color:
      var(--text-muted);

  font-size:
      0.78rem;

  font-weight:
      500;
}

.selected-weather__metrics {
  display:
      flex;

  flex-wrap:
      wrap;

  gap:
      0.4rem
      1.2rem;

  color:
      var(--text-muted);

  font-size:
      clamp(
          0.75rem,
          0.85vw,
          0.9rem
      );
}

.selected-weather__location {
  display:
      flex;

  flex-direction:
      column;

  align-items:
      flex-end;

  gap:
      0.15rem;

  white-space:
      nowrap;
}

.selected-weather__location
strong {
  font-size:
      0.82rem;
}

.selected-weather__location
span {
  color:
      var(--text-muted);

  font-size:
      0.72rem;
}

.week-row {
  display:
      grid;

  grid-template-columns:
    repeat(
      7,
      minmax(
          0,
          1fr
      )
    );

  gap:
      0.35rem;

  margin-top:
      0.75rem;
}

.week-day {
  position:
      relative;

  display:
      flex;

  flex-direction:
      column;

  align-items:
      center;

  gap:
      0.25rem;

  min-width: 0;

  padding:
      0.55rem
      0.35rem;

  background:
      rgba(
          255,
          255,
          255,
          0.025
      );

  border:
      0.0625rem
      solid
      transparent;

  border-radius:
      0.4rem;
}

.week-day > strong {
  text-transform:
      uppercase;

  font-size:
      0.78rem;
}

.week-day__date {
  color:
      var(--text-muted);

  font-size:
      0.68rem;
}

.week-day__icon {
  margin-block:
      0.2rem;

  color:
      var(--accent);

  font-size:
      clamp(
          1.5rem,
          2vw,
          2.1rem
      );
}

.week-day__temperatures {
  display:
      flex;

  flex-wrap:
      wrap;

  justify-content:
      center;

  gap:
      0.15rem
      0.55rem;

  font-size:
      clamp(
          0.68rem,
          0.75vw,
          0.8rem
      );
}

.week-day__temperatures
span:last-child {
  color:
      var(--text-muted);
}

.week-day__rain {
  color:
      var(--text-muted);

  font-size:
      0.68rem;
}

.forecast-detail {
  margin-top:
      0.65rem;

  padding-top:
      0.65rem;

  border-top:
      0.0625rem
      solid
      var(--border);
}

.day-selector {
  display:
      flex;

  gap:
      0.3rem;

  overflow-x:
      auto;

  padding-bottom:
      0.45rem;
}

.day-selector button {
  flex:
      1 0 auto;

  min-width:
      4.2rem;

  padding:
      0.4rem
      0.6rem;

  color:
      var(--text-muted);

  background:
      transparent;

  border:
      0.0625rem
      solid
      var(--border);

  border-radius:
      0.35rem;

  font:
      inherit;

  font-size:
      0.74rem;

  font-weight:
      700;

  text-transform:
      uppercase;

  cursor:
      pointer;

  transition:
      color
      120ms ease,
      border-color
      120ms ease,
      background
      120ms ease;
}

.day-selector button span {
  display:
      block;

  margin-top:
      0.1rem;

  font-size:
      0.62rem;

  font-weight:
      500;

  text-transform:
      none;
}

.day-selector button:hover {
  color:
      var(--text);

  background:
      var(--surface);
}

.day-selector button.active {
  color:
      var(--accent);

  background:
      var(--accent-soft);

  border-color:
      var(--accent-border);
}

.hour-row {
  display:
      flex;

  gap:
      0.35rem;

  overflow-x:
      auto;

  padding:
      0.15rem
      0
      0.4rem;
}

.hour-card {
  flex:
      0 0
      clamp(
          4.8rem,
          6.2vw,
          6.3rem
      );

  display:
      flex;

  flex-direction:
      column;

  align-items:
      center;

  gap:
      0.15rem;

  padding:
      0.5rem
      0.3rem;

  background:
      var(--bg-raised);

  border:
      0.0625rem
      solid
      var(--border);

  border-radius:
      0.4rem;
}

.hour-card time {
  color:
      var(--text-muted);

  font-size:
      0.7rem;
}

.hour-card__icon {
  margin:
      0.2rem 0;

  color:
      var(--accent);

  font-size:
      1.4rem;
}

.hour-card strong {
  font-size:
      0.95rem;
}

.hour-card span {
  color:
      var(--text-muted);

  font-size:
      0.64rem;

  text-align:
      center;
}

.weather-source {
  margin-top:
      0.35rem;

  color:
      var(--text-muted);

  font-size:
      0.58rem;

  text-align:
      right;
}

.weather-source a:hover {
  color:
      var(--accent);
}

@media (
max-width: 50rem
) {
  .selected-weather {
    grid-template-columns:
      auto
      minmax(
        0,
        1fr
      );
  }

  .selected-weather__location {
    display: none;
  }

  .week-row {
    display:
        flex;

    overflow-x:
        auto;
  }

  .week-day {
    flex:
        0 0
        5.6rem;
  }
}
</style>