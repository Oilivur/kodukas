<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

import * as L from 'leaflet'

import type {
  MapWeatherPoint,
} from '@/types/weather'

import 'leaflet/dist/leaflet.css'

const props =
    withDefaults(
        defineProps<{
          selectedPoint:
              MapWeatherPoint | null

          bottomInsetRatio?:
              number
        }>(),
        {
          bottomInsetRatio:
              0.13,
        },
    )

const emit =
    defineEmits<{
      hover: [
        point:
            MapWeatherPoint,
      ]

      leave: []

      select: [
        point:
            MapWeatherPoint,
      ]
    }>()

const mapElement =
    ref<HTMLDivElement | null>(
        null,
    )

const mapBrightness =
    ref(1)

let map:
    L.Map | null =
    null

let selectedMarker:
    L.Marker | null =
    null

let toneTimer:
    number | null =
    null

const mapStyle =
    computed(
        () => ({
          '--map-brightness':
              mapBrightness.value.toString(),
        }),
    )

const ESTONIA_BOUNDS =
    L.latLngBounds(
        [57.3, 21.45],
        [59.9, 28.35],
    )

function currentEstoniaHour():
    number {
  const parts =
      new Intl.DateTimeFormat(
          'en-GB',
          {
            timeZone:
                'Europe/Tallinn',

            hour:
                '2-digit',

            minute:
                '2-digit',

            hourCycle:
                'h23',
          },
      ).formatToParts(
          new Date(),
      )

  const hour =
      Number(
          parts.find(
              (part) =>
                  part.type ===
                  'hour',
          )?.value ?? 12,
      )

  const minute =
      Number(
          parts.find(
              (part) =>
                  part.type ===
                  'minute',
          )?.value ?? 0,
      )

  return (
      hour +
      minute / 60
  )
}

function interpolate(
    value: number,
    from: number,
    to: number,
    start: number,
    end: number,
): number {
  const progress =
      Math.min(
          1,
          Math.max(
              0,
              (value - from) /
              (to - from),
          ),
      )

  return (
      start +
      (end - start) *
      progress
  )
}

function updateMapTone() {
  const hour =
      currentEstoniaHour()

  /*
   * Intentionally subtle.
   *
   * This is just atmospheric UI styling,
   * not an astronomical day/night model.
   */
  if (
      hour >= 8 &&
      hour < 19
  ) {
    mapBrightness.value =
        1

    return
  }

  if (
      hour >= 5 &&
      hour < 8
  ) {
    mapBrightness.value =
        interpolate(
            hour,
            5,
            8,
            0.72,
            1,
        )

    return
  }

  if (
      hour >= 19 &&
      hour < 22
  ) {
    mapBrightness.value =
        interpolate(
            hour,
            19,
            22,
            1,
            0.72,
        )

    return
  }

  mapBrightness.value =
      0.72
}

function getMapPadding() {
  const width =
      window.innerWidth

  const height =
      window.innerHeight

  /*
   * Leaflet requires these values as screen coordinates,
   * so they are calculated from the viewport rather than
   * being fixed layout values.
   */
  const horizontal =
      width * 0.025

  const top =
      height * 0.025

  const bottom =
      height *
      props.bottomInsetRatio

  return {
    topLeft: [
      horizontal,
      top,
    ] as L.PointExpression,

    bottomRight: [
      horizontal,
      bottom,
    ] as L.PointExpression,
  }
}

function fitEstonia() {
  if (!map) {
    return
  }

  map.invalidateSize()

  const padding =
      getMapPadding()

  map.fitBounds(
      ESTONIA_BOUNDS,
      {
        paddingTopLeft:
        padding.topLeft,

        paddingBottomRight:
        padding.bottomRight,

        animate: false,
      },
  )

  /*
   * On desktop the fit is otherwise visually one
   * zoom step too distant.
   */
  if (
      window.matchMedia(
          '(min-width: 56.25rem)',
      ).matches
  ) {
    map.setZoom(
        map.getZoom() + 1,
        {
          animate: false,
        },
    )
  }

  /*
   * Offset north depending on how much bottom UI
   * currently occupies the viewport.
   */
  const center =
      map.getCenter()

  const northShift =
      0.1 +
      props.bottomInsetRatio *
      0.6

  map.panTo(
      [
        center.lat +
        northShift,

        center.lng,
      ],
      {
        animate: false,
      },
  )
}

function updateSelectedMarker() {
  if (!map) {
    return
  }

  if (!props.selectedPoint) {
    selectedMarker?.remove()

    selectedMarker =
        null

    return
  }

  const latLng =
      L.latLng(
          props.selectedPoint
              .latitude,

          props.selectedPoint
              .longitude,
      )

  if (selectedMarker) {
    selectedMarker.setLatLng(
        latLng,
    )

    return
  }

  const icon =
      L.divIcon({
        className:
            'weather-location-marker',

        html:
            '<span></span>',
      })

  selectedMarker =
      L.marker(
          latLng,
          {
            icon,

            keyboard: false,

            interactive:
                false,
          },
      )

  selectedMarker.addTo(
      map,
  )
}

function handleResize() {
  fitEstonia()
}

watch(
    () =>
        props.selectedPoint,
    () => {
      updateSelectedMarker()
    },
    {
      deep: true,
    },
)

watch(
    () =>
        props.bottomInsetRatio,
    () => {
      window.requestAnimationFrame(
          fitEstonia,
      )
    },
)

onMounted(() => {
  if (!mapElement.value) {
    return
  }

  updateMapTone()

  toneTimer =
      window.setInterval(
          updateMapTone,
          10 * 60 * 1000,
      )

  map =
      L.map(
          mapElement.value,
          {
            zoomControl:
                false,

            minZoom:
                6,

            maxZoom:
                18,

            attributionControl:
                true,

            maxBounds: [
              [55, 17],
              [62.5, 33],
            ],

            maxBoundsViscosity:
                0.65,
          },
      )

  L.tileLayer(
      'https://tiles.maaamet.ee/tm/tms/1.0.0/foto@GMC/{z}/{x}/{y}.png' +
      '?ASUTUS=OILIVUR&KESKKOND=LIVE&IS=KODUKAS',
      {
        tms: true,

        minZoom:
            6,

        maxZoom:
            18,

        attribution:
            'Ortofoto: Maa- ja Ruumiamet',
      },
  ).addTo(map)

  L.control
      .zoom({
        position:
            'topright',
      })
      .addTo(map)

  map.on(
      'mousemove',
      (event) => {
        emit(
            'hover',
            {
              latitude:
              event.latlng.lat,

              longitude:
              event.latlng.lng,
            },
        )
      },
  )

  map.on(
      'mouseout',
      () => {
        emit('leave')
      },
  )

  map.on(
      'click',
      (event) => {
        emit(
            'select',
            {
              latitude:
              event.latlng.lat,

              longitude:
              event.latlng.lng,
            },
        )
      },
  )

  fitEstonia()

  updateSelectedMarker()

  window.addEventListener(
      'resize',
      handleResize,
  )
})

onBeforeUnmount(() => {
  window.removeEventListener(
      'resize',
      handleResize,
  )

  if (
      toneTimer !== null
  ) {
    window.clearInterval(
        toneTimer,
    )
  }

  selectedMarker?.remove()

  selectedMarker =
      null

  map?.remove()

  map =
      null
})
</script>

<template>
  <div
      class="weather-map-shell"
  >
    <div
        ref="mapElement"
        class="weather-map"
        :style="mapStyle"
    ></div>
  </div>
</template>

<style scoped>
.weather-map-shell {
  position:
      absolute;

  inset: 0;
}

.weather-map {
  position:
      absolute;

  inset: 0;

  width: 100%;
  height: 100%;

  background:
      var(--bg);
}

:deep(
  .leaflet-tile-pane
) {
  filter:
      brightness(
          var(
              --map-brightness,
              1
          )
      );

  transition:
      filter
      2s ease;
}

:deep(
  .leaflet-control-zoom
) {
  overflow:
      hidden;

  border:
      0.0625rem
      solid
      var(--border)
  !important;

  border-radius:
      var(--radius)
  !important;

  box-shadow:
      none
  !important;
}

:deep(
  .leaflet-control-zoom a
) {
  display:
      grid;

  place-items:
      center;

  width:
      2.6rem;

  height:
      2.6rem;

  color:
      var(--text);

  background:
      rgba(
          11,
          15,
          18,
          0.88
      );

  border-color:
      var(--border)
  !important;

  font-size:
      1.25rem;

  line-height: 1;
}

:deep(
  .leaflet-control-zoom a:hover
) {
  color:
      var(--accent);

  background:
      var(--surface);
}

:deep(
  .leaflet-control-attribution
) {
  color:
      var(--text-muted);

  background:
      rgba(
          11,
          15,
          18,
          0.76
      );

  font-size:
      0.65rem;
}

:deep(
  .weather-location-marker
) {
  width:
      1.5rem
  !important;

  height:
      1.5rem
  !important;

  margin-left:
      -0.75rem
  !important;

  margin-top:
      -0.75rem
  !important;

  background:
      transparent;

  border: 0;
}

:deep(
  .weather-location-marker
    span
) {
  display:
      block;

  width: 100%;
  height: 100%;

  background:
      var(--accent);

  border:
      0.22rem
      solid
      rgba(
          11,
          15,
          18,
          0.9
      );

  border-radius:
      50%;

  box-shadow:
      0 0 0
      0.18rem
      rgba(
          168,
          255,
          62,
          0.32
      );
}
</style>