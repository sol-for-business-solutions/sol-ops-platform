import { requireRole } from '@/lib/auth'
import { PDPLClient } from '@/components/users/PDPLClient'

export default async function PDPLPage() {
  await requireRole(['super_admin'])
  return <PDPLClient />
}
