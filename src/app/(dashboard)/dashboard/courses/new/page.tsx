import { CourseForm } from '@/components/courses/CourseForm'
import { requireRole } from '@/lib/auth'

export default async function NewCoursePage() {
  await requireRole(['super_admin', 'manager'])
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Create new course</h1>
      <CourseForm />
    </div>
  )
}
