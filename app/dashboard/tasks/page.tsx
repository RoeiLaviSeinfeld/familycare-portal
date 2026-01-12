import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TasksClient from './TasksClient'

export default async function TasksPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/auth/login')

  // Get family members
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', member.family_id)

  // Get tasks
  const { data: tasks } = await supabase
    .from('tasks')
    .select('*, owner:family_members(*)')
    .eq('family_id', member.family_id)
    .order('priority')
    .order('created_at', { ascending: false })

  return (
    <TasksClient
      member={member}
      familyMembers={familyMembers || []}
      tasks={tasks || []}
    />
  )
}
