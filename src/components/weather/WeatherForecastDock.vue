<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import WeatherIcon from '@/components/weather/WeatherIcon.vue'

import type {
  LocationName,
} from '@/types/location'

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

    location:
      LocationName | null

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

const hourRow =
  ref<HTMLDivElement | null>(
    null,
  )

const currentHourKey =
  ref(
    getTallinnCurrentHourKey(),
  )

let timeTimer:
  number | null =
  null

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

const selectedDay =
  computed(
    () => {
      if (!props.forecast) {
        return null
      }

      return (
        props.forecast.days.find(
          (day) =>
            day.date ===
            props.selectedDate,
        ) ?? null
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

const weekdayLongFormatter =
  new Intl.DateTimeFormat(
    'et-EE',
    {
      weekday:
        'long',

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

function weekdayLong(
  date: string,
): string {
  const value =
    weekdayLongFormatter.format(
      parseDate(date),
    )

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  )
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

function currentObservationTime(
  time: string,
): string {
  return time.slice(
    11,
    16,
  )
}

function getTallinnCurrentHourKey():
  string {
  const parts =
    new Intl.DateTimeFormat(
      'en-CA',
      {
        timeZone:
          'Europe/Tallinn',

        year:
          'numeric',

        month:
          '2-digit',

        day:
          '2-digit',

        hour:
          '2-digit',

        hourCycle:
          'h23',
      },
    ).formatToParts(
      new Date(),
    )

  const year =
    parts.find(
      (part) =>
        part.type ===
        'year',
    )?.value ?? '0000'

  const month =
    parts.find(
      (part) =>
        part.type ===
        'month',
    )?.value ?? '01'

  const day =
    parts.find(
      (part) =>
        part.type ===
        'day',
    )?.value ?? '01'

  const hour =
    parts.find(
      (part) =>
        part.type ===
        'hour',
    )?.value ?? '00'

  return (
    `${year}-${month}-${day}` +
    `T${hour}:00`
  )
}

function isUpcomingHour(
  time: string,
): boolean {
  return (
    time >=
    currentHourKey.value
  )
}

function isCurrentHour(
  time: string,
): boolean {
  return (
    time ===
    currentHourKey.value
  )
}

function updateCurrentTime() {
  currentHourKey.value =
    getTallinnCurrentHourKey()
}

function handleHourWheel(
  event: WheelEvent,
) {
  const row =
    event.currentTarget as
      HTMLElement | null

  if (
    !row ||
    event.ctrlKey
  ) {
    return
  }

  if (
    Math.abs(
      event.deltaY,
    ) >
    Math.abs(
      event.deltaX,
    )
  ) {
    event.preventDefault()

    row.scrollLeft +=
      event.deltaY
  }
}

async function scrollHoursToRelevantTime() {
  await nextTick()

  const row =
    hourRow.value

  if (!row) {
    return
  }

  const currentDate =
    currentHourKey.value.slice(
      0,
      10,
    )

  if (
    props.selectedDate !==
    currentDate
  ) {
    row.scrollTo({
      left: 0,

      behavior:
        'smooth',
    })

    return
  }

  const cards =
    Array.from(
      row.querySelectorAll<HTMLElement>(
        '.hour-card',
      ),
    )

  const currentCard =
    cards.find(
      (card) =>
        card.dataset.time ===
        currentHourKey.value,
    )

  if (!currentCard) {
    return
  }

  const target =
    Math.max(
      0,

      currentCard.offsetLeft -
      row.clientWidth *
      0.08,
    )

  row.scrollTo({
    left:
    target,

    behavior:
      'smooth',
  })
}

watch(
  [
    () =>
      props.selectedDate,

    () =>
      props.forecast,
  ],
  () => {
    void scrollHoursToRelevantTime()
  },
)

onMounted(() => {
  updateCurrentTime()

  timeTimer =
    window.setInterval(
      updateCurrentTime,
      60 * 1000,
    )

  void scrollHoursToRelevantTime()
})

onBeforeUnmount(() => {
  if (
    timeTimer !== null
  ) {
    window.clearInterval(
      timeTimer,
    )
  }
})
</script>

<template>
  <section
    class="forecast-dock"
  >
    <div
      v-if="
        loading &&
        !forecast
      "
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
      v-else-if="
        error &&
        !forecast
      "
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
      v-else-if="
        !forecast
      "
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
      <!-- CURRENT WEATHER -->

      <section
        class="current-weather-section"
      >
        <header
          class="section-heading"
        >
          <span>
            HETKEILM
          </span>

          <div
            class="section-heading__status"
          >
            <span
              v-if="loading"
              class="updating-status"
            >
              Uuendan…
            </span>

            <span
              v-else-if="error"
              class="update-error"
            >
              Uuendamine ebaõnnestus
            </span>

            <span>
              Seisuga
              {{
                currentObservationTime(
                  forecast.current.time,
                )
              }}
            </span>
          </div>
        </header>

        <div
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
            <span
              class="selected-weather__location-label"
            >
              ASUKOHT
            </span>

            <strong>
              {{
                location?.primary ??
                'Valitud asukoht'
              }}
            </strong>

            <span
              v-if="
                location?.secondary
              "
              class="selected-weather__region"
            >
              {{
                location.secondary
              }}
            </span>

            <span
              class="selected-weather__coordinates"
            >
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
        </div>
      </section>

      <!-- WEEK -->

      <section
        class="forecast-section"
      >
        <header
          class="section-heading"
        >
          <span>
            7 PÄEVA PROGNOOS
          </span>
        </header>

        <div
          class="week-row"
        >
          <button
            v-for="
              day in forecast.days
            "
            :key="
              day.date
            "
            type="button"
            class="week-day"
            :class="{
              'week-day--selected':
                selectedDate ===
                day.date,
            }"
            :aria-pressed="
              selectedDate ===
              day.date
            "
            @click="
              emit(
                'selectDate',
                day.date,
              )
            "
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
                day.precipitationProbability >
                0
              "
              class="week-day__rain"
            >
              {{
                Math.round(
                  day.precipitationProbability,
                )
              }}%
            </span>
          </button>
        </div>
      </section>

      <!-- HOURLY -->

      <section
        class="hourly-section"
      >
        <header
          v-if="
            selectedDay
          "
          class="section-heading"
        >
          <span>
            TUNNIPROGNOOS
          </span>

          <span
            class="section-heading__day"
          >
            {{
              weekdayLong(
                selectedDay.date,
              )
            }},
            {{
              shortDate(
                selectedDay.date,
              )
            }}
          </span>
        </header>

        <div
          ref="hourRow"
          class="hour-row"
          @wheel="
            handleHourWheel
          "
        >
          <article
            v-for="
              hour in selectedHours
            "
            :key="
              hour.time
            "
            class="hour-card"
            :class="{
              'hour-card--upcoming':
                isUpcomingHour(
                  hour.time,
                ),

              'hour-card--current':
                isCurrentHour(
                  hour.time,
                ),
            }"
            :data-time="
              hour.time
            "
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
      </section>

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
  position: absolute;

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

  z-index: 900;

  padding:
    clamp(
      0.75rem,
      1.1vw,
      1.05rem
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
  display: flex;
  flex-direction: column;
  justify-content: center;

  gap: 0.25rem;

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

/* Headings */

.section-heading {
  display: flex;

  align-items: center;
  justify-content:
    space-between;

  gap: 1rem;

  margin-bottom:
    0.55rem;

  color:
    var(--text-muted);

  font-size:
    clamp(
      0.62rem,
      0.68vw,
      0.74rem
    );

  font-weight: 700;

  letter-spacing:
    0.1em;

  text-transform:
    uppercase;
}

.section-heading
> span:first-child {
  color:
    var(--accent);
}

.section-heading__status {
  display: flex;

  align-items: center;

  gap: 0.7rem;

  letter-spacing:
    normal;

  text-transform:
    none;
}

.updating-status {
  color:
    var(--accent);
}

.update-error {
  color:
    #ff9a9a;
}

.section-heading__day {
  color:
    var(--text-muted)
  !important;

  letter-spacing:
    normal;

  text-transform:
    none;
}

/* Current */

.current-weather-section {
  padding-bottom:
    0.75rem;

  border-bottom:
    0.0625rem
    solid
    var(--border);
}

.selected-weather {
  display: grid;

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
}

.selected-weather__condition {
  display: flex;

  align-items:
    center;

  gap:
    0.7rem;
}

.selected-weather__condition
> div {
  display: flex;

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
  display: flex;

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
  display: flex;

  flex-direction:
    column;

  align-items:
    flex-end;

  gap:
    0.12rem;

  min-width:
    clamp(
      9rem,
      13vw,
      13rem
    );

  white-space:
    nowrap;
}

.selected-weather__location-label {
  color:
    var(--accent);

  font-size:
    0.6rem;

  font-weight:
    700;

  letter-spacing:
    0.1em;
}

.selected-weather__location
strong {
  margin-top:
    0.08rem;

  font-size:
    clamp(
      0.82rem,
      0.9vw,
      1rem
    );
}

.selected-weather__region {
  color:
    var(--text-muted);

  font-size:
    0.7rem;
}

.selected-weather__coordinates {
  color:
    var(--text-muted);

  font-size:
    0.64rem;

  opacity:
    0.75;
}

/* Weekly */

.forecast-section {
  padding-top:
    0.7rem;
}

.week-row {
  display: grid;

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
}

.week-day {
  position:
    relative;

  display: flex;

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

  color:
    var(--text);

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

  font: inherit;

  cursor: pointer;

  transition:
    background
    120ms ease,
    border-color
    120ms ease,
    color
    120ms ease,
    transform
    120ms ease;
}

.week-day:not(
  .week-day--selected
):hover {
  background:
    var(--surface);

  border-color:
    var(--border);
}

.week-day:active {
  transform:
    translateY(
      0.0625rem
    );
}

.week-day.week-day--selected,
.week-day.week-day--selected:hover,
.week-day.week-day--selected:focus-visible {
  background:
    var(--accent-soft);

  border-color:
    var(--accent-border);
}

.week-day.week-day--selected
.week-day__icon {
  color:
    var(--accent);
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
    var(--text);

  font-size:
    clamp(
      1.5rem,
      2vw,
      2.1rem
    );

  transition:
    color
    120ms ease;
}

.week-day__temperatures {
  display: flex;

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

/* Hourly */

.hourly-section {
  margin-top:
    0.7rem;

  padding-top:
    0.7rem;

  border-top:
    0.0625rem
    solid
    var(--border);
}

.hour-row {
  display: flex;

  gap:
    0.35rem;

  overflow-x:
    auto;

  overscroll-behavior-x:
    contain;

  scroll-behavior:
    smooth;

  scrollbar-width:
    thin;

  scrollbar-color:
    var(--border-strong)
    transparent;

  padding:
    0.15rem
    0
    0.45rem;
}

.hour-card {
  flex:
    0 0
    clamp(
      4.8rem,
      6.2vw,
      6.3rem
    );

  display: flex;

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

  transition:
    background
    150ms ease,
    border-color
    150ms ease;
}

.hour-card--upcoming {
  background:
    var(--accent-soft);

  border-color:
    var(--accent-border);
}

.hour-card--current {
  border-color:
    var(--accent);

  box-shadow:
    inset
    0
    0
    0
    0.0625rem
    var(--accent-border);
}

.hour-card time {
  color:
    var(--text-muted);

  font-size:
    0.7rem;
}

.hour-card--upcoming time {
  color:
    var(--text);
}

.hour-card__icon {
  margin:
    0.2rem 0;

  color:
    var(--text-muted);

  font-size:
    1.4rem;
}

.hour-card--upcoming
.hour-card__icon {
  color:
    var(--accent);
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
    0.3rem;

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
    display:
      none;
  }

  .week-row {
    display:
      flex;

    overflow-x:
      auto;

    scrollbar-width:
      thin;
  }

  .week-day {
    flex:
      0 0
      5.6rem;
  }

  .section-heading {
    align-items:
      flex-start;
  }

  .section-heading__status {
    flex-direction:
      column;

    align-items:
      flex-end;

    gap:
      0.1rem;
  }
}
</style>