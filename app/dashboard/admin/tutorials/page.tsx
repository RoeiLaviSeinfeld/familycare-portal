import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TutorialsManager from './TutorialsManager'

export default async function TutorialsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member || member.role !== 'admin') {
    redirect('/dashboard')
  }

  // Get categories
  const { data: categories } = await supabase
    .from('tutorial_categories')
    .select('*')
    .eq('family_id', member.family_id)
    .order('display_order')

  // Get tutorials
  const { data: tutorials } = await supabase
    .from('tutorials')
    .select('*, category:tutorial_categories(*)')
    .eq('family_id', member.family_id)
    .order('created_at', { ascending: false })

  return (
    <TutorialsManager
      member={member}
      categories={categories || []}
      tutorials={tutorials || []}
    />
  )
}
