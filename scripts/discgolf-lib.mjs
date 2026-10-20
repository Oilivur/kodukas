// Normalization helpers for the weekly Metrix + OpenStreetMap course snapshot.
// No activity scraping: an unended layout is simply marked "active".

const isRecord = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value)

const str = (value) =>
  value === null || value === undefined ? '' : String(value).trim()

const num = (value) => {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

export function normalizedDate(value) {
  const input = str(value)
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!match || match[1] === '0000') return null
  const date = `${match[1]}-${match[2]}-${match[3]}`
  return Number.isNaN(Date.parse(date + 'T12:00:00Z')) ? null : date
}

function estoniaCoords(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) &&
    lat >= 57.4 && lat <= 59.9 && lon >= 21.4 && lon <= 28.4
}

function extractRecordArray(data, depth = 0) {
  if (depth > 7 || data === null || typeof data !== 'object') return null
  if (Array.isArray(data)) {
    if (data.some((item) => isRecord(item) && (item.ID ?? item.id) &&
        (item.Name ?? item.name ?? item.Fullname))) return data
    for (const child of data) {
      const found = extractRecordArray(child, depth + 1)
      if (found) return found
    }
    return null
  }
  const values = Object.values(data)
  if (values.length && values.every((item) => isRecord(item) &&
      (item.ID ?? item.id) && (item.Name ?? item.name ?? item.Fullname))) {
    return values
  }
  for (const child of values) {
    const found = extractRecordArray(child, depth + 1)
    if (found) return found
  }
  return null
}

export function getMetrixRows(data) {
  const records = extractRecordArray(data)
  if (!records) throw new Error('Metrix API JSON does not contain a recognized course list.')
  return records
}

function normalizeRow(item) {
  const id = str(item.ID ?? item.id)
  const parentId = str(item.ParentID ?? item.parentId)
  const fullname = str(item.Fullname ?? item.FullName ?? item.fullname)
  const name = str(item.Name ?? item.name) || fullname.split('→').at(-1)?.trim() || ''
  return {
    id,
    parentId: parentId && parentId !== '0' ? parentId : null,
    type: str(item.Type ?? item.type),
    name,
    fullname: fullname || name,
    latitude: num(item.X ?? item.Lat ?? item.lat ?? item.latitude),
    longitude: num(item.Y ?? item.Lng ?? item.lng ?? item.lon ?? item.longitude),
    county: str(item.Area ?? item.area) || null,
    locality: str(item.City ?? item.city ?? item.Location) || null,
    endedAt: normalizedDate(item.Enddate ?? item.EndDate ?? item.endDate),
  }
}

function isEnded(row, today) {
  return Boolean(row.endedAt && row.endedAt <= today)
}

function groupToCourse(group, today) {
  const parent = group.find((row) => row.type === '1')
  const layouts = group.filter((row) => row.type !== '1')
  const variants = layouts.length ? layouts : group
  const active = variants.filter((row) => !isEnded(row, today))
  const anchor = [parent, ...active, ...variants].find((row) =>
    row && estoniaCoords(row.latitude, row.longitude))
  if (!anchor) return null

  const fallbackName = (variants[0]?.fullname || variants[0]?.name || '').split('→')[0].trim()
  const name = parent?.name || fallbackName || variants[0]?.name || 'Nimetu rada'
  const closed = variants.length > 0 && variants.every((row) => isEnded(row, today))
  const endDate = closed ? variants.map((row) => row.endedAt).filter(Boolean).sort().at(-1) || null : null
  const preferred = active[0] || variants[0]
  const id = parent?.id || (preferred?.parentId && group.length > 1 ? preferred.parentId : preferred.id)

  return {
    id: `metrix:${id}`,
    name,
    latitude: anchor.latitude,
    longitude: anchor.longitude,
    county: parent?.county || preferred?.county || null,
    locality: parent?.locality || preferred?.locality || null,
    status: closed ? 'closed' : 'active',
    endDate,
    layouts: variants.map((row) => ({
      id: row.id, name: row.name, endedAt: row.endedAt,
    })).sort((a, b) => a.name.localeCompare(b.name, 'et')),
    metrixUrl: preferred ? `https://discgolfmetrix.com/course/${preferred.id}` : null,
    osmUrl: null,
  }
}

export function buildMetrixCourses(data, today = new Date().toISOString().slice(0, 10)) {
  const byId = new Map()
  for (const raw of getMetrixRows(data)) {
    const row = normalizeRow(raw)
    if (row.id && row.name && !byId.has(row.id)) byId.set(row.id, row)
  }
  const groups = new Map()
  for (const row of byId.values()) {
    const groupId = row.parentId || row.id
    if (!groups.has(groupId)) groups.set(groupId, [])
    groups.get(groupId).push(row)
  }
  return [...groups.values()].map((group) => groupToCourse(group, today)).filter(Boolean)
}

export function normalizeName(value) {
  return str(value)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/20\d{2}/g, ' ')
    .replace(/discgolfi?park|disc\s*golf|kettagolfi?park|discgol[f]?|dg\s*park/gi, ' ')
    .replace(/\b(park|rada|raja|course|valjak|asetus|layout|the|pro|am|main)\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function distanceKm(a, b) {
  const r = Math.PI / 180
  const lat = (a.latitude - b.latitude) * r
  const lon = (a.longitude - b.longitude) * r
  const x = Math.sin(lat / 2) ** 2 +
    Math.cos(a.latitude * r) * Math.cos(b.latitude * r) *
    Math.sin(lon / 2) ** 2
  return 12742 * Math.asin(Math.min(1, Math.sqrt(x)))
}

function likelySameName(left, right) {
  const a = normalizeName(left)
  const b = normalizeName(right)
  if (!a || !b) return false
  if (a === b) return true
  const partsA = a.split(' ')
  const partsB = b.split(' ')
  const common = partsA.filter((part) => partsB.includes(part))
  return common.length >= 1 && common.length / Math.min(partsA.length, partsB.length) >= 0.8 &&
    common.some((part) => part.length >= 4)
}

function osmCourse(element) {
  const tags = element.tags || {}
  const latitude = num(element.lat ?? element.center?.lat)
  const longitude = num(element.lon ?? element.center?.lon)
  const name = str(tags['name:et'] ?? tags.name)
  if (!name || !estoniaCoords(latitude, longitude)) return null
  return {
    id: `osm:${element.type}/${element.id}`,
    name, latitude, longitude,
    county: null, locality: null,
    status: 'unverified', endDate: null, layouts: [], metrixUrl: null,
    osmUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
  }
}

export function mergeOsmCourses(courses, osmData) {
  if (!Array.isArray(osmData?.elements)) return courses
  const result = [...courses]
  for (const element of osmData.elements) {
    const item = osmCourse(element)
    if (!item) continue
    const existing = result.find((course) =>
      distanceKm(course, item) < 0.6 && likelySameName(course.name, item.name))
    if (existing) {
      if (!existing.osmUrl) existing.osmUrl = item.osmUrl
    } else {
      result.push(item)
    }
  }
  return result
}

// Optional manual public overrides from data/discgolf-reports.json remain supported.
export function finalizeStatuses(courses, reports = [], today = new Date().toISOString().slice(0, 10)) {
  const reportMap = new Map(reports.map((report) => [report.id, report]))
  for (const course of courses) {
    course.status = course.endDate && course.endDate <= today
      ? 'closed' : course.metrixUrl ? 'active' : 'unverified'
    const manual = reportMap.get(course.id)
    if (manual && normalizedDate(manual.checkedAt) &&
      ['verified', 'reported', 'closed'].includes(manual.status) &&
      str(manual.sourceUrl).startsWith('https://')) {
      course.status = manual.status
    }
  }
  return courses.sort((a, b) => a.name.localeCompare(b.name, 'et'))
}

// ID-based exclusions survive every scrape, including when course names change.
export function excludeCourses(courses, excludedIds = []) {
  if (!Array.isArray(excludedIds) || excludedIds.some((id) => typeof id !== 'string')) {
    throw new Error('data/discgolf-excluded.json must be an array of ID strings.')
  }
  const excluded = new Set(excludedIds)
  return courses.filter((course) => !excluded.has(course.id))
}
