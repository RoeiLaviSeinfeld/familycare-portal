import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardClient from './DashboardClient'

export default async function DashboardPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/auth/login')
  }

  // Get current user's family member data
  const { data: member } = await supabase
    .from('family_members')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!member) {
    // User not in allowlist
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">אין הרשאה</h1>
          <p className="text-gray-500">המשתמש שלך לא נמצא ברשימת המשפחה המורשית.</p>
          <p className="text-sm text-gray-400 mt-4">{user.email}</p>
        </div>
      </div>
    )
  }

  // Redirect mom to her special dashboard
  if (member.is_mother) {
    redirect('/mom')
  }

  // Get all family members
  const { data: familyMembers } = await supabase
    .from('family_members')
    .select('*')
    .eq('family_id', member.family_id)
    .order('is_mother', { ascending: false })

  // Get today's rotation
  const today = new Date().toISOString().split('T')[0]
  const { data: todayRotation } = await supabase
    .from('rotation_schedule')
    .select('*, assigned_member:family_members(*)')
    .eq('family_id', member.family_id)
    .eq('date', today)
    .single()

  // Get today's dose logs
  const { data: todayDoses } = await supabase
    .from('med_dose_logs')
    .select('*, medication:medications(*)')
    .eq('family_id', member.family_id)
    .eq('date', today)

  // Get medications
  const { data: medications } = await supabase
    .from('medications')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('is_active', true)

  // Get pending tasks
  const { data: pendingTasks } = await supabase
    .from('tasks')
    .select('*')
    .eq('family_id', member.family_id)
    .neq('status', 'completed')
    .neq('status', 'cancelled')
    .limit(5)

  // Get shopping items
  const { data: shoppingItems } = await supabase
    .from('shopping_items')
    .select('*')
    .eq('family_id', member.family_id)
    .eq('status', 'open')

  return (
    <DashboardClient
      user={user}
      member={member}
      familyMembers={familyMembers || []}
      todayRotation={todayRotation}
      todayDoses={todayDoses || []}
      medications={medications || []}
      pendingTasks={pendingTasks || []}
      shoppingItems={shoppingItems || []}
    />
  )
}
