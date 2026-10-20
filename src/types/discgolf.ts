export type CourseStatus = 'active' | 'unverified' | 'verified' | 'reported' | 'closed'

export interface DiscGolfLayout {
  id: string
  name: string
  endedAt: string | null
}

export interface DiscGolfCourse {
  id: string
  name: string
  latitude: number
  longitude: number
  county: string | null
  locality: string | null
  status: CourseStatus
  endDate: string | null
  layouts: DiscGolfLayout[]
  metrixUrl: string | null
  osmUrl: string | null
}

export interface DiscGolfData {
  updatedAt: string | null
  courses: DiscGolfCourse[]
  sources: string[]
}

export interface PersonalCourseMark {
  status: 'played' | 'problem' | null
  date: string
  note: string
}
