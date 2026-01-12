'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import { 
  ArrowRight, Sun, Moon, Pill, Check, Clock, 
  AlertTriangle, CheckCircle2, XCircle
} from 'lucide-react'

interface MedicationsClientProps {
  member: any
  medications: any[]
  todayDoses: any[]
  todayRotation: any
}

export default function MedicationsClient({
  member,
  medications,
  todayDoses,
  todayRotation,
}: MedicationsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialWindow = searchParams.get('window') || 'morning'
  const [activeWindow, setActiveWindow] = useState<'morning' | 'evening'>(initialWindow as any)
  const [loading, setLoading] = useState<string | null>(null)
  const supabase = createClient()

  const isEditor = member.role === 'admin' || member.role === 'editor'

  // Filter medications by window
  const windowMeds = medications.filter(m => m.time_window === activeWindow)

  // Get dose status for a medication
  const getDoseStatus = (medId: string) => {
    const dose = todayDoses.find(d => d.medication_id === medId && d.time_window === activeWindow)
    return dose?.status || 'pending'
  }

  // Handle confirming a dose
  const handleConfirmDose = async (medication: any) => {
    if (!isEditor) return
    
    setLoading(medication.id)
    const today = new Date().toISOString().split('T')[0]
    
    // Check if within window
    const now = new Date()
    const hour = now.getHours()
    const isInMorningWindow = hour >= 7 && hour < 14
    const isInEveningWindow = hour >= 19 || hour < 2
    const isLate = (activeWindow === 'morning' && !isInMorningWindow) || 
                   (activeWindow === 'evening' && !isInEveningWindow)

    const { error } = await supabase
      .from('med_dose_logs')
      .upsert({
        family_id: member.family_id,
        medication_id: medication.id,
        date: today,
        time_window: activeWindow,
        status: isLate ? 'done_late' : 'done',
        performed_by: member.id,
        confirmed_at: new Date().toISOString(),
      }, {
        onConflict: 'medication_id,date,time_window'
      })

    if (!error) {
      router.refresh()
    }
    setLoading(null)
  }

  // Time window info
  const windowInfo = {
    morning: { 
      icon: Sun, 
      label: 'בוקר', 
      time: '07:00 - 14:00', 
      color: 'amber',
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-600',
      borderColor: 'border-amber-200'
    },
    evening: { 
      icon: Moon, 
      label: 'ערב', 
      time: '19:00 - 02:00', 
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200'
    },
  }

  const currentWindowInfo = windowInfo[activeWindow]
  const WindowIcon = currentWindowInfo.icon

  // Calculate completion
  const completed = windowMeds.filter(m => {
    const status = getDoseStatus(m.id)
    return status === 'done' || status === 'done_late'
  }).length
  const total = windowMeds.length
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <div>
            <h1 className="font-bold text-lg">תרופות</h1>
            <p className="text-sm text-gray-500">
              {new Date().toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
      </header>

      {/* Window Tabs */}
      <div className="p-4">
        <div className="bg-white rounded-2xl p-1 flex gap-1 shadow-sm">
          {(['morning', 'evening'] as const).map(window => {
            const info = windowInfo[window]
            const Icon = info.icon
            const isActive = activeWindow === window
            return (
              <button
                key={window}
                onClick={() => setActiveWindow(window)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `${info.bgColor} ${info.textColor}` 
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{info.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Today's Duty */}
      {todayRotation && (
        <div className="px-4 mb-4">
          <div className={`${currentWindowInfo.bgColor} ${currentWindowInfo.borderColor} border rounded-2xl p-4`}>
            <div className="flex items-center gap-3">
              <SeinfeldAvatar 
                character={todayRotation.assigned_member?.avatar_character || 'jerry'} 
                size={40} 
              />
              <div>
                <p className="text-sm text-gray-500">אחראי היום</p>
                <p className="font-bold">{todayRotation.assigned_member?.first_name}</p>
              </div>
              <div className="mr-auto text-left">
                <p className={`text-sm ${currentWindowInfo.textColor}`}>חלון {currentWindowInfo.label}</p>
                <p className="text-xs text-gray-500">{currentWindowInfo.time}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Progress */}
      <div className="px-4 mb-4">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600">התקדמות {currentWindowInfo.label}</span>
            <span className="font-bold">{completed}/{total}</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                activeWindow === 'morning' ? 'bg-amber-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {percentage === 100 && (
            <div className="flex items-center gap-2 mt-3 text-green-600">
              <CheckCircle2 size={20} />
              <span className="text-sm font-medium">כל התרופות ניתנו! 🎉</span>
            </div>
          )}
        </div>
      </div>

      {/* Medications List */}
      <div className="px-4 pb-24">
        <h2 className="font-bold text-gray-800 mb-3">תרופות {currentWindowInfo.label}</h2>
        
        {windowMeds.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Pill className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">אין תרופות לחלון זה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {windowMeds.map(med => {
              const status = getDoseStatus(med.id)
              const isDone = status === 'done' || status === 'done_late'
              const isLate = status === 'done_late'
              const isMissed = status === 'missed'
              
              return (
                <div 
                  key={med.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${
                    isDone ? 'opacity-75' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isDone ? 'bg-green-100' : 
                      isMissed ? 'bg-red-100' : 
                      currentWindowInfo.bgColor
                    }`}>
                      {isDone ? (
                        <Check className="text-green-600" size={24} />
                      ) : isMissed ? (
                        <XCircle className="text-red-600" size={24} />
                      ) : (
                        <Pill className={currentWindowInfo.textColor} size={24} />
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">{med.name_hebrew || med.name}</p>
                      <p className="text-sm text-gray-500">{med.dosage}</p>
                      {isLate && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                          <Clock size={12} />
                          ניתן באיחור
                        </p>
                      )}
                    </div>
                    
                    {isEditor && !isDone && !isMissed && (
                      <button
                        onClick={() => handleConfirmDose(med)}
                        disabled={loading === med.id}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          activeWindow === 'morning'
                            ? 'bg-amber-500 text-white hover:bg-amber-600'
                            : 'bg-indigo-500 text-white hover:bg-indigo-600'
                        } disabled:opacity-50`}
                      >
                        {loading === med.id ? '...' : 'ניתן'}
                      </button>
                    )}
                    
                    {isDone && (
                      <div className="text-green-600">
                        <CheckCircle2 size={28} />
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
