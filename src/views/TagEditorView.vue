<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  ref,
} from 'vue'

import {
  createTaggedMp3,
  formatFileSize,
  isMp3,
  readTrack,
  safeMp3Filename,
  type EditableTrack,
} from '@/services/id3Tags'

type StatusTone =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'error'

const tracks =
  ref<EditableTrack[]>([])

const activeIndex = ref(-1)
const busy = ref(false)
const dragging = ref(false)
const nextTrackId = ref(1)

const statusMessage = ref('')
const statusTone =
  ref<StatusTone>('neutral')

const initialFilesInput =
  ref<HTMLInputElement | null>(
    null,
  )

const moreFilesInput =
  ref<HTMLInputElement | null>(
    null,
  )

const titleInput =
  ref<HTMLInputElement | null>(
    null,
  )

const yearInput =
  ref<HTMLInputElement | null>(
    null,
  )

const coverPreviewUrl =
  ref<string | null>(null)

const audioPreviewUrl =
  ref<string | null>(null)

const activeTrack = computed(
  () =>
    tracks.value[
      activeIndex.value
    ] ?? null,
)

const hasBatch = computed(
  () => tracks.value.length > 1,
)

function setStatus(
  message = '',
  tone: StatusTone =
    'neutral',
) {
  statusMessage.value = message
  statusTone.value = tone
}

function revokeCoverPreview() {
  if (coverPreviewUrl.value) {
    URL.revokeObjectURL(
      coverPreviewUrl.value,
    )

    coverPreviewUrl.value = null
  }
}

function revokeAudioPreview() {
  if (audioPreviewUrl.value) {
    URL.revokeObjectURL(
      audioPreviewUrl.value,
    )

    audioPreviewUrl.value = null
  }
}

function refreshPreviews() {
  revokeCoverPreview()
  revokeAudioPreview()

  const track = activeTrack.value

  if (!track) {
    return
  }

  audioPreviewUrl.value =
    URL.createObjectURL(
      track.file,
    )

  if (track.cover) {
    coverPreviewUrl.value =
      URL.createObjectURL(
        new Blob(
          [track.cover.data],
          {
            type:
              track.cover
                .mimeType,
          },
        ),
      )
  }
}

function selectTrack(
  index: number,
) {
  const track = tracks.value[index]

  if (
    busy.value ||
    !track
  ) {
    return
  }

  activeIndex.value = index
  refreshPreviews()

  setStatus(
    track.readWarning,
    track.readWarning
      ? 'warning'
      : 'neutral',
  )
}

function trackNumberLabel(
  track: EditableTrack,
  index: number,
) {
  return (
    track.trackNumber
      .split('/')[0]
      ?.trim() ||
    String(index + 1)
  )
}

function trackTitle(
  track: EditableTrack,
) {
  return (
    track.title ||
    track.file.name.replace(
      /\.mp3$/i,
      '',
    )
  )
}

async function addFiles(
  fileList:
    | FileList
    | null,
) {
  if (
    busy.value ||
    !fileList
  ) {
    return
  }

  const files =
    Array.from(fileList)

  const mp3Files =
    files.filter(isMp3)

  if (initialFilesInput.value) {
    initialFilesInput.value.value =
      ''
  }

  if (moreFilesInput.value) {
    moreFilesInput.value.value =
      ''
  }

  if (!mp3Files.length) {
    setStatus(
      'Vali MP3-failid. Muid helivorminguid see redaktor ei muuda.',
      'error',
    )
    return
  }

  busy.value = true

  setStatus(
    `Loen ${mp3Files.length} ${
      mp3Files.length === 1
        ? 'faili'
        : 'faili'
    }…`,
  )

  try {
    const loaded =
      await Promise.all(
        mp3Files.map(
          (file) => {
            const id =
              nextTrackId.value

            nextTrackId.value += 1

            return readTrack(
              file,
              id,
            )
          },
        ),
      )

    tracks.value.push(
      ...loaded,
    )

    if (
      activeIndex.value === -1
    ) {
      activeIndex.value = 0
      refreshPreviews()
    }

    const warningCount =
      loaded.filter(
        (track) =>
          track.readWarning,
      ).length

    if (warningCount) {
      setStatus(
        `${loaded.length} ${
          loaded.length === 1
            ? 'fail'
            : 'faili'
        } lisatud. ${warningCount} ${
          warningCount === 1
            ? 'failil'
            : 'failil'
        } ei õnnestunud silte lugeda.`,
        'warning',
      )
    } else {
      setStatus(
        `${loaded.length} ${
          loaded.length === 1
            ? 'fail'
            : 'faili'
        } lisatud.`,
        'success',
      )
    }
  } catch (error) {
    console.error(error)

    setStatus(
      'MP3-faile ei õnnestunud avada.',
      'error',
    )
  } finally {
    busy.value = false
  }
}

function onFilesChosen(
  event: Event,
) {
  const input =
    event.target as HTMLInputElement

  void addFiles(
    input.files,
  )
}

function onDrop(
  event: DragEvent,
) {
  dragging.value = false

  void addFiles(
    event.dataTransfer
      ?.files ?? null,
  )
}

function clearAll() {
  if (busy.value) {
    return
  }

  tracks.value = []
  activeIndex.value = -1
  nextTrackId.value = 1

  revokeCoverPreview()
  revokeAudioPreview()

  setStatus()
}

async function chooseCover(
  event: Event,
) {
  const input =
    event.target as HTMLInputElement

  const file = input.files?.[0]
  const track = activeTrack.value

  input.value = ''

  if (
    !file ||
    !track
  ) {
    return
  }

  if (
    !/^image\/(jpeg|png|webp)$/i.test(
      file.type,
    )
  ) {
    setStatus(
      'Vali JPG-, PNG- või WebP-pilt.',
      'error',
    )
    return
  }

  if (
    file.size >
    8 * 1024 * 1024
  ) {
    setStatus(
      'Kaanepilt on suurem kui 8 MB. Kasuta väiksemat ruudukujulist pilti.',
      'error',
    )
    return
  }

  track.cover = {
    data:
      await file.arrayBuffer(),
    mimeType: file.type,
  }

  refreshPreviews()

  setStatus(
    'Kaanepilt muudetud. Muudatuse salvestamiseks laadi MP3 alla.',
    'success',
  )
}

function removeCover() {
  if (!activeTrack.value) {
    return
  }

  activeTrack.value.cover = null

  refreshPreviews()

  setStatus(
    'Kaanepilt eemaldatud. Muudatuse salvestamiseks laadi MP3 alla.',
  )
}

function applySharedDetails() {
  const source = activeTrack.value

  if (
    !source ||
    !hasBatch.value ||
    busy.value
  ) {
    return
  }

  for (
    const track of tracks.value
  ) {
    track.artist = source.artist
    track.albumArtist =
      source.albumArtist
    track.album = source.album
    track.year = source.year
    track.genre = source.genre
    track.cover = source.cover
  }

  setStatus(
    `Albumi andmed kopeeriti kõigile ${tracks.value.length} loole. Pealkirju ja loonumbreid ei muudetud.`,
    'success',
  )
}

function validationError(
  track: EditableTrack,
) {
  if (!track.title.trim()) {
    return 'title'
  }

  if (
    track.year &&
    !/^\d{4}$/.test(
      track.year,
    )
  ) {
    return 'year'
  }

  return null
}

async function showValidation(
  track: EditableTrack,
) {
  const error =
    validationError(track)

  if (error === 'title') {
    setStatus(
      'Lisa enne allalaadimist loo pealkiri.',
      'error',
    )

    await nextTick()
    titleInput.value?.focus()

    return false
  }

  if (error === 'year') {
    setStatus(
      'Aasta peab olema tühi või koosnema neljast numbrist, näiteks 2007.',
      'error',
    )

    await nextTick()
    yearInput.value?.focus()

    return false
  }

  return true
}

function startDownload(
  blob: Blob,
  filename: string,
) {
  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url
  link.download =
    safeMp3Filename(filename)

  link.hidden = true

  document.body.append(link)
  link.click()
  link.remove()

  window.setTimeout(
    () =>
      URL.revokeObjectURL(
        url,
      ),
    60_000,
  )
}

async function downloadTrack(
  track: EditableTrack,
) {
  const blob =
    await createTaggedMp3(
      track,
    )

  startDownload(
    blob,
    track.outputName ||
      track.file.name,
  )
}

async function downloadCurrent() {
  const track = activeTrack.value

  if (
    !track ||
    busy.value
  ) {
    return
  }

  if (
    !(await showValidation(
      track,
    ))
  ) {
    return
  }

  busy.value = true

  setStatus(
    'Loon muudetud siltidega MP3-faili…',
  )

  try {
    await downloadTrack(track)

    setStatus(
      `Alla laaditud ${safeMp3Filename(
        track.outputName ||
          track.file.name,
      )}. Algset faili ei muudetud.`,
      'success',
    )
  } catch (error) {
    console.error(error)

    setStatus(
      'Muudetud siltidega MP3-faili ei õnnestunud luua. Proovi mõnda teist MP3-faili.',
      'error',
    )
  } finally {
    busy.value = false
  }
}

function wait(
  milliseconds: number,
) {
  return new Promise<void>(
    (resolve) =>
      window.setTimeout(
        resolve,
        milliseconds,
      ),
  )
}

async function downloadAll() {
  if (
    busy.value ||
    !hasBatch.value
  ) {
    return
  }

  const invalidIndex =
    tracks.value.findIndex(
      (track) =>
        validationError(
          track,
        ) !== null,
    )

  if (invalidIndex >= 0) {
    const invalidTrack = tracks.value[invalidIndex]

    if (invalidTrack) {
      selectTrack(invalidIndex)

      await showValidation(
        invalidTrack,
      )
    }

    return
  }

  busy.value = true
  let completed = 0

  try {
    for (
      const track of tracks.value
    ) {
      setStatus(
        `Loon faili ${completed + 1}/${tracks.value.length}: ${track.title}…`,
      )

      await downloadTrack(track)

      completed += 1

      await wait(350)
    }

    setStatus(
      `Alla laaditud ${completed} muudetud siltidega MP3-faili. Firefox võib küsida luba mitme faili allalaadimiseks.`,
      'success',
    )
  } catch (error) {
    console.error(error)

    setStatus(
      `Alla laaditi ${completed} faili, seejärel tekkis probleem. Proovi ülejäänud lood ükshaaval alla laadida.`,
      'error',
    )
  } finally {
    busy.value = false
  }
}

onBeforeUnmount(() => {
  revokeCoverPreview()
  revokeAudioPreview()
})
</script>

<template>
  <main class="page tag-editor-view">
    <header class="page-heading editor-heading">
      <div>
        <span class="eyebrow">
          Mp3 tag editor
        </span>

      </div>
    </header>

    <section
      v-if="tracks.length === 0"
      class="drop-panel"
      aria-labelledby="drop-title"
    >
      <label
        class="drop-zone"
        :class="{
          'drop-zone--active': dragging,
        }"
        for="initial-mp3-files"
        @dragenter.prevent="dragging = true"
        @dragover.prevent="dragging = true"
        @dragleave.prevent="dragging = false"
        @drop.prevent="onDrop"
      >
        <input
          id="initial-mp3-files"
          ref="initialFilesInput"
          class="visually-hidden"
          type="file"
          accept=".mp3,audio/mpeg"
          multiple
          :disabled="busy"
          @change="onFilesChosen"
        >

        <span
          class="drop-icon"
          aria-hidden="true"
        >
          <svg viewBox="0 0 48 48">
            <path d="M30 8v22.2a7.2 7.2 0 1 1-3-5.85V14.1l14-3.5v15.6a7.2 7.2 0 1 1-3-5.85V8.75L30 10.8V8Z" />
          </svg>
        </span>

        <strong id="drop-title">
          Lohista MP3-failid siia
        </strong>

        <span>või vali need oma seadmest</span>

        <span class="choose-files">
          Vali MP3-failid
        </span>
      </label>
    </section>

    <section
      v-else
      class="editor-workspace"
    >
      <aside
        class="track-panel"
        aria-labelledby="track-heading"
      >
        <div class="panel-heading">
          <div>
            <span class="eyebrow">
              Lisatud failid
            </span>

            <h2 id="track-heading">
              Lood
            </h2>
          </div>

          <span class="count-badge">
            {{ tracks.length }}
          </span>
        </div>

        <ol class="track-list">
          <li
            v-for="(track, index) in tracks"
            :key="track.id"
          >
            <button
              class="track-button"
              type="button"
              :aria-current="index === activeIndex ? 'true' : undefined"
              :disabled="busy"
              @click="selectTrack(index)"
            >
              <span class="track-number">
                {{ trackNumberLabel(track, index) }}
              </span>

              <span class="track-copy">
                <strong>
                  {{ trackTitle(track) }}
                </strong>

                <span>
                  {{ track.artist || track.file.name }}
                </span>
              </span>
            </button>
          </li>
        </ol>

        <div class="track-actions">
          <label
            class="button button--secondary button--small"
            for="more-mp3-files"
          >
            Lisa faile

            <input
              id="more-mp3-files"
              ref="moreFilesInput"
              class="visually-hidden"
              type="file"
              accept=".mp3,audio/mpeg"
              multiple
              :disabled="busy"
              @change="onFilesChosen"
            >
          </label>

          <button
            class="text-button"
            type="button"
            :disabled="busy"
            @click="clearAll"
          >
            Tühjenda kõik
          </button>
        </div>
      </aside>

      <section
        v-if="activeTrack"
        class="editing-panel"
        aria-labelledby="editor-heading"
      >
        <div class="panel-heading">
          <div>
            <span class="eyebrow">
              Praegu muudad
            </span>

            <h2 id="editor-heading">
              Loo andmed
            </h2>
          </div>

          <span class="format-badge">
            MP3 · ID3v2.3
          </span>
        </div>

        <form
          class="tag-form"
          novalidate
          @submit.prevent="downloadCurrent"
        >
          <div class="editor-grid">
            <div class="artwork-column">
              <div class="cover-frame">
                <img
                  v-if="coverPreviewUrl"
                  :src="coverPreviewUrl"
                  alt="Albumi kaanepildi eelvaade"
                >

                <div
                  v-else
                  class="cover-placeholder"
                >
                  <svg
                    viewBox="0 0 64 64"
                    aria-hidden="true"
                  >
                    <path d="M39 9v29.7a9.5 9.5 0 1 1-4-7.75V17.1l19-4.75v20.35a9.5 9.5 0 1 1-4-7.75V9.75L39 12.5V9Z" />
                  </svg>

                  <span>Kaanepilt puudub</span>
                </div>
              </div>

              <div class="cover-actions">
                <label
                  class="button button--secondary button--small"
                  for="cover-file"
                >
                  Vali kaanepilt

                  <input
                    id="cover-file"
                    class="visually-hidden"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="busy"
                    @change="chooseCover"
                  >
                </label>

                <button
                  class="text-button"
                  type="button"
                  :disabled="busy || !activeTrack.cover"
                  @click="removeCover"
                >
                  Eemalda
                </button>
              </div>

              <p class="field-note">
                Spotify jaoks on kõige kindlam valik ruudukujuline JPG-kaas.
              </p>

              <audio
                v-if="audioPreviewUrl"
                class="audio-preview"
                :src="audioPreviewUrl"
                controls
                preload="metadata"
              ></audio>

              <p class="file-summary">
                {{ activeTrack.file.name }} ·
                {{ formatFileSize(activeTrack.file.size) }}
              </p>
            </div>

            <div class="fields-column">
              <div class="field field--wide">
                <label for="tag-title">
                  Pealkiri
                  <span aria-hidden="true">*</span>
                </label>

                <input
                  id="tag-title"
                  ref="titleInput"
                  v-model.trim="activeTrack.title"
                  type="text"
                  autocomplete="off"
                  required
                >
              </div>

              <div class="field">
                <label for="tag-artist">
                  Esitaja
                </label>

                <input
                  id="tag-artist"
                  v-model.trim="activeTrack.artist"
                  type="text"
                  autocomplete="off"
                >
              </div>

              <div class="field">
                <label for="tag-album-artist">
                  Albumi esitaja
                </label>

                <input
                  id="tag-album-artist"
                  v-model.trim="activeTrack.albumArtist"
                  type="text"
                  autocomplete="off"
                >
              </div>

              <div class="field field--wide">
                <label for="tag-album">
                  Album
                </label>

                <input
                  id="tag-album"
                  v-model.trim="activeTrack.album"
                  type="text"
                  autocomplete="off"
                >
              </div>

              <div class="field field--compact">
                <label for="tag-track">
                  Loo nr
                </label>

                <input
                  id="tag-track"
                  v-model.trim="activeTrack.trackNumber"
                  type="text"
                  inputmode="numeric"
                  placeholder="4 või 4/12"
                  autocomplete="off"
                >
              </div>

              <div class="field field--compact">
                <label for="tag-disc">
                  Plaadi nr
                </label>

                <input
                  id="tag-disc"
                  v-model.trim="activeTrack.discNumber"
                  type="text"
                  inputmode="numeric"
                  placeholder="1 või 1/2"
                  autocomplete="off"
                >
              </div>

              <div class="field field--compact">
                <label for="tag-year">
                  Aasta
                </label>

                <input
                  id="tag-year"
                  ref="yearInput"
                  v-model.trim="activeTrack.year"
                  type="text"
                  inputmode="numeric"
                  maxlength="4"
                  placeholder="2007"
                  autocomplete="off"
                >
              </div>

              <div class="field">
                <label for="tag-genre">
                  Žanr
                </label>

                <input
                  id="tag-genre"
                  v-model.trim="activeTrack.genre"
                  type="text"
                  autocomplete="off"
                >
              </div>

              <div class="field field--wide">
                <label for="tag-comment">
                  Kommentaar
                </label>

                <textarea
                  id="tag-comment"
                  v-model.trim="activeTrack.comment"
                  rows="3"
                ></textarea>
              </div>

              <div class="field field--wide filename-field">
                <label for="tag-filename">
                  Allalaaditava faili nimi
                </label>

                <input
                  id="tag-filename"
                  v-model.trim="activeTrack.outputName"
                  type="text"
                  autocomplete="off"
                >
              </div>
            </div>
          </div>

          <div
            v-if="hasBatch"
            class="batch-row"
          >
            <div>
              <strong>Sama album?</strong>

              <span>
                Kopeeri esitaja, albumi esitaja, album, aasta, žanr ja kaanepilt kõigile lisatud lugudele.
              </span>
            </div>

            <button
              class="button button--secondary"
              type="button"
              :disabled="busy"
              @click="applySharedDetails"
            >
              Rakenda albumi andmed kõigile
            </button>
          </div>

          <div class="form-footer">
            <p
              class="status-message"
              :class="`status-message--${statusTone}`"
              role="status"
              aria-live="polite"
            >
              {{ statusMessage }}
            </p>

            <div class="download-actions">
              <button
                v-if="hasBatch"
                class="button button--secondary"
                type="button"
                :disabled="busy"
                @click="downloadAll"
              >
                Laadi kõik alla
              </button>

              <button
                class="button button--primary"
                type="submit"
                :disabled="busy"
              >
                {{ busy ? 'Töötlen…' : 'Laadi muudetud MP3 alla' }}
              </button>
            </div>
          </div>
        </form>
      </section>
    </section>

    <div class="privacy-note">
      <span aria-hidden="true"></span>

      <p>
        <strong>Helifail jääb sinu seadmesse.</strong>
        Brauser loob uue allalaaditava faili ilma valitud faile üles laadimata või salvestamata.
      </p>
    </div>
  </main>
</template>

<style scoped>
.tag-editor-view {
  width:
    min(
      76rem,
      calc(
        100% -
        clamp(
          2rem,
          6vw,
          4rem
        )
      )
    );
}

.editor-heading {
  display: grid;
  grid-template-columns:
    minmax(0, 1fr)
    minmax(16rem, 0.72fr);
  align-items: end;
  gap:
    clamp(
      1rem,
      4vw,
      3rem
    );
}

.editor-heading p {
  margin: 0;
}

.drop-panel,
.track-panel,
.editing-panel {
  background:
    var(--surface);
  border:
    0.0625rem solid
    var(--border);
  border-radius:
    var(--radius);
}

.drop-panel {
  padding: 0.65rem;
}

.drop-zone {
  display: flex;
  min-height:
    clamp(
      18rem,
      48dvh,
      25rem
    );
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 2rem;
  cursor: pointer;
  background:
    repeating-linear-gradient(
      135deg,
      transparent 0 0.9rem,
      rgba(255, 255, 255, 0.012)
        0.9rem 1.8rem
    );
  border:
    0.0625rem dashed
    var(--border-strong);
  border-radius:
    calc(
      var(--radius) -
      0.15rem
    );
  text-align: center;
  transition:
    background 140ms ease,
    border-color 140ms ease,
    transform 140ms ease;
}

.drop-zone:hover,
.drop-zone--active {
  background-color:
    var(--accent-soft);
  border-color:
    var(--accent);
}

.drop-zone--active {
  transform:
    scale(0.996);
}

.drop-icon {
  display: grid;
  width: 4.8rem;
  aspect-ratio: 1;
  place-items: center;
  margin-bottom: 1.25rem;
  color: var(--accent);
  background:
    var(--accent-soft);
  border:
    0.0625rem solid
    var(--accent-border);
  border-radius: 50%;
}

.drop-icon svg {
  width: 2.3rem;
  fill: currentColor;
}

.drop-zone strong {
  font-size:
    clamp(
      1.35rem,
      3vw,
      1.9rem
    );
  letter-spacing:
    -0.025em;
}

.drop-zone > span:not(
  .drop-icon,
  .choose-files
) {
  margin-top: 0.25rem;
  color:
    var(--text-muted);
}

.choose-files {
  margin-top: 1.35rem;
  padding:
    0.7rem 0.95rem;
  color: var(--bg);
  background:
    var(--accent);
  border-radius:
    0.375rem;
  font-weight: 750;
}

.editor-workspace {
  display: grid;
  grid-template-columns:
    minmax(14rem, 18rem)
    minmax(0, 1fr);
  align-items: start;
  gap: 1rem;
}

.track-panel {
  position: sticky;
  top: 1rem;
  overflow: hidden;
}

.editing-panel {
  min-width: 0;
  overflow: hidden;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 1rem;
  padding:
    1.15rem 1.25rem;
  border-bottom:
    0.0625rem solid
    var(--border);
}

.panel-heading .eyebrow {
  margin-bottom: 0.35rem;
}

.panel-heading h2 {
  margin: 0;
  font-size: 1.15rem;
}

.count-badge,
.format-badge {
  padding:
    0.42rem 0.62rem;
  color:
    var(--text-muted);
  border:
    0.0625rem solid
    var(--border-strong);
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 750;
  letter-spacing:
    0.06em;
  line-height: 1;
  text-transform:
    uppercase;
}

.count-badge {
  min-width: 2rem;
  color: var(--text);
  text-align: center;
}

.track-list {
  max-height:
    min(57dvh, 34rem);
  overflow-y: auto;
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  scrollbar-color:
    var(--border-strong)
    transparent;
}

.track-list li + li {
  margin-top: 0.25rem;
}

.track-button {
  display: grid;
  width: 100%;
  grid-template-columns:
    2.1rem minmax(0, 1fr);
  align-items: center;
  gap: 0.7rem;
  padding: 0.68rem;
  color: var(--text);
  background: transparent;
  border:
    0.0625rem solid
    transparent;
  border-radius:
    0.375rem;
  cursor: pointer;
  text-align: left;
}

.track-button:hover:not(:disabled) {
  background:
    var(--surface-hover);
}

.track-button[aria-current="true"] {
  background:
    var(--accent-soft);
  border-color:
    var(--accent-border);
}

.track-number {
  display: grid;
  width: 2.1rem;
  aspect-ratio: 1;
  place-items: center;
  color:
    var(--text-muted);
  border:
    0.0625rem solid
    var(--border-strong);
  border-radius: 50%;
  font-size: 0.72rem;
  font-weight: 750;
}

.track-button[aria-current="true"]
.track-number {
  color: var(--bg);
  background:
    var(--accent);
  border-color:
    var(--accent);
}

.track-copy {
  min-width: 0;
}

.track-copy strong,
.track-copy span {
  display: block;
  overflow: hidden;
  text-overflow:
    ellipsis;
  white-space: nowrap;
}

.track-copy strong {
  font-size: 0.9rem;
}

.track-copy span {
  margin-top: 0.1rem;
  color:
    var(--text-muted);
  font-size: 0.75rem;
}

.track-actions {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-top:
    0.0625rem solid
    var(--border);
}

.tag-form {
  padding:
    clamp(
      1rem,
      2.5vw,
      1.4rem
    );
}

.editor-grid {
  display: grid;
  grid-template-columns:
    minmax(12rem, 15rem)
    minmax(0, 1fr);
  gap:
    clamp(
      1.3rem,
      4vw,
      2.4rem
    );
}

.cover-frame {
  width: 100%;
  overflow: hidden;
  aspect-ratio: 1;
  background:
    var(--bg);
  border:
    0.0625rem solid
    var(--border);
  border-radius:
    var(--radius);
}

.cover-frame img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-placeholder {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 0.7rem;
  color:
    var(--text-muted);
  background:
    linear-gradient(
      135deg,
      transparent 49.5%,
      rgba(255, 255, 255, 0.035)
        50%,
      transparent 50.5%
    );
}

.cover-placeholder svg {
  width: 3rem;
  fill: currentColor;
}

.cover-placeholder span {
  font-size: 0.75rem;
  font-weight: 750;
  letter-spacing:
    0.08em;
  text-transform:
    uppercase;
}

.cover-actions {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 0.65rem;
  margin-top: 0.7rem;
}

.field-note,
.file-summary {
  color:
    var(--text-muted);
  font-size: 0.75rem;
}

.field-note {
  margin: 0.5rem 0 0;
}

.file-summary {
  overflow-wrap: anywhere;
  margin: 0.4rem 0 0;
}

.audio-preview {
  width: 100%;
  height: 2.55rem;
  margin-top: 1.1rem;
  accent-color:
    var(--accent);
}

.fields-column {
  display: grid;
  grid-template-columns:
    repeat(
      6,
      minmax(0, 1fr)
    );
  align-content: start;
  gap: 0.95rem;
}

.field {
  grid-column: span 3;
}

.field--wide {
  grid-column: 1 / -1;
}

.field--compact {
  grid-column: span 2;
}

.field label {
  display: block;
  margin-bottom: 0.35rem;
  color:
    var(--text-muted);
  font-size: 0.8rem;
  font-weight: 650;
}

.field label span {
  color: var(--accent);
}

.field input,
.field textarea {
  width: 100%;
  padding:
    0.66rem 0.72rem;
  color: var(--text);
  background:
    var(--bg-raised);
  border:
    0.0625rem solid
    var(--border-strong);
  border-radius:
    0.375rem;
  outline: 0;
  font: inherit;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    box-shadow 120ms ease;
}

.field textarea {
  min-height: 5rem;
  resize: vertical;
}

.field input:hover,
.field textarea:hover {
  border-color: #526069;
}

.field input:focus,
.field textarea:focus {
  background:
    var(--surface-hover);
  border-color:
    var(--accent);
  box-shadow:
    0 0 0 0.2rem
    var(--accent-soft);
}

.filename-field {
  margin-top: 0.15rem;
  padding-top: 0.95rem;
  border-top:
    0.0625rem solid
    var(--border);
}

.button,
.text-button {
  border: 0;
  font: inherit;
  cursor: pointer;
}

.button {
  display: inline-flex;
  min-height: 2.65rem;
  align-items: center;
  justify-content: center;
  padding:
    0.68rem 0.95rem;
  border:
    0.0625rem solid
    transparent;
  border-radius:
    0.375rem;
  font-weight: 750;
  line-height: 1.1;
  transition:
    background 120ms ease,
    border-color 120ms ease,
    filter 120ms ease,
    transform 120ms ease;
}

.button:hover:not(:disabled) {
  transform:
    translateY(-0.0625rem);
}

.button--primary {
  color: var(--bg);
  background:
    var(--accent);
}

.button--primary:hover:not(:disabled) {
  filter: brightness(1.08);
}

.button--secondary {
  color: var(--text);
  background:
    var(--bg-raised);
  border-color:
    var(--border-strong);
}

.button--secondary:hover:not(:disabled) {
  background:
    var(--surface-hover);
  border-color:
    var(--accent);
}

.button--small {
  min-height: 2.2rem;
  padding:
    0.5rem 0.68rem;
  font-size: 0.78rem;
}

.text-button {
  padding: 0.45rem;
  color:
    var(--text-muted);
  background: transparent;
  font-size: 0.78rem;
  font-weight: 650;
}

.text-button:hover:not(:disabled) {
  color: var(--accent);
}

.button:disabled,
.text-button:disabled,
.track-button:disabled {
  cursor: wait;
  opacity: 0.55;
}

.batch-row {
  display: flex;
  align-items: center;
  justify-content:
    space-between;
  gap: 1rem;
  margin-top: 1.3rem;
  padding: 0.95rem;
  background:
    var(--accent-soft);
  border:
    0.0625rem solid
    var(--accent-border);
  border-radius:
    var(--radius);
}

.batch-row strong,
.batch-row span {
  display: block;
}

.batch-row span {
  margin-top: 0.1rem;
  color:
    var(--text-muted);
  font-size: 0.8rem;
}

.form-footer {
  display: flex;
  min-height: 4.25rem;
  align-items: center;
  justify-content:
    space-between;
  gap: 1rem;
  margin-top: 1.3rem;
  padding-top: 1.15rem;
  border-top:
    0.0625rem solid
    var(--border);
}

.status-message {
  max-width: 34rem;
  margin: 0;
  color:
    var(--text-muted);
  font-size: 0.82rem;
}

.status-message--success {
  color: var(--accent);
}

.status-message--warning {
  color: #ffd479;
}

.status-message--error {
  color: #ff8d82;
}

.download-actions {
  display: flex;
  flex-shrink: 0;
  gap: 0.6rem;
}

.privacy-note {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  max-width: 48rem;
  margin: 1.25rem auto 0;
  color:
    var(--text-muted);
  font-size: 0.8rem;
}

.privacy-note > span {
  width: 0.58rem;
  flex: 0 0 auto;
  aspect-ratio: 1;
  margin-top: 0.3rem;
  background:
    var(--accent);
  border-radius: 50%;
  box-shadow:
    0 0 0 0.22rem
    var(--accent-soft);
}

.privacy-note p {
  margin: 0;
}

.privacy-note strong {
  color: var(--text);
}

.visually-hidden {
  position: absolute;
  width: 0.0625rem;
  height: 0.0625rem;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.button:focus-visible,
.text-button:focus-visible,
.track-button:focus-visible,
.drop-zone:focus-within {
  outline:
    0.18rem solid
    var(--accent);
  outline-offset:
    0.15rem;
}

@media (
  max-width: 60rem
) {
  .editor-workspace {
    grid-template-columns: 1fr;
  }

  .track-panel {
    position: static;
  }

  .track-list {
    display: flex;
    max-height: none;
    overflow-x: auto;
  }

  .track-list li {
    min-width: 13rem;
  }

  .track-list li + li {
    margin:
      0 0 0 0.25rem;
  }
}

@media (
  max-width: 45rem
) {
  .tag-editor-view {
    width:
      calc(100% - 1rem);
  }

  .editor-heading {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .drop-panel {
    padding: 0.4rem;
  }

  .drop-zone {
    min-height: 17rem;
    padding: 1.25rem;
  }

  .panel-heading {
    padding: 1rem;
  }

  .format-badge {
    font-size: 0.64rem;
  }

  .tag-form {
    padding: 1rem;
  }

  .editor-grid {
    grid-template-columns: 1fr;
  }

  .artwork-column {
    display: grid;
    grid-template-columns:
      minmax(8rem, 11rem)
      minmax(0, 1fr);
    align-items: start;
    gap: 0 1rem;
  }

  .cover-frame {
    grid-row: span 4;
  }

  .cover-actions {
    flex-wrap: wrap;
    margin-top: 0;
  }

  .audio-preview {
    margin-top: 0.55rem;
  }

  .fields-column {
    grid-template-columns:
      repeat(
        2,
        minmax(0, 1fr)
      );
  }

  .field,
  .field--compact {
    grid-column: span 1;
  }

  .field--wide {
    grid-column: 1 / -1;
  }

  .batch-row,
  .form-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .download-actions {
    display: grid;
  }

  .batch-row .button,
  .download-actions .button {
    width: 100%;
  }
}

@media (
  max-width: 30rem
) {
  .artwork-column {
    grid-template-columns: 1fr;
  }

  .cover-frame {
    width: min(100%, 15rem);
    grid-row: auto;
    margin-inline: auto;
  }

  .cover-actions {
    margin-top: 0.75rem;
  }

  .fields-column {
    grid-template-columns: 1fr;
  }

  .field,
  .field--compact,
  .field--wide {
    grid-column: 1;
  }
}

@media (
  prefers-reduced-motion:
    reduce
) {
  *,
  *::before,
  *::after {
    transition-duration:
      0.01ms !important;
  }
}
</style>