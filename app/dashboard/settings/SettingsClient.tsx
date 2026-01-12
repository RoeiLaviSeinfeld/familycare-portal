'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import { 
  ArrowRight, User, Bell, Users, LogOut, 
  ChevronLeft, Save, Moon, Sun, Volume2
} from 'lucide-react'

interface SettingsClientProps {
  member: any
  familyMembers: any[]
}

export default function SettingsClient({
  member,
  familyMembers,
}: SettingsClientProps) {
  const [notificationLevel, setNotificationLevel] = useState(member.notification_level || 'frequent')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isAdmin = member.role === 'admin'

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  // Handle save notification settings
  const handleSaveNotifications = async () => {
    setLoading(true)
    
    await supabase
      .from('family_members')
      .update({ notification_level: notificationLevel })
      .eq('id', member.id)
    
    setLoading(false)
    router.refresh()
  }

  const notificationLevels = [
    { value: 'aggressive', label: 'מציק', icon: Volume2, desc: 'כל ההתראות + תזכורות חוזרות' },
    { value: 'frequent', label: 'תדיר', icon: Bell, desc: 'התראות רגילות' },
    { value: 'calm', label: 'רגוע', icon: Moon, desc: 'רק התראות דחופות' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <h1 className="font-bold text-lg">הגדרות</h1>
        </div>
      </header>

      <div className="p-4 pb-24 space-y-4">
        {/* Profile Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <SeinfeldAvatar character={member.avatar_character} size={64} />
            <div>
              <h2 className="font-bold text-lg">{member.first_name}</h2>
              <p className="text-sm text-gray-500">{member.email}</p>
              <span className={`text-xs px-2 py-1 rounded-full ${
                member.role === 'admin' ? 'bg-teal-100 text-teal-600' :
                member.role === 'editor' ? 'bg-blue-100 text-blue-600' :
                'bg-gray-100 text-gray-600'
              }`}>
                {member.role === 'admin' ? 'מנהל' : member.role === 'editor' ? 'עורך' : 'צופה'}
              </span>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="text-teal-600" size={24} />
            <h2 className="font-bold">רמת התראות</h2>
          </div>
          
          <div className="space-y-2">
            {notificationLevels.map(level => {
              const Icon = level.icon
              const isSelected = notificationLevel === level.value
              return (
                <button
                  key={level.value}
                  onClick={() => setNotificationLevel(level.value)}
                  className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${
                    isSelected 
                      ? 'bg-teal-50 border-2 border-teal-500' 
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 text-right">
                    <p className="font-medium">{level.label}</p>
                    <p className="text-sm text-gray-500">{level.desc}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-teal-500 rounded-full flex items-center justify-center">
                      <Save size={14} className="text-white" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          
          <button
            onClick={handleSaveNotifications}
            disabled={loading || notificationLevel === member.notification_level}
            className="w-full mt-4 py-3 bg-teal-500 text-white rounded-xl font-medium disabled:opacity-50"
          >
            {loading ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>

        {/* Admin Section - Manage Family */}
        {isAdmin && familyMembers.length > 0 && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-teal-600" size={24} />
              <h2 className="font-bold">ניהול משתמשים</h2>
            </div>
            
            <div className="space-y-3">
              {familyMembers.map(fm => (
                <div 
                  key={fm.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  <SeinfeldAvatar character={fm.avatar_character} size={40} />
                  <div className="flex-1">
                    <p className="font-medium">{fm.first_name}</p>
                    <p className="text-xs text-gray-500">{fm.email}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    fm.role === 'admin' ? 'bg-teal-100 text-teal-600' :
                    fm.role === 'editor' ? 'bg-blue-100 text-blue-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {fm.role === 'admin' ? 'מנהל' : fm.role === 'editor' ? 'עורך' : 'צופה'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={24} />
          <span className="font-medium">התנתק</span>
        </button>
      </div>
    </div>
  )
}
