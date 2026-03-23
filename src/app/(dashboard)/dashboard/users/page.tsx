import { requireRole } from '@/lib/auth'
import { UserManageClient } from '@/components/users/UserManageClient'

export default async function UsersPage() {
  await requireRole(['super_admin'])
  return <UserManageClient />
}
