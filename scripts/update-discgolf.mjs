/**
 * Builds a static Estonia disc golf map snapshot from Metrix and OpenStreetMap.
 * Usage: node scripts/update-discgolf.mjs
 *
 * No per-course activity scraping; unended Metrix layouts are marked 'active'.
 * Manual exclusions in data/discgolf-excluded.json are applied on every run.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildMetrixCourses, mergeOsmCourses, finalizeStatuses, excludeCourses,
} from './discgolf-lib.mjs'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = path.join(root, 'public', 'data', 'discgolf-courses.json')
const reportsPath = path.join(root, 'data', 'discgolf-reports.json')
const excludedPath = path.join(root, 'data', 'discgolf-excluded.json')
const today = new Date().toISOString().slice(0, 10)

const METRIX = 'https://discgolfmetrix.com/api.php?content=courses_list&country_code=EE'
const OVERPASS = 'https://overpass-api.de/api/interpreter'
const OVERPASS_QUERY = `[out:json][timeout:55];
area["ISO3166-1"="EE"][admin_level=2]->.estonia;
(nwr["leisure"="disc_golf_course"](area.estonia););
out center tags;`

async function fetchText(url, options = {}, timeout = 75_000) {
  const response = await fetch(url, {
    ...options,
    signal: AbortSignal.timeout(timeout),
    headers: {
      'User-Agent': 'KodukasDiscGolfMap/2.0 (weekly static course index)',
      'Accept': 'application/json,*/*;q=0.5',
      ...options.headers,
    },
  })
  if (!response.ok) throw new Error(`${new URL(url).host} HTTP ${response.status}`)
  return response.text()
}

async function readJson(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')) }
  catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function main() {
  const reports = await readJson(reportsPath, [])
  const excluded = await readJson(excludedPath, [])
  if (!Array.isArray(reports)) throw new Error('data/discgolf-reports.json must be an array.')
  if (!Array.isArray(excluded)) throw new Error('data/discgolf-excluded.json must be an array.')

  console.log('Loading Estonian courses from Metrix...')
  const metrixText = await fetchText(METRIX)
  let metrixData
  try { metrixData = JSON.parse(metrixText) }
  catch { throw new Error('Metrix did not return JSON. Existing snapshot kept.') }
  let courses = buildMetrixCourses(metrixData, today)
  if (courses.length < 15) {
    throw new Error(`Suspiciously small Metrix list (${courses.length}); snapshot kept.`)
  }
  console.log(`Found ${courses.length} Metrix course locations.`)

  try {
    const osmText = await fetchText(OVERPASS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ data: OVERPASS_QUERY }).toString(),
    })
    const before = courses.length
    courses = mergeOsmCourses(courses, JSON.parse(osmText))
    console.log(`Added ${courses.length - before} OSM locations.`)
  } catch (error) {
    console.warn(`OSM not available, using Metrix only: ${error.message}`)
  }

  finalizeStatuses(courses, reports, today)
  courses = excludeCourses(courses, excluded)

  const snapshot = {
    updatedAt: new Date().toISOString(),
    sources: [METRIX, 'https://www.openstreetmap.org/copyright'],
    courses,
  }
  await fs.mkdir(path.dirname(outputPath), { recursive: true })
  await fs.writeFile(outputPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8')
  console.log(`Wrote ${courses.length} locations (${excluded.length} IDs excluded).`)
}

main().catch((error) => {
  console.error('Course update failed:', error.message)
  process.exitCode = 1
})
