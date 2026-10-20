<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import * as L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { loadDiscGolfCourses } from '@/services/discgolfApi'
import type { CourseStatus, DiscGolfCourse, PersonalCourseMark } from '@/types/discgolf'

type StatusFilter = 'all' | CourseStatus

// Keep the original marks key so notes and playable/problem flags survive this update.
const MARKS_KEY = 'kodukas.discgolf.marks.v1'
const HIDDEN_KEY = 'kodukas.discgolf.hidden.v1'
const today = new Date().toISOString().slice(0, 10)

const courses = ref<DiscGolfCourse[]>([])
const updatedAt = ref<string | null>(null)
const loading = ref(true)
const loadError = ref('')
const storageError = ref('')
const locationError = ref('')
const search = ref('')
const county = ref('all')
const filter = ref<StatusFilter>('all')
const sortNearest = ref(false)
const selectedId = ref<string | null>(null)
const noteDraft = ref('')
const marks = ref<Record<string, PersonalCourseMark>>({})
const hiddenIds = ref<string[]>([])
const showHidden = ref(false)
const lastHidden = ref<{ id: string; name: string } | null>(null)
const myLocation = ref<L.LatLng | null>(null)
const mapElement = ref<HTMLDivElement | null>(null)
const sidebarElement = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let markerLayer: L.LayerGroup | null = null
let myLocationMarker: L.CircleMarker | null = null

function normalizeText(value: string): string {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function formatDate(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('et-EE', {
    day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(date)
}

function personalMark(course: DiscGolfCourse): PersonalCourseMark | undefined {
  return marks.value[course.id]
}

function effectiveStatus(course: DiscGolfCourse): CourseStatus {
  const personal = personalMark(course)
  if (personal?.status === 'played') return 'verified'
  if (personal?.status === 'problem') return 'reported'

  // Preserve explicit corrections/closures in existing saved course data.
  if (course.status === 'verified' || course.status === 'reported' || course.status === 'closed') {
    return course.status
  }
  if (course.endDate && course.endDate <= today) return 'closed'

  // An unended Metrix layout is evidence it is listed as active, NOT proof
  // that baskets still exist. This also works with the old snapshot schema.
  if (course.metrixUrl) {
    if (course.layouts.some((layout) => !layout.endedAt || layout.endedAt > today)) return 'active'
    if (course.layouts.length === 0 && !course.endDate) return 'active'
    if (course.layouts.length > 0) return 'closed'
  }
  return 'unverified'
}

function statusLabel(course: DiscGolfCourse): string {
  switch (effectiveStatus(course)) {
    case 'active': return 'Aktiivne asetus'
    case 'verified': return 'Mängitav'
    case 'reported': return 'Probleemne'
    case 'closed': return 'Suletud'
    default: return 'Teadmata (OSM)'
  }
}

function markerColor(course: DiscGolfCourse): string {
  switch (effectiveStatus(course)) {
    case 'active': return '#66c9d2'
    case 'verified': return '#a8ff3e'
    case 'reported': return '#ff9578'
    case 'closed': return '#8c7580'
    default: return '#e7b96b'
  }
}

const selected = computed(() => courses.value.find((course) => course.id === selectedId.value) || null)
const hiddenSet = computed(() => new Set(hiddenIds.value))
const hiddenCourses = computed(() => hiddenIds.value.map((id) => ({
  id,
  name: courses.value.find((course) => course.id === id)?.name || id,
})).sort((a, b) => a.name.localeCompare(b.name, 'et')))
const counties = computed(() => [...new Set(courses.value
  .map((course) => course.county)
  .filter((item): item is string => Boolean(item)))]
  .sort((a, b) => a.localeCompare(b, 'et')))

function courseDistance(course: DiscGolfCourse): number {
  return myLocation.value
    ? myLocation.value.distanceTo([course.latitude, course.longitude]) / 1000
    : Infinity
}

function distanceLabel(course: DiscGolfCourse): string {
  const distance = courseDistance(course)
  if (!Number.isFinite(distance)) return ''
  return distance < 1 ? `${Math.round(distance * 1000)} m` : `${Math.round(distance)} km`
}

const visibleCourses = computed(() => {
  const query = normalizeText(search.value.trim())
  return courses.value.filter((course) => {
    if (hiddenSet.value.has(course.id)) return false
    if (filter.value !== 'all' && effectiveStatus(course) !== filter.value) return false
    if (county.value !== 'all' && course.county !== county.value) return false
    return !query || normalizeText(`${course.name} ${course.county || ''} ${course.locality || ''}`).includes(query)
  }).sort((a, b) => {
    if (sortNearest.value && myLocation.value) return courseDistance(a) - courseDistance(b)
    return a.name.localeCompare(b.name, 'et')
  })
})

function setSelected(course: DiscGolfCourse, pan = true): void {
  selectedId.value = course.id
  noteDraft.value = personalMark(course)?.note || ''
  if (pan && map) {
    map.flyTo([course.latitude, course.longitude], Math.max(map.getZoom(), 13), { duration: 0.5 })
  }
  void nextTick(() => sidebarElement.value?.scrollTo({ top: 0, behavior: 'smooth' }))
}

function clearSelection(): void {
  selectedId.value = null
}

function saveMark(courseId: string, status: PersonalCourseMark['status'], note: string): void {
  const text = note.trim().slice(0, 600)
  if (!status && !text) {
    delete marks.value[courseId]
  } else if (marks.value[courseId]) {
    // Mutating only the note avoids rebuilding every map marker on each keystroke.
    marks.value[courseId].status = status
    marks.value[courseId].note = text
    marks.value[courseId].date = today
  } else {
    marks.value[courseId] = { status, note: text, date: today }
  }
  try {
    localStorage.setItem(MARKS_KEY, JSON.stringify(marks.value))
    storageError.value = ''
  } catch {
    storageError.value = 'Brauser ei luba märkmeid salvestada.'
  }
}

function toggleMark(status: 'played' | 'problem'): void {
  if (!selected.value) return
  const current = personalMark(selected.value)?.status
  saveMark(selected.value.id, current === status ? null : status, noteDraft.value)
}

function onNoteInput(event: Event): void {
  if (!selected.value) return
  noteDraft.value = (event.target as HTMLTextAreaElement).value
  saveMark(selected.value.id, personalMark(selected.value)?.status || null, noteDraft.value)
}

function persistHidden(): void {
  try {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hiddenIds.value))
    storageError.value = ''
  } catch {
    storageError.value = 'Brauser ei luba peidetud radu salvestada.'
  }
}

function hideSelected(): void {
  if (!selected.value) return
  const { id, name } = selected.value
  if (!hiddenSet.value.has(id)) {
    hiddenIds.value = [...hiddenIds.value, id]
    persistHidden()
  }
  lastHidden.value = { id, name }
  clearSelection()
}

function restoreCourse(id: string): void {
  hiddenIds.value = hiddenIds.value.filter((value) => value !== id)
  persistHidden()
  if (lastHidden.value?.id === id) lastHidden.value = null
}

function downloadHiddenIds(): void {
  // Optional: put this list in data/discgolf-excluded.json in the repository
  // for cross-device exclusion by the weekly importer.
  const blob = new Blob([JSON.stringify([...hiddenIds.value].sort(), null, 2) + '\n'], {
    type: 'application/json',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'discgolf-excluded.json'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function readLocalData(): void {
  try {
    const oldMarks: unknown = JSON.parse(localStorage.getItem(MARKS_KEY) || '{}')
    if (oldMarks && typeof oldMarks === 'object' && !Array.isArray(oldMarks)) {
      const valid: Record<string, PersonalCourseMark> = {}
      for (const [id, value] of Object.entries(oldMarks)) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue
        const item = value as Partial<PersonalCourseMark>
        const status = item.status === 'played' || item.status === 'problem' ? item.status : null
        const note = typeof item.note === 'string' ? item.note.slice(0, 600) : ''
        if (status || note) {
          valid[id] = { status, note, date: typeof item.date === 'string' ? item.date : '' }
        }
      }
      marks.value = valid
    }
    const savedHidden: unknown = JSON.parse(localStorage.getItem(HIDDEN_KEY) || '[]')
    if (Array.isArray(savedHidden)) {
      hiddenIds.value = [...new Set(savedHidden.filter((id): id is string =>
        typeof id === 'string' && /^(metrix:|osm:)/.test(id),
      ))]
    }
  } catch {
    // Invalid old localStorage data must not prevent loading the map.
  }
}

function drawMarkers(): void {
  if (!markerLayer) return
  markerLayer.clearLayers()
  for (const course of visibleCourses.value) {
    const active = course.id === selectedId.value
    const closed = effectiveStatus(course) === 'closed'
    const marker = L.circleMarker([course.latitude, course.longitude], {
      radius: active ? 10 : 7,
      color: active ? '#ffffff' : '#0b0f12',
      weight: active ? 3 : 2,
      fillColor: markerColor(course),
      fillOpacity: closed ? 0.5 : 0.94,
    })
    const tooltip = document.createElement('span')
    tooltip.textContent = course.name
    marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -5] })
    marker.on('click', () => setSelected(course, false))
    marker.addTo(markerLayer)
  }
}

function useMyLocation(): void {
  locationError.value = ''
  if (!navigator.geolocation) {
    locationError.value = 'Asukoha määramine pole saadaval.'
    return
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      if (!map) return
      myLocation.value = L.latLng(coords.latitude, coords.longitude)
      myLocationMarker?.remove()
      myLocationMarker = L.circleMarker(myLocation.value, {
        radius: 7, color: '#f1f5f3', weight: 2, fillColor: '#58a8ff', fillOpacity: 1,
      }).addTo(map).bindTooltip('Minu asukoht')
      sortNearest.value = true
      map.flyTo(myLocation.value, 10, { duration: 0.6 })
    },
    () => { locationError.value = 'Asukohta ei õnnestunud määrata.' },
    { enableHighAccuracy: false, timeout: 15000 },
  )
}

async function loadCourses(): Promise<void> {
  loading.value = true
  try {
    const data = await loadDiscGolfCourses()
    courses.value = data.courses.filter((course) =>
      Number.isFinite(course.latitude) && Number.isFinite(course.longitude),
    )
    updatedAt.value = data.updatedAt
    await nextTick()
    map?.invalidateSize()
  } catch (error) {
    loadError.value = error instanceof Error ? error.message : 'Rajainfo laadimine ebaõnnestus.'
  } finally {
    loading.value = false
  }
}

function directionsUrl(course: DiscGolfCourse): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${course.latitude}%2C${course.longitude}`
}

function openStreetMapUrl(course: DiscGolfCourse): string {
  return course.osmUrl || `https://www.openstreetmap.org/?mlat=${course.latitude}&mlon=${course.longitude}#map=16/${course.latitude}/${course.longitude}`
}

// Refresh pin colors when a playable/problem flag changes, but not for note edits.
const markerStatusSignature = computed(() => visibleCourses.value
  .map((course) => `${course.id}:${effectiveStatus(course)}`)
  .join('|'))
watch([visibleCourses, selectedId, markerStatusSignature], drawMarkers, { flush: 'post' })

onMounted(() => {
  readLocalData()
  if (mapElement.value) {
    map = L.map(mapElement.value, { center: [58.85, 25.3], zoom: 7, zoomControl: false })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    }).addTo(map)
    L.control.zoom({ position: 'topright' }).addTo(map)
    markerLayer = L.layerGroup().addTo(map)
  }
  void loadCourses()
})

onBeforeUnmount(() => {
  map?.remove()
  map = null
  markerLayer = null
  myLocationMarker = null
})
</script>

<template>
  <main class="golf-page">
    <header class="golf-header">
      <RouterLink to="/" class="back-link" aria-label="Tagasi avalehele">←</RouterLink>
      <strong>DISCGOLFI RAJAD</strong>
      <small v-if="updatedAt" class="updated">{{ formatDate(updatedAt) }}</small>
    </header>

    <div class="golf-layout">
      <aside ref="sidebarElement" class="golf-sidebar" aria-label="Radade loend">
        <template v-if="!selected">
          <div class="controls">
            <input v-model="search" aria-label="Otsi rada" type="search" placeholder="Otsi rada…" autocomplete="off" />
            <div class="filter-row">
              <select v-model="county" aria-label="Maakond">
                <option value="all">Kõik maakonnad</option>
                <option v-for="item in counties" :key="item" :value="item">{{ item }}</option>
              </select>
              <select v-model="filter" aria-label="Raja seis">
                <option value="all">Kõik rajad</option>
                <option value="active">Aktiivne asetus</option>
                <option value="verified">Mängitav</option>
                <option value="reported">Probleemne</option>
                <option value="unverified">Teadmata</option>
                <option value="closed">Suletud</option>
              </select>
            </div>
            <div class="toolbar">
              <span>{{ visibleCourses.length }} rada</span>
              <button type="button" @click="useMyLocation">◎ Minu lähedal</button>
            </div>
            <p v-if="locationError" class="feedback error">{{ locationError }}</p>
            <p v-if="storageError" class="feedback error">{{ storageError }}</p>
            <div v-if="lastHidden" class="undo-bar">
              <span>Peidetud: {{ lastHidden.name }}</span>
              <button type="button" @click="restoreCourse(lastHidden.id)">Võta tagasi</button>
            </div>
            <div v-if="hiddenIds.length" class="hidden-manager">
              <button type="button" class="hidden-toggle" :aria-expanded="showHidden" @click="showHidden = !showHidden">
                Peidetud ({{ hiddenIds.length }}) <span>{{ showHidden ? '▴' : '▾' }}</span>
              </button>
              <div v-if="showHidden" class="hidden-list">
                <div v-for="course in hiddenCourses" :key="course.id" class="hidden-item">
                  <span :title="course.id">{{ course.name }}</span>
                  <button type="button" @click="restoreCourse(course.id)">Taasta</button>
                </div>
                <button type="button" class="export-button" @click="downloadHiddenIds">Salvesta ID-de fail</button>
              </div>
            </div>
          </div>

          <div v-if="loading" class="empty-state">Laadin radu…</div>
          <div v-else-if="loadError" class="empty-state error">{{ loadError }}</div>
          <div v-else-if="!courses.length" class="empty-state">Rajainfo puudub. Käivita andmete uuendamine.</div>
          <div v-else-if="!visibleCourses.length" class="empty-state">Radu ei leitud.</div>
          <div v-else class="course-list">
            <button v-for="course in visibleCourses" :key="course.id" type="button" class="course-item" @click="setSelected(course)">
              <span class="status-dot" :style="{ background: markerColor(course) }"></span>
              <span class="course-copy">
                <b>{{ course.name }}</b>
                <small>{{ course.locality || course.county || statusLabel(course) }}<template v-if="distanceLabel(course)"> · {{ distanceLabel(course) }}</template></small>
              </span>
              <span class="chevron">›</span>
            </button>
          </div>
        </template>

        <div v-else class="course-details">
          <button type="button" class="back-to-list" @click="clearSelection">← Radade loend</button>
          <h1>{{ selected.name }}</h1>
          <p class="location">{{ [selected.locality, selected.county].filter(Boolean).join(', ') }}</p>
          <div class="status-line"><span class="status-dot" :style="{ background: markerColor(selected) }"></span>{{ statusLabel(selected) }}</div>

          <div class="quick-links">
            <a v-if="selected.metrixUrl" :href="selected.metrixUrl" target="_blank" rel="noopener noreferrer" class="primary-link">Disc Golf Metrix ↗</a>
            <a :href="directionsUrl(selected)" target="_blank" rel="noopener noreferrer">Juhised ↗</a>
            <a :href="openStreetMapUrl(selected)" target="_blank" rel="noopener noreferrer">OSM ↗</a>
          </div>

          <details v-if="selected.layouts.length > 1" class="layout-details">
            <summary>Metrixi asetused ({{ selected.layouts.length }})</summary>
            <a v-for="layout in selected.layouts" :key="layout.id"
              :href="`https://discgolfmetrix.com/course/${encodeURIComponent(layout.id)}`"
              target="_blank" rel="noopener noreferrer">
              <span>{{ layout.name }} <small v-if="layout.endedAt && layout.endedAt <= today">(vana)</small></span><span>↗</span>
            </a>
          </details>

          <div class="personal-section">
            <label for="course-note">Märkmed</label>
            <textarea id="course-note" :value="noteDraft" @input="onNoteInput" rows="3" maxlength="600" placeholder="Seisukord jms"></textarea>
            <div class="personal-buttons">
              <button type="button" class="played-button" :aria-pressed="personalMark(selected)?.status === 'played'" @click="toggleMark('played')">✓ Mängitav</button>
              <button type="button" class="problem-button" :aria-pressed="personalMark(selected)?.status === 'problem'" @click="toggleMark('problem')">! Probleemne</button>
              <button type="button" class="hide-button" @click="hideSelected">✕ Peida</button>
            </div>
            <p v-if="storageError" class="feedback error">{{ storageError }}</p>
          </div>
        </div>
      </aside>

      <section class="map-section" aria-label="Discgolfiradade kaart">
        <div ref="mapElement" class="golf-map"></div>
        <div class="map-legend">
          <span><i style="background:#66c9d2"></i>Aktiivne</span>
          <span><i style="background:#a8ff3e"></i>Mängitav</span>
          <span><i style="background:#ff9578"></i>Probleemne</span>
          <span><i style="background:#e7b96b"></i>Teadmata</span>
          <span><i style="background:#8c7580"></i>Suletud</span>
        </div>
        <button type="button" class="map-location-button" aria-label="Näita minu asukohta" @click="useMyLocation">◎</button>
      </section>
    </div>
  </main>
</template>

<style scoped>
.golf-page { height: 100dvh; min-height: 27rem; display: flex; flex-direction: column; overflow: hidden; background: var(--bg); }
.golf-header { height: 3.6rem; flex: none; display: flex; align-items: center; gap: 1rem; padding: 0 1.15rem; background: #0b0f12; border-bottom: 1px solid var(--border); z-index: 500; }
.golf-header strong { font-size: .88rem; letter-spacing: .1em; }
.golf-header .updated { margin-left: auto; font-size: .72rem; color: var(--text-muted); }
.back-link { display: grid; place-items: center; width: 2rem; height: 2rem; border: 1px solid var(--border); border-radius: .35rem; font-size: 1.3rem; }
.back-link:hover { border-color: var(--accent); color: var(--accent); }
.golf-layout { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(18rem, 21rem) minmax(0, 1fr); grid-template-areas: 'side map'; }
.golf-sidebar { grid-area: side; overflow-y: auto; min-height: 0; background: var(--bg-raised); border-right: 1px solid var(--border); scrollbar-color: #39454d transparent; }
.controls { padding: 1rem; border-bottom: 1px solid var(--border); }
.controls input, .controls select, textarea { font: inherit; color: var(--text); background: #0b0f12; border: 1px solid var(--border); border-radius: .4rem; outline: none; }
.controls input { width: 100%; padding: .7rem .75rem; font-size: .85rem; }
.controls input:focus, .controls select:focus, textarea:focus { border-color: var(--accent); }
.controls input::placeholder, textarea::placeholder { color: #798781; }
.filter-row { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: .55rem; margin-top: .6rem; }
.filter-row select { width: 100%; min-width: 0; padding: .6rem .4rem; font-size: .74rem; }
.toolbar { display: flex; align-items: center; justify-content: space-between; margin-top: .8rem; color: var(--text-muted); font-size: .76rem; }
.toolbar button, .back-to-list, .hidden-item button, .export-button { color: var(--accent); background: transparent; border: 0; cursor: pointer; font: inherit; }
.toolbar button:hover, .back-to-list:hover, .hidden-item button:hover, .export-button:hover { text-decoration: underline; }
.feedback { margin: .65rem 0 0; font-size: .74rem; }
.error { color: #ff9578; }
.undo-bar { display: flex; align-items: center; justify-content: space-between; gap: .45rem; margin-top: .85rem; padding: .65rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--surface); font-size: .73rem; }
.undo-bar span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.undo-bar button { color: var(--accent); cursor: pointer; flex: none; background: none; border: 0; font: inherit; }
.hidden-manager { margin-top: .75rem; }
.hidden-toggle { width: 100%; display: flex; justify-content: space-between; padding: .3rem 0; font: inherit; font-size: .74rem; text-align: left; color: var(--text-muted); border: 0; background: transparent; cursor: pointer; }
.hidden-toggle:hover { color: var(--text); }
.hidden-list { padding: .4rem .55rem; border: 1px solid var(--border); border-radius: .4rem; background: var(--surface); }
.hidden-item { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .45rem 0; font-size: .76rem; }
.hidden-item + .hidden-item { border-top: 1px solid var(--border); }
.hidden-item span { overflow-wrap: anywhere; }
.hidden-item button { flex: none; font-size: .73rem; }
.export-button { display: block; margin-top: .4rem; padding: .6rem 0 .2rem; font-size: .73rem; border-top: 1px solid var(--border); width: 100%; text-align: left; }
.course-item { display: flex; align-items: center; gap: .75rem; width: 100%; padding: .8rem 1rem; text-align: left; border: 0; border-bottom: 1px solid var(--border); color: var(--text); background: transparent; cursor: pointer; font: inherit; }
.course-item:hover, .course-item:focus-visible { background: var(--surface-hover); }
.course-item:focus-visible { outline: 1px solid var(--accent); outline-offset: -1px; }
.status-dot { display: inline-block; flex: none; width: .62rem; height: .62rem; border-radius: 50%; }
.course-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: .2rem; }
.course-copy b { font-size: .83rem; font-weight: 650; }
.course-copy small { color: var(--text-muted); font-size: .69rem; }
.chevron { font-size: 1.3rem; color: var(--text-muted); }
.empty-state { padding: 1.4rem 1rem; font-size: .84rem; color: var(--text-muted); }
.empty-state.error { color: #ff9578; }
.course-details { padding: 1.2rem 1rem 2rem; }
.back-to-list { display: block; padding: .1rem 0; margin-bottom: 1.2rem; font-size: .82rem; }
.course-details h1 { margin: 0; font-size: 1.65rem; letter-spacing: -.04em; line-height: 1.2; overflow-wrap: anywhere; }
.location { margin: .5rem 0 1rem; font-size: .81rem; color: var(--text-muted); }
.location:empty { display: none; }
.status-line { display: flex; align-items: center; gap: .5rem; font-size: .77rem; color: var(--text-muted); margin-bottom: 1rem; }
.quick-links { display: flex; flex-wrap: wrap; gap: .45rem; }
.quick-links a { display: inline-flex; flex: 1; justify-content: center; align-items: center; min-width: max-content; padding: .67rem .7rem; border: 1px solid var(--border-strong); border-radius: .4rem; background: var(--surface); color: var(--text); font-size: .76rem; font-weight: 650; }
.quick-links a:hover { background: var(--surface-hover); }
.quick-links .primary-link { background: var(--accent); color: #0b0f12; border-color: var(--accent); }
.quick-links .primary-link:hover { filter: brightness(1.08); }
.layout-details { margin-top: 1rem; border: 1px solid var(--border); border-radius: .4rem; overflow: hidden; }
.layout-details summary { padding: .75rem; font-size: .79rem; cursor: pointer; }
.layout-details[open] summary { border-bottom: 1px solid var(--border); }
.layout-details a { display: flex; justify-content: space-between; gap: .65rem; padding: .65rem .75rem; border-bottom: 1px solid var(--border); font-size: .78rem; }
.layout-details a:last-child { border-bottom: 0; }
.layout-details a:hover { background: var(--surface-hover); color: var(--accent); }
.layout-details a small { color: var(--text-muted); font-size: .7rem; }
.personal-section { margin-top: 1.4rem; }
.personal-section label { display: block; margin-bottom: .5rem; font-size: .78rem; font-weight: 650; }
.personal-section textarea { display: block; width: 100%; resize: vertical; padding: .72rem; font-size: .8rem; }
.personal-buttons { display: flex; gap: .35rem; margin-top: .7rem; }
.personal-buttons button { flex: 1; min-width: 0; padding: .65rem .2rem; border: 1px solid var(--border-strong); border-radius: .35rem; background: var(--surface); font: inherit; font-size: .73rem; font-weight: 650; cursor: pointer; }
.personal-buttons button:hover { background: var(--surface-hover); }
.played-button { color: var(--accent); }
.problem-button { color: #ffad92; }
.hide-button { color: var(--text-muted); }
.personal-buttons button[aria-pressed="true"] { background: var(--accent-soft); border-color: var(--accent-border); }
.personal-buttons .problem-button[aria-pressed="true"] { background: rgba(255,149,120,.13); border-color: #ff9578; }
.map-section { grid-area: map; min-width: 0; min-height: 0; position: relative; overflow: hidden; background: #161c1c; }
.golf-map { width: 100%; height: 100%; }
.map-legend { z-index: 400; position: absolute; bottom: 1.4rem; left: 1rem; display: flex; flex-wrap: wrap; gap: .45rem .9rem; max-width: calc(100% - 2rem); padding: .6rem .75rem; border: 1px solid var(--border); border-radius: .4rem; background: rgba(11,15,18,.92); font-size: .68rem; color: var(--text-muted); pointer-events: none; }
.map-legend span { display: inline-flex; align-items: center; gap: .3rem; }
.map-legend i { display: inline-block; width: .55rem; height: .55rem; border-radius: 50%; }
.map-location-button { z-index: 400; position: absolute; top: 5.2rem; right: .6rem; display: grid; place-items: center; width: 34px; height: 34px; padding: 0; border-radius: 4px; border: 2px solid #aaa; background: white; color: #222; font-size: 1.2rem; box-shadow: 0 1px 5px #0007; cursor: pointer; }
.map-location-button:hover { background: #eee; }
:deep(.leaflet-container) { font-family: inherit; background: #151f20; }
:deep(.leaflet-control-attribution) { font-size: 10px; }
:deep(.leaflet-tooltip) { background: #10161a; color: #f1f5f3; border: 1px solid #39454d; box-shadow: 0 4px 12px #0009; }
:deep(.leaflet-tooltip-top::before) { border-top-color: #39454d; }
@media (max-width: 750px) {
  .golf-header { height: 3.3rem; padding: 0 .8rem; }
  .golf-header strong { font-size: .77rem; }
  .golf-header .updated { font-size: .65rem; }
  .golf-layout { grid-template-columns: minmax(0,1fr); grid-template-rows: 47% minmax(0,1fr); grid-template-areas: 'map' 'side'; }
  .golf-sidebar { border-right: 0; border-top: 1px solid var(--border); }
  .map-legend { left: .5rem; bottom: .5rem; padding: .5rem .6rem; gap: .3rem .6rem; font-size: .61rem; }
}
@media (max-width: 365px) {
  .golf-header .updated { display: none; }
  .filter-row { gap: .35rem; }
  .filter-row select { font-size: .7rem; }
  .personal-buttons button { font-size: .68rem; }
}
</style>
