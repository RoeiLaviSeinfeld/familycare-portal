import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GalleryManager from './GalleryManager'

export default async function GalleryPage() {
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

  // Get photos
  const { data: photos } = await supabase
    .from('gallery_photos')
    .select('*')
    .eq('family_id', member.family_id)
    .order('display_order')

  return (
    <GalleryManager
      member={member}
      photos={photos || []}
    />
  )
}
