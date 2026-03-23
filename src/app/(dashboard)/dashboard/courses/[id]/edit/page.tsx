import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CourseForm } from '@/components/courses/CourseForm'

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: course, error } = await supabase.from('courses').select('*').eq('id', id).single()
  if (error || !course) notFound()
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-gray-900 mb-6">Edit course</h1>
      <CourseForm course={course} />
    </div>
  )
}
