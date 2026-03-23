import type { FlagCategory } from '@/types'

export interface Playbook {
  category: FlagCategory; title: string; severity: string
  steps: string[]; contacts?: string[]
}

export const PLAYBOOKS: Record<string, Playbook> = {
  trainer_issue: {
    category: 'trainer_issue', title: 'Trainer No-Show', severity: 'emergency',
    steps: [
      'Call the trainer immediately on their registered number',
      'If no answer within 5 minutes, notify HQ Operations Manager via SMS',
      'Access the backup trainer contact list in your coordinator app',
      'Contact backup trainer and confirm their availability',
      'If unresolved within 30 minutes, prepare trainees for potential reschedule',
      'HQ will send SMS to trainees if reschedule is required',
      'Document the full incident with timestamps in the flag notes',
    ],
    contacts: ['HQ Operations Manager', 'Backup Trainer Pool'],
  },
  venue_issue: {
    category: 'venue_issue', title: 'Venue Access Denied', severity: 'critical',
    steps: [
      'Show the hotel booking confirmation email on your phone',
      'Request to speak with the hotel duty manager (not front desk)',
      'Take a photo of the booking confirmation for documentation',
      'Contact HQ immediately — they have a hotel liaison contact',
      'HQ will call the hotel corporate account representative',
      'Identify an alternative room on the same floor if available',
      'Document everything with photos and timestamps',
    ],
    contacts: ['Hotel Duty Manager', 'HQ Hotel Liaison'],
  },
  equipment_failure: {
    category: 'equipment_failure', title: 'Equipment Failure', severity: 'warning',
    steps: [
      'Attempt basic troubleshooting — restart the device, check power cables',
      'Contact the hotel AV/IT support desk',
      'Check if backup equipment is available on-site',
      'If unresolved within 15 minutes, raise flag to Critical level',
      'Trainer can continue with whiteboard/handouts as temporary solution',
      'Document the equipment issue with a photo',
    ],
    contacts: ['Hotel AV Support', 'HQ Operations'],
  },
  low_turnout: {
    category: 'low_turnout', title: 'Low Trainee Turnout (<50%)', severity: 'warning',
    steps: [
      'Verify that all trainee notification SMSs were sent before the course',
      'Call or SMS absent trainees directly from the registered phone numbers',
      'Check if there are any transport or regional issues affecting attendance',
      'Report the current attendance count to HQ Operations Manager',
      'Proceed with the available trainees — do not delay course start beyond 20 min',
      'HQ will decide if the course should be rescheduled based on attendance',
    ],
    contacts: ['HQ Operations Manager'],
  },
  medical_emergency: {
    category: 'medical_emergency', title: 'Medical Emergency', severity: 'emergency',
    steps: [
      'Call Saudi emergency services immediately: 997 (Ambulance) or 911',
      'Do NOT move the person unless they are in immediate physical danger',
      'Administer basic first aid if you are trained — otherwise keep them calm',
      'Clear the area around the person and ask others to step back',
      'Notify HQ Operations Manager immediately via phone call (not SMS)',
      'Stay with the person until emergency services arrive',
      'File a full written incident report after the situation is resolved',
    ],
    contacts: ['Saudi Emergency Services: 997', 'HQ Operations Manager'],
  },
  other: {
    category: 'other', title: 'General Issue', severity: 'info',
    steps: [
      'Document the issue clearly with a description and photos if applicable',
      'Assess the severity — does it affect course delivery?',
      'If it affects course delivery, escalate immediately to HQ',
      'If it can be resolved independently, attempt resolution first',
      'Update the flag notes with all steps taken',
      'Keep HQ informed of the outcome',
    ],
    contacts: ['HQ Operations Manager'],
  },
}
