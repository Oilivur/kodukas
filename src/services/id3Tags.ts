import { ID3Writer } from 'browser-id3-writer'
import jsmediatags from 'jsmediatags/dist/jsmediatags.min.js'

export type CoverData = {
  data: ArrayBuffer
  mimeType: string
}

export type EditableTrack = {
  id: number
  file: File
  title: string
  artist: string
  albumArtist: string
  album: string
  trackNumber: string
  discNumber: string
  year: string
  genre: string
  comment: string
  outputName: string
  cover: CoverData | null
  readWarning: string
}

type UnknownRecord = Record<string, unknown>

type PictureTag = {
  data?: ArrayLike<number>
  format?: string
}

function valueAsText(value: unknown): string {
  if (
    value === undefined ||
    value === null
  ) {
    return ''
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number'
  ) {
    return String(value)
  }

  if (
    typeof value === 'object'
  ) {
    const record =
      value as UnknownRecord

    if (
      typeof record.text ===
      'string'
    ) {
      return record.text
    }

    if (
      typeof record.data ===
      'string' ||
      typeof record.data ===
      'number'
    ) {
      return String(
        record.data,
      )
    }
  }

  return ''
}

function valueAsYear(
  value: unknown,
) {
  const text =
    valueAsText(value)
  const fourDigits =
    text.match(/^\d{4}/)

  return fourDigits?.[0] ?? text
}

function filenameDetails(
  filename: string,
) {
  const base = filename
    .replace(/\.mp3$/i, '')
    .trim()

  const numbered =
    base.match(
      /^\s*(\d{1,3})[\s._-]+(.+)$/,
    )

  if (numbered) {
    return {
      title:
        numbered[2].trim(),
      trackNumber: String(
        Number(numbered[1]),
      ),
    }
  }

  return {
    title: base,
    trackNumber: '',
  }
}

function normalisePicture(
  value: unknown,
): CoverData | null {
  if (
    !value ||
    typeof value !== 'object'
  ) {
    return null
  }

  const picture =
    value as PictureTag

  if (
    !picture.data ||
    picture.data.length === 0
  ) {
    return null
  }

  const bytes =
    Uint8Array.from(
      picture.data,
    )

  return {
    data:
      bytes.buffer as ArrayBuffer,
    mimeType:
      picture.format ||
      'image/jpeg',
  }
}

function readTags(
  file: File,
): Promise<UnknownRecord> {
  return new Promise(
    (resolve, reject) => {
      jsmediatags.read(
        file,
        {
          onSuccess: (
            result,
          ) => {
            resolve(
              result.tags || {},
            )
          },
          onError: reject,
        },
      )
    },
  )
}

export function isMp3(
  file: File,
) {
  return (
    file.type ===
      'audio/mpeg' ||
    /\.mp3$/i.test(
      file.name,
    )
  )
}

export async function readTrack(
  file: File,
  id: number,
): Promise<EditableTrack> {
  const fallback =
    filenameDetails(
      file.name,
    )

  let tags: UnknownRecord = {}
  let readWarning = ''

  try {
    tags =
      await readTags(file)
  } catch (error) {
    console.warn(
      'Could not read MP3 tags:',
      error,
    )

    readWarning =
      'Existing tags could not be read, so filename details were used.'
  }

  return {
    id,
    file,
    title:
      valueAsText(
        tags.title,
      ) || fallback.title,
    artist: valueAsText(
      tags.artist,
    ),
    albumArtist:
      valueAsText(
        tags.TPE2,
      ),
    album: valueAsText(
      tags.album,
    ),
    trackNumber:
      valueAsText(
        tags.track,
      ) ||
      fallback.trackNumber,
    discNumber:
      valueAsText(
        tags.TPOS,
      ),
    year: valueAsYear(
      tags.year,
    ),
    genre: valueAsText(
      tags.genre,
    ),
    comment: valueAsText(
      tags.comment,
    ),
    outputName: file.name,
    cover: normalisePicture(
      tags.picture,
    ),
    readWarning,
  }
}

function setTextFrame(
  writer: ID3Writer,
  frame:
    | 'TIT2'
    | 'TALB'
    | 'TPE2'
    | 'TRCK'
    | 'TPOS',
  value: string,
) {
  const cleaned =
    value.trim()

  if (cleaned) {
    writer.setFrame(
      frame,
      cleaned,
    )
  }
}

export async function createTaggedMp3(
  track: EditableTrack,
) {
  const source =
    await track.file.arrayBuffer()

  const writer =
    new ID3Writer(source)

  setTextFrame(
    writer,
    'TIT2',
    track.title,
  )
  setTextFrame(
    writer,
    'TALB',
    track.album,
  )
  setTextFrame(
    writer,
    'TPE2',
    track.albumArtist,
  )
  setTextFrame(
    writer,
    'TRCK',
    track.trackNumber,
  )
  setTextFrame(
    writer,
    'TPOS',
    track.discNumber,
  )

  if (track.artist) {
    writer.setFrame(
      'TPE1',
      [track.artist],
    )
  }

  if (track.genre) {
    writer.setFrame(
      'TCON',
      [track.genre],
    )
  }

  if (track.year) {
    writer.setFrame(
      'TYER',
      Number(track.year),
    )
  }

  if (track.comment) {
    writer.setFrame(
      'COMM',
      {
        description: '',
        text: track.comment,
        language: 'eng',
      },
    )
  }

  if (track.cover) {
    writer.setFrame(
      'APIC',
      {
        type: 3,
        data:
          track.cover.data,
        description:
          'Cover',
      },
    )
  }

  writer.addTag()

  return writer.getBlob()
}

export function safeMp3Filename(
  filename: string,
) {
  const cleaned =
    (filename ||
      'tagged-song.mp3')
      .replace(
        /[<>:"/\\|?*\u0000-\u001F]/g,
        '_',
      )
      .replace(
        /[. ]+$/g,
        '',
      )
      .trim()

  const withName =
    cleaned ||
    'tagged-song.mp3'

  return /\.mp3$/i.test(
    withName,
  )
    ? withName
    : `${withName}.mp3`
}

export function formatFileSize(
  bytes: number,
) {
  const units = [
    'B',
    'KB',
    'MB',
    'GB',
  ]

  let size = bytes
  let unitIndex = 0

  while (
    size >= 1024 &&
    unitIndex <
      units.length - 1
  ) {
    size /= 1024
    unitIndex += 1
  }

  const digits =
    unitIndex === 0 ||
    size >= 10
      ? 0
      : 1

  return `${size.toFixed(
    digits,
  )} ${units[unitIndex]}`
}
