import { getSession } from '@/lib/auth'

export default async function Dashboard() {
  const session = await getSession()
  if (!session) return <div>Not authenticated</div>
  return <> this a dashboard and the user id is :{session.userId}</>
}
