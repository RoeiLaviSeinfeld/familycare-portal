import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MedicationsClient from './MedicationsClient'

export default async function MedicationsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/auth/login')

  // Get medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('is_active', true)
    .order('time_window')

  // Get today's dose logs
  const today = new Date().toISOString().split('T')[0]
  const { data: todayDoses } = await supabase
    .from('med_dose_logs')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('date', today)

  // Get today's rotation
  const { data: todayRotation } = await supabase
    .from('rotation_schedule')
    .select('*, assigned_member:family_members(*)')
    .eq('family_id', member.family_id)
    .eq('date', today)
    .single()

  return (
    <MedicationsClient
      member={member}
      medications={medications || []}
      todayDoses={todayDoses || []}
      todayRotation={todayRotation}
    />
  )
}
