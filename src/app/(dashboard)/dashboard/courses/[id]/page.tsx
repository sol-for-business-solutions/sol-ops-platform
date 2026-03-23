import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CourseDetailClient } from '@/components/courses/CourseDetailClient'
import { getProfile } from '@/lib/auth'

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const profile = await getProfile()
  const { data: course, error } = await supabase.from('courses')
    .select('*, city:cities(*), course_assignments(id, coordinator:profiles!course_assignments_coordinator_id_fkey(id, full_name, full_name_ar, email, phone))')
    .eq('id', id).single()
  if (error || !course) notFound()
  const { data: coordinators } = await supabase.from('profiles')
    .select('id, full_name, full_name_ar, email, phone, role, is_active, created_at')
    .eq('role', 'coordinator').eq('is_active', true)
  return <CourseDetailClient course={course} allCoordinators={coordinators ?? []} role={profile?.role ?? 'viewer'} />
}
