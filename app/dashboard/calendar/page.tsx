import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CalendarClient from './CalendarClient'

export default async function CalendarPage() {
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

  // Get rotation schedule for current month and next
  const today = new Date()
  const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
  const endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0).toISOString().split('T')[0]
  
  const { data: rotationSchedule } = await supabase
    .from('rotation_schedule')
    .select('*, assigned_member:family_members(*)')
    .eq('family_id', member.family_id)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  // Get events
  const { data: events } = await supabase
    .from('events')
    .select('*, responsible_member:family_members(*)')
    .eq('family_id', member.family_id)
    .gte('start_datetime', startDate)
    .order('start_datetime')

  // Get holidays
  const { data: holidays } = await supabase
    .from('israeli_holidays')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  return (
    <CalendarClient
      member={member}
      familyMembers={familyMembers || []}
      rotationSchedule={rotationSchedule || []}
      events={events || []}
      holidays={holidays || []}
    />
  )
}
