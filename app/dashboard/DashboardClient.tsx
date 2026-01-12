'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import AdminControlPanel from '@/components/dashboard/AdminControlPanel'
import { 
  Settings, LogOut, Bell, Sun, Moon, Pill, 
  CheckCircle2, AlertTriangle, Calendar, ShoppingCart,
  Users, ChevronLeft, Clock
} from 'lucide-react'

interface DashboardClientProps {
  user: any
  member: any
  familyMembers: any[]
  todayRotation: any
  todayDoses: any[]
  medications: any[]
  pendingTasks: any[]
  shoppingItems: any[]
}

export default function DashboardClient({
  user,
  member,
  familyMembers,
  todayRotation,
  todayDoses,
  medications,
  pendingTasks,
  shoppingItems,
}: DashboardClientProps) {
  const [showMenu, setShowMenu] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Calculate current time window
  const now = new Date()
  const currentHour = now.getHours()
  const isMorningWindow = currentHour >= 7 && currentHour < 14
  const isEveningWindow = currentHour >= 19 || currentHour < 2
  const currentWindow = isMorningWindow ? 'morning' : isEveningWindow ? 'evening' : null

  // Get medications for current window
  const currentMeds = medications.filter(m => 
    currentWindow && m.time_window === currentWindow
  )

  // Check completion status
  const completedDoses = todayDoses.filter(d => d.status === 'done' || d.status === 'done_late')
  const morningMeds = medications.filter(m => m.time_window === 'morning')
  const eveningMeds = medications.filter(m => m.time_window === 'evening')
  const morningCompleted = todayDoses.filter(d => d.time_window === 'morning' && (d.status === 'done' || d.status === 'done_late')).length
  const eveningCompleted = todayDoses.filter(d => d.time_window === 'evening' && (d.status === 'done' || d.status === 'done_late')).length

  // Format greeting based on time
  const getGreeting = () => {
    if (currentHour < 12) return 'בוקר טוב'
    if (currentHour < 17) return 'צהריים טובים'
    if (currentHour < 21) return 'ערב טוב'
    return 'לילה טוב'
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="gradient-primary text-white p-4 pb-24 rounded-b-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SeinfeldAvatar character={member.avatar_character} size={48} />
            <div>
              <p className="text-teal-100 text-sm">{getGreeting()}</p>
              <h1 className="font-bold text-lg">{member.first_name}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Bell size={24} />
            </button>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <Settings size={24} />
            </button>
          </div>
        </div>

        {/* Today's Duty */}
        {todayRotation && (
          <div className="bg-white/20 backdrop-blur rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SeinfeldAvatar 
                  character={todayRotation.assigned_member?.avatar_character || 'jerry'} 
                  size={40} 
                />
                <div>
                  <p className="text-teal-100 text-sm">תורן היום</p>
                  <p className="font-bold">{todayRotation.assigned_member?.first_name}</p>
                </div>
              </div>
              <div className="text-left">
                <p className="text-xs text-teal-100">
                  {todayRotation.is_weekend ? 'סופ"ש: אירוח + תרופות + קניות' : 'ביקור + תרופות'}
                </p>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute top-16 left-4 bg-white rounded-xl shadow-xl z-50 overflow-hidden">
          <Link 
            href="/dashboard/settings" 
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <Settings size={20} className="text-gray-500" />
            <span>הגדרות</span>
          </Link>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors w-full text-red-500"
          >
            <LogOut size={20} />
            <span>התנתק</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="px-4 -mt-16 relative z-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Morning Meds */}
          <Link href="/dashboard/medications?window=morning" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Sun className="text-amber-500" size={24} />
              <span className={`text-xs px-2 py-1 rounded-full ${
                morningCompleted === morningMeds.length 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-amber-100 text-amber-600'
              }`}>
                {morningCompleted}/{morningMeds.length}
              </span>
            </div>
            <p className="text-gray-500 text-sm">תרופות בוקר</p>
            <p className="font-bold text-lg">{morningMeds.length > 0 ? `${Math.round((morningCompleted/morningMeds.length)*100)}%` : '-'}</p>
          </Link>

          {/* Evening Meds */}
          <Link href="/dashboard/medications?window=evening" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <Moon className="text-indigo-500" size={24} />
              <span className={`text-xs px-2 py-1 rounded-full ${
                eveningCompleted === eveningMeds.length 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-indigo-100 text-indigo-600'
              }`}>
                {eveningCompleted}/{eveningMeds.length}
              </span>
            </div>
            <p className="text-gray-500 text-sm">תרופות ערב</p>
            <p className="font-bold text-lg">{eveningMeds.length > 0 ? `${Math.round((eveningCompleted/eveningMeds.length)*100)}%` : '-'}</p>
          </Link>

          {/* Tasks */}
          <Link href="/dashboard/tasks" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle2 className="text-teal-500" size={24} />
            </div>
            <p className="text-gray-500 text-sm">משימות פתוחות</p>
            <p className="font-bold text-lg">{pendingTasks.length}</p>
          </Link>

          {/* Shopping */}
          <Link href="/dashboard/shopping" className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <ShoppingCart className="text-purple-500" size={24} />
            </div>
            <p className="text-gray-500 text-sm">קניות</p>
            <p className="font-bold text-lg">{shoppingItems.length}</p>
          </Link>
        </div>

        {/* Current Window Alert */}
        {currentWindow && currentMeds.length > 0 && (
          <div className={`rounded-2xl p-4 mb-6 ${
            currentWindow === 'morning' ? 'bg-amber-50 border border-amber-200' : 'bg-indigo-50 border border-indigo-200'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              {currentWindow === 'morning' ? <Sun className="text-amber-500" /> : <Moon className="text-indigo-500" />}
              <div>
                <p className="font-bold">{currentWindow === 'morning' ? 'חלון בוקר פתוח' : 'חלון ערב פתוח'}</p>
                <p className="text-sm text-gray-500">
                  {currentWindow === 'morning' ? '07:00 - 14:00' : '19:00 - 02:00'}
                </p>
              </div>
            </div>
            <Link 
              href={`/dashboard/medications?window=${currentWindow}`}
              className={`block text-center py-2 rounded-xl font-medium ${
                currentWindow === 'morning' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-indigo-500 text-white'
              }`}
            >
              לצפייה בתרופות ({currentMeds.length})
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <h2 className="font-bold text-gray-800 mb-4">פעולות מהירות</h2>
          <div className="grid grid-cols-4 gap-4">
            <Link href="/dashboard/calendar" className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                <Calendar className="text-teal-600" size={24} />
              </div>
              <span className="text-xs text-gray-600">יומן</span>
            </Link>
            <Link href="/dashboard/medications" className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Pill className="text-amber-600" size={24} />
              </div>
              <span className="text-xs text-gray-600">תרופות</span>
            </Link>
            <Link href="/dashboard/tasks" className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="text-blue-600" size={24} />
              </div>
              <span className="text-xs text-gray-600">משימות</span>
            </Link>
            <Link href="/dashboard/shopping" className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="text-purple-600" size={24} />
              </div>
              <span className="text-xs text-gray-600">קניות</span>
            </Link>
          </div>
        </div>

        {/* Family Members */}
        <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">בני המשפחה</h2>
            <Users size={20} className="text-gray-400" />
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {familyMembers.map(fm => (
              <div key={fm.id} className="flex flex-col items-center min-w-fit">
                <SeinfeldAvatar character={fm.avatar_character} size={48} />
                <p className="text-sm mt-2 font-medium">{fm.first_name}</p>
                <p className="text-xs text-gray-400">
                  {fm.role === 'admin' ? 'מנהל' : fm.role === 'editor' ? 'עורך' : 'צופה'}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Pending Tasks */}
        {pendingTasks.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800">משימות פתוחות</h2>
              <Link href="/dashboard/tasks" className="text-teal-600 text-sm flex items-center gap-1">
                הכל <ChevronLeft size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {pendingTasks.slice(0, 3).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === 'high' ? 'bg-red-500' : 
                    task.priority === 'medium' ? 'bg-amber-500' : 'bg-green-500'
                  }`} />
                  <div className="flex-1">
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.due_date && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(task.due_date).toLocaleDateString('he-IL')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Admin Control Panel - Only for admin/editor */}
      {(member.role === 'admin' || member.role === 'editor') && (
        <AdminControlPanel member={member} familyId={member.family_id} />
      )}
    </div>
  )
}
