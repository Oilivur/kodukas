import test from 'node:test'
import assert from 'node:assert/strict'
import {
  buildMetrixCourses, mergeOsmCourses, finalizeStatuses, excludeCourses,
  getMetrixRows,
} from '../scripts/discgolf-lib.mjs'

const metrix = { Courses: [
  { ID: '10', ParentID: null, Type: '1', Name: 'Kurna DiscGolfPark',
    X: '59.338635189294735', Y: '24.843376287954044', Area: 'Harju Maakond' },
  { ID: '11', ParentID: '10', Type: '2', Name: '18 korvi',
    X: '59.338635', Y: '24.843376', Enddate: null },
  { ID: '12', ParentID: '10', Type: '2', Name: 'Vana asetus',
    X: '59.338635', Y: '24.843376', Enddate: '2022-07-01' },
  { ID: '13', ParentID: null, Type: '2', Name: 'Vana rada',
    X: '58.32', Y: '25.2', Enddate: '2020-02-14' },
  { ID: '14', ParentID: null, Type: '2', Name: 'Wrong coordinates',
    X: '23', Y: '59', Enddate: null },
] }

test('parent and layouts form one stable ID; active layouts imply active listing', () => {
  assert.equal(getMetrixRows(metrix).length, 5)
  const courses = buildMetrixCourses(metrix, '2026-10-19')
  assert.equal(courses.length, 2)
  const kurna = courses.find((course) => course.id === 'metrix:10')
  assert.equal(kurna.layouts.length, 2)
  assert.equal(kurna.latitude, 59.338635189294735)
  assert.equal(kurna.status, 'active')
  assert.equal(kurna.metrixUrl, 'https://discgolfmetrix.com/course/11')
  assert.equal(courses.find((course) => course.id === 'metrix:13').status, 'closed')
})

test('OSM matches Metrix by location and name; OSM-only locations are unknown', () => {
  const courses = buildMetrixCourses(metrix, '2026-10-19')
  const result = mergeOsmCourses(courses, { elements: [
    { type: 'node', id: 500, lat: 59.3384, lon: 24.844, tags: { name: 'Kurna DiscGolfPark' } },
    { type: 'node', id: 501, lat: 58.98, lon: 24.8, tags: { name: 'Lisapark' } },
  ] })
  assert.equal(result.length, 3)
  assert.ok(result.find((course) => course.id === 'metrix:10').osmUrl)
  assert.equal(result.find((course) => course.id === 'osm:node/501').status, 'unverified')
})

test('reports override active status without needing activity events', () => {
  const courses = buildMetrixCourses(metrix, '2026-10-19')
  finalizeStatuses(courses, [{
    id: 'metrix:10', status: 'reported', checkedAt: '2026-10-18',
    sourceUrl: 'https://example.com/report',
  }], '2026-10-19')
  assert.equal(courses.find((course) => course.id === 'metrix:10').status, 'reported')
})

test('hidden IDs stay excluded after rebuilding a new weekly snapshot', () => {
  const blocked = ['metrix:10', 'osm:node/501']
  const first = mergeOsmCourses(buildMetrixCourses(metrix, '2026-10-19'), { elements: [
    { type: 'node', id: 501, lat: 58.98, lon: 24.8, tags: { name: 'Lisapark' } },
  ] })
  const second = buildMetrixCourses(metrix, '2026-10-26')
  assert.deepEqual(excludeCourses(first, blocked).map((c) => c.id), ['metrix:13'])
  assert.deepEqual(excludeCourses(second, blocked).map((c) => c.id), ['metrix:13'])
  assert.throws(() => excludeCourses(first, ['metrix:10', 501]), /ID strings/)
})
