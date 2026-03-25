export type UserRole = 'super_admin' | 'manager' | 'coordinator' | 'viewer'
export type CourseStatus = 'draft' | 'scheduled' | 'in_progress' | 'completed' | 'archived'
export type FlagSeverity = 'info' | 'warning' | 'critical' | 'emergency'
export type FlagStatus = 'open' | 'acknowledged' | 'in_progress' | 'resolved'
export type FlagCategory = 'trainer_issue' | 'venue_issue' | 'equipment_failure' | 'low_turnout' | 'medical_emergency' | 'other'
export type CheckinType = 'in' | 'out'
export type AttendanceSession = 'day1_am' | 'day1_pm' | 'day2_am' | 'day2_pm'

export interface Profile {
  id: string; email: string; full_name: string; full_name_ar: string
  role: UserRole; phone: string | null; is_active: boolean; created_at: string
}
export interface City {
  id: string; name_en: string; name_ar: string
  region_en: string; region_ar: string; lat: number; lng: number
}
export interface Course {
  id: string; title_en: string; title_ar: string; city_id: string
  city?: City; venue: string; day1_date: string; day2_date: string
  trainer_name: string; capacity: number; status: CourseStatus
  course_type: string; created_by: string; created_at: string; updated_at: string
}
export interface CourseAssignment {
  id: string; course_id: string; coordinator_id: string
  coordinator?: Profile; assigned_at: string
}
export interface ChecklistItem {
  id: string; course_id: string; phase: 'pre' | 'during' | 'post'
  title_en: string; title_ar: string; description: string | null
  requires_photo: boolean; is_completed: boolean
  completed_by: string | null; completed_at: string | null
  photo_url: string | null; order_index: number
}
export interface Flag {
  id: string; course_id: string; course?: Course
  raised_by: string; raised_by_profile?: Profile
  severity: FlagSeverity; category: FlagCategory
  description: string; photo_url: string | null
  status: FlagStatus; acknowledged_by: string | null
  resolved_by: string | null; resolved_by_profile?: Profile
  resolved_at: string | null; resolution_notes: string | null
  escalated_from: FlagSeverity | null; escalated_at: string | null
  created_at: string; updated_at: string
}
export interface Checkin {
  id: string; course_id: string; coordinator_id: string
  day: 1 | 2; type: CheckinType; lat: number; lng: number
  is_valid: boolean; distance_meters: number; created_at: string
}
export interface Trainee {
  id: string; course_id: string; full_name_en: string; full_name_ar: string
  national_id_last4: string; phone: string; email: string | null
  consent_given: boolean; consent_given_at: string | null; created_at: string
}
export interface Attendance {
  id: string; trainee_id: string; course_id: string
  session: AttendanceSession; is_present: boolean
  marked_by: string; marked_at: string
}
export interface Certificate {
  id: string; trainee_id: string; trainee?: Trainee
  course_id: string; course?: Course
  verification_code: string; pdf_url: string | null
  generated_by: string; generated_at: string; version: number
}

export interface AuditLog {
  id: string
  user_id: string | null
  user?: Profile
  action: string
  table_name: string
  record_id: string | null
  old_values: Record<string, any> | null
  new_values: Record<string, any> | null
  ip_address: string | null
  created_at: string
}
