import type {
  LocationName,
} from '@/types/location'

import type {
  MapWeatherPoint,
} from '@/types/weather'

const GEOCODER_URL =
  'https://inaadress.maaamet.ee/geocoder-api/api/plain'

interface GeocoderRow {
  normaddress?:
    string | null

  type?:
    string | null

  name1?:
    string | null

  name2?:
    string | null

  name3?:
    string | null

  name4?:
    string | null

  name5?:
    string | null

  name6?:
    string | null

  name7?:
    string | null

  name8?:
    string | null

  b?:
    number | null

  l?:
    number | null

  lestx?:
    number | null

  lesty?:
    number | null

  message?:
    string | null

  nearest?:
    string | null
}

interface GeocoderGroup {
  id?:
    number

  search?:
    string

  rows?:
    GeocoderRow[] | null
}

interface GeocoderResponse {
  requestId?:
    string

  group?:
    GeocoderGroup | null
}

function cleanName(
  value:
    string | null | undefined,
): string | null {
  const cleaned =
    value?.trim()

  return cleaned
    ? cleaned
    : null
}

function mapLocation(
  row: GeocoderRow,
): LocationName | null {
  const county =
    cleanName(
      row.name1,
    )

  const municipality =
    cleanName(
      row.name2,
    )

  const settlement =
    cleanName(
      row.name3,
    )

  console.log(
    '[location] Parsed address levels:',
    {
      county,
      municipality,
      settlement,

      allLevels: {
        name1:
        row.name1,

        name2:
        row.name2,

        name3:
        row.name3,

        name4:
        row.name4,

        name5:
        row.name5,

        name6:
        row.name6,

        name7:
        row.name7,

        name8:
        row.name8,
      },
    },
  )

  const primary =
    settlement ??
    municipality ??
    county

  if (!primary) {
    console.warn(
      '[location] Row had no usable name1/name2/name3:',
      row,
    )

    return null
  }

  const secondaryParts =
    [
      municipality,
      county,
    ].filter(
      (
        value,
      ): value is string =>
        value !== null &&
        value !== primary,
    )

  return {
    primary,

    secondary:
      secondaryParts.length > 0
        ? secondaryParts.join(
          ' · ',
        )
        : null,

    county,

    municipality,

    settlement,
  }
}

function findUsefulLocation(
  response:
  GeocoderResponse,
): LocationName | null {
  const rows =
    response.group?.rows ??
    []

  console.log(
    '[location] Result row count:',
    rows.length,
  )

  console.log(
    '[location] Result rows:',
    rows,
  )

  for (
    const row of rows
    ) {
    const location =
      mapLocation(row)

    if (location) {
      console.log(
        '[location] Selected location:',
        location,
      )

      return location
    }
  }

  console.warn(
    '[location] No usable location found in response',
    response,
  )

  return null
}

async function requestCoordinates(
  coord1: number,
  coord2: number,
  label: string,
  signal?:
  AbortSignal,
): Promise<GeocoderResponse> {
  const requestBody = {
    coord1,
    coord2,
  }

  console.groupCollapsed(
    `[location] Maa- ja Ruumiamet request — ${label}`,
  )

  console.log(
    'URL:',
    GEOCODER_URL,
  )

  console.log(
    'Request body:',
    requestBody,
  )

  const response =
    await fetch(
      GEOCODER_URL,
      {
        method:
          'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify(
            requestBody,
          ),

        signal,
      },
    )

  console.log(
    'HTTP status:',
    response.status,
    response.statusText,
  )

  const text =
    await response.text()

  console.log(
    'Raw response:',
    text,
  )

  console.groupEnd()

  if (!response.ok) {
    throw new Error(
      `Location request failed (${response.status}): ${text}`,
    )
  }

  let data:
    unknown

  try {
    data =
      JSON.parse(text)
  } catch {
    throw new Error(
      'Location API returned invalid JSON',
    )
  }

  console.log(
    '[location] Parsed API response:',
    data,
  )

  return data as
    GeocoderResponse
}

function isAbortError(
  error: unknown,
): boolean {
  return (
    error instanceof
    DOMException &&
    error.name ===
    'AbortError'
  )
}

export async function reverseGeocodeLocation(
  point:
  MapWeatherPoint,

  signal?:
  AbortSignal,
): Promise<LocationName | null> {
  console.group(
    '[location] Reverse geocode click',
  )

  console.log(
    'Clicked WGS84 point:',
    {
      latitude:
      point.latitude,

      longitude:
      point.longitude,
    },
  )

  console.groupEnd()

  /*
   * Test latitude / longitude first.
   */
  try {
    const response =
      await requestCoordinates(
        point.latitude,
        point.longitude,
        'latitude → longitude',
        signal,
      )

    const location =
      findUsefulLocation(
        response,
      )

    if (location) {
      return location
    }
  } catch (error) {
    if (
      isAbortError(
        error,
      )
    ) {
      throw error
    }

    console.warn(
      '[location] Lat/lon request failed:',
      error,
    )
  }

  /*
   * Then test the reverse ordering,
   * because the API calls the fields coord1/coord2
   * rather than latitude/longitude.
   */
  try {
    const response =
      await requestCoordinates(
        point.longitude,
        point.latitude,
        'longitude → latitude',
        signal,
      )

    const location =
      findUsefulLocation(
        response,
      )

    if (!location) {
      console.warn(
        '[location] Neither coordinate ordering produced a usable location.',
      )
    }

    return location
  } catch (error) {
    if (
      isAbortError(
        error,
      )
    ) {
      throw error
    }

    console.error(
      '[location] Lon/lat request failed:',
      error,
    )

    return null
  }
}