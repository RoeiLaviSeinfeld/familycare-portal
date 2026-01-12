import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/auth/login')

  // Get all family members if admin
  let familyMembers = []
  if (member.role === 'admin') {
    const { data } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', member.family_id)
      .order('is_mother', { ascending: false })
    familyMembers = data || []
  }

  return (
    <SettingsClient
      member={member}
      familyMembers={familyMembers}
    />
  )
}
