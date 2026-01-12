import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MomDashboard from '@/components/dashboard/MomDashboard'

export default async function MomPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/auth/login')

  // Get all family members
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', member.family_id)

  // Get today's rotation
  const today = new Date().toISOString().split('T')[0]
  const { data: todayRotation } = await supabase
    .from('rotation_schedule')
    .select('*, assigned_member:family_members(*)')
    .eq('family_id', member.family_id)
    .eq('date', today)
    .single()

  // Get weekend rotation (for shopping)
  const dayOfWeek = new Date().getDay()
  const daysUntilFriday = dayOfWeek <= 5 ? 5 - dayOfWeek : 6
  const friday = new Date()
  friday.setDate(friday.getDate() + daysUntilFriday)
  const fridayStr = friday.toISOString().split('T')[0]
  
  const { data: weekendRotation } = await supabase
    .from('rotation_schedule')
    .select('*, assigned_member:family_members(*)')
    .eq('family_id', member.family_id)
    .eq('date', fridayStr)
    .single()

  // Get upcoming events (next 7 days)
  const nextWeek = new Date()
  nextWeek.setDate(nextWeek.getDate() + 7)
  const { data: upcomingEvents } = await supabase
    .from('events')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('visible_to_mother', true)
    .gte('start_datetime', today)
    .lte('start_datetime', nextWeek.toISOString())
    .order('start_datetime')
    .limit(5)

  // Get upcoming holidays (next 30 days)
  const nextMonth = new Date()
  nextMonth.setDate(nextMonth.getDate() + 30)
  const { data: upcomingHolidays } = await supabase
    .from('israeli_holidays')
    .select('*')
    .gte('date', today)
    .lte('date', nextMonth.toISOString().split('T')[0])
    .order('date')
    .limit(3)

  // Get medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('is_active', true)

  // Get today's doses
  const { data: todayDoses } = await supabase
    .from('med_dose_logs')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('date', today)

  // Get gallery photos
  const { data: photos } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('is_active', true)
    .order('display_order')

  // Get unread messages
  const { data: messages } = await supabase
    .from('mom_messages')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('is_read', false)
    .order('created_at', { ascending: false })

  // Get display settings
  const { data: displaySettings } = await supabase
    .from('mom_display_settings')
    .select('*')
    .eq('family_id', member.family_id)
    .single()

  return (
    <MomDashboard
      member={member}
      familyMembers={familyMembers || []}
      todayRotation={todayRotation}
      weekendRotation={weekendRotation}
      upcomingEvents={upcomingEvents || []}
      upcomingHolidays={upcomingHolidays || []}
      medications={medications || []}
      todayDoses={todayDoses || []}
      photos={photos || []}
      messages={messages || []}
      displaySettings={displaySettings}
    />
  )
}
