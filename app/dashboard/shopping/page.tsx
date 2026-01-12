import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ShoppingClient from './ShoppingClient'

export default async function ShoppingPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) redirect('/auth/login')

  // Get shopping items
  const { data: items } = await supabase
    .from('shopping_items')
    .select('*, assigned:family_members(*), creator:family_members!created_by(*)')
    .eq('family_id', member.family_id)
    .order('status')
    .order('priority')
    .order('created_at', { ascending: false })

  return (
    <ShoppingClient
      member={member}
      items={items || []}
    />
  )
}
