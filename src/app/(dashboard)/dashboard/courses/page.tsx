import { CourseListClient } from '@/components/courses/CourseListClient'
import { getProfile } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function CoursesPage() {
  const profile = await getProfile()
  if (!profile) redirect('/login')
  return <CourseListClient role={profile.role} />
}
