import type { DiscGolfData } from '@/types/discgolf'

export async function loadDiscGolfCourses(): Promise<DiscGolfData> {
  // BASE_URL is important for GitHub Pages project paths as well as custom domains.
  const url = `${import.meta.env.BASE_URL}data/discgolf-courses.json`
  const response = await fetch(url, { cache: 'no-cache' })

  if (!response.ok) {
    throw new Error(`Rajainfo päring ebaõnnestus (HTTP ${response.status}).`)
  }

  const result: unknown = await response.json()

  if (
    !result ||
    typeof result !== 'object' ||
    !('courses' in result) ||
    !Array.isArray(result.courses)
  ) {
    throw new Error('Rajainfo fail ei ole õiges vormingus.')
  }

  return result as DiscGolfData
}
