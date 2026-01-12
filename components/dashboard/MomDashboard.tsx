'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import { Sun, Cloud, CloudRain, Moon, Phone, Heart, X } from 'lucide-react'

interface MomDashboardProps {
  member: any
  familyMembers: any[]
  todayRotation: any
  weekendRotation: any
  upcomingEvents: any[]
  upcomingHolidays: any[]
  medications: any[]
  todayDoses: any[]
  photos: any[]
  messages: any[]
  displaySettings: any
}

const HEBREW_DAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת']
const HEBREW_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר']

export default function MomDashboard({
  member,
  familyMembers,
  todayRotation,
  weekendRotation,
  upcomingEvents,
  upcomingHolidays,
  medications,
  todayDoses,
  photos,
  messages,
  displaySettings,
}: MomDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)
  const [weather, setWeather] = useState<any>(null)
  const [isScreensaver, setIsScreensaver] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())
  const [showMessage, setShowMessage] = useState<any>(null)
  const [displayControl, setDisplayControl] = useState<any>(null)
  const [showTutorial, setShowTutorial] = useState<any>(null)
  
  const supabase = createClient()

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Rotate photos
  useEffect(() => {
    if (photos.length === 0) return
    const interval = setInterval(() => {
      setCurrentPhotoIndex(prev => (prev + 1) % photos.length)
    }, (displaySettings?.photo_interval || 30) * 1000)
    return () => clearInterval(interval)
  }, [photos.length, displaySettings?.photo_interval])

  // Screensaver timeout
  useEffect(() => {
    const timeout = (displaySettings?.screensaver_timeout || 300) * 1000
    const checkActivity = setInterval(() => {
      if (Date.now() - lastActivity > timeout) {
        setIsScreensaver(true)
      }
    }, 1000)
    return () => clearInterval(checkActivity)
  }, [lastActivity, displaySettings?.screensaver_timeout])

  // Reset activity on interaction
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now())
    setIsScreensaver(false)
  }, [])

  useEffect(() => {
    window.addEventListener('mousemove', handleActivity)
    window.addEventListener('click', handleActivity)
    window.addEventListener('keydown', handleActivity)
    window.addEventListener('touchstart', handleActivity)
    return () => {
      window.removeEventListener('mousemove', handleActivity)
      window.removeEventListener('click', handleActivity)
      window.removeEventListener('keydown', handleActivity)
      window.removeEventListener('touchstart', handleActivity)
    }
  }, [handleActivity])

  // Subscribe to realtime updates for display control
  useEffect(() => {
    const channel = supabase
      .channel('mom-display')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mom_display_control',
        filter: `family_id=eq.${member.family_id}`
      }, (payload: any) => {
        setDisplayControl(payload.new)
        handleDisplayChange(payload.new)
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mom_messages',
        filter: `family_id=eq.${member.family_id}`
      }, (payload: any) => {
        if (payload.new.is_urgent) {
          setShowMessage(payload.new)
          // Play sound for urgent messages
          playNotificationSound()
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [member.family_id])

  // Handle display control changes
  const handleDisplayChange = async (control: any) => {
    if (!control) return
    
    switch (control.current_view) {
      case 'dashboard':
        setShowTutorial(null)
        setIsScreensaver(false)
        break
      case 'tutorial':
        if (control.content_id) {
          const { data } = await supabase
            .from('tutorials')
            .select('*')
            .eq('id', control.content_id)
            .single()
          setShowTutorial(data)
        }
        break
      case 'message':
        if (control.content_data) {
          setShowMessage(control.content_data)
        }
        break
      case 'screensaver':
        setIsScreensaver(true)
        break
    }
    handleActivity()
  }

  const playNotificationSound = () => {
    const audio = new Audio('/sounds/notification.mp3')
    audio.volume = 0.5
    audio.play().catch(() => {})
  }

  // Check if in night mode
  const isNightMode = () => {
    if (!displaySettings?.night_mode_start || !displaySettings?.night_mode_end) return false
    const hour = currentTime.getHours()
    const startHour = parseInt(displaySettings.night_mode_start.split(':')[0])
    const endHour = parseInt(displaySettings.night_mode_end.split(':')[0])
    if (startHour > endHour) {
      return hour >= startHour || hour < endHour
    }
    return hour >= startHour && hour < endHour
  }

  // Mark message as read
  const handleMessageRead = async (messageId: string) => {
    await supabase
      .from('mom_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('id', messageId)
    setShowMessage(null)
  }

  // Get today's responsible member
  const todayMember = todayRotation?.assigned_member
  const weekendMember = weekendRotation?.assigned_member

  // Get medication status
  const morningMeds = medications.filter(m => m.time_window === 'morning')
  const eveningMeds = medications.filter(m => m.time_window === 'evening')
  const morningDone = todayDoses.filter(d => d.time_window === 'morning' && (d.status === 'done' || d.status === 'done_late')).length
  const eveningDone = todayDoses.filter(d => d.time_window === 'evening' && (d.status === 'done' || d.status === 'done_late')).length

  // Get latest unread message
  const latestMessage = messages.find(m => !m.is_read)

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
  }

  const formatDate = (date: Date) => {
    return `יום ${HEBREW_DAYS[date.getDay()]}, ${date.getDate()} ב${HEBREW_MONTHS[date.getMonth()]}`
  }

  // Night mode display
  if (isNightMode() && !showMessage && !showTutorial) {
    return (
      <div 
        className="min-h-screen bg-gray-900 flex items-center justify-center cursor-pointer"
        onClick={handleActivity}
      >
        <div className="text-center">
          <div className="text-8xl font-light text-gray-300 mb-4">
            {formatTime(currentTime)}
          </div>
          <div className="text-2xl text-gray-500">
            {formatDate(currentTime)}
          </div>
        </div>
      </div>
    )
  }

  // Screensaver mode
  if (isScreensaver && photos.length > 0 && !showMessage && !showTutorial) {
    return (
      <div 
        className="min-h-screen bg-black flex items-center justify-center cursor-pointer relative"
        onClick={handleActivity}
      >
        <img
          src={photos[currentPhotoIndex]?.url}
          alt={photos[currentPhotoIndex]?.caption || 'תמונה משפחתית'}
          className="max-h-screen max-w-full object-contain"
        />
        {photos[currentPhotoIndex]?.caption && (
          <div className="absolute bottom-20 left-0 right-0 text-center">
            <p className="text-white text-2xl bg-black/50 inline-block px-6 py-2 rounded-full">
              {photos[currentPhotoIndex].caption}
            </p>
          </div>
        )}
        <div className="absolute bottom-8 left-0 right-0 text-center text-white/60 text-xl">
          {formatTime(currentTime)} | {formatDate(currentTime)}
        </div>
      </div>
    )
  }

  // Tutorial view
  if (showTutorial) {
    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <button
          onClick={() => setShowTutorial(null)}
          className="absolute top-8 left-8 p-4 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <X size={32} />
        </button>
        
        <div className="max-w-5xl mx-auto">
          <h1 className="text-5xl font-bold text-gray-800 mb-8 text-center">
            {showTutorial.title}
          </h1>
          
          {showTutorial.content_type === 'video' && showTutorial.video_url && (
            <div className="aspect-video bg-black rounded-2xl overflow-hidden">
              <iframe
                src={showTutorial.video_url.replace('watch?v=', 'embed/')}
                className="w-full h-full"
                allowFullScreen
              />
            </div>
          )}
          
          {showTutorial.content_type === 'images' && showTutorial.steps && (
            <div className="space-y-8">
              {showTutorial.steps.map((step: any, index: number) => (
                <div key={index} className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-teal-500 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-3xl text-gray-800 mb-4">{step.text}</p>
                      {step.image_url && (
                        <img
                          src={step.image_url}
                          alt={`שלב ${index + 1}`}
                          className="rounded-xl max-w-full"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Message popup
  if (showMessage) {
    const sender = familyMembers.find(m => m.id === showMessage.from_member_id)
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-8">
        <div className="bg-white rounded-3xl p-12 max-w-2xl w-full text-center shadow-2xl">
          <div className="text-6xl mb-6">💬</div>
          
          {sender && (
            <div className="flex items-center justify-center gap-4 mb-6">
              <SeinfeldAvatar character={sender.avatar_character} size={64} />
              <span className="text-3xl font-bold text-gray-800">הודעה מ{sender.first_name}</span>
            </div>
          )}
          
          <p className="text-4xl text-gray-700 mb-12 leading-relaxed">
            "{showMessage.message}"
          </p>
          
          <button
            onClick={() => handleMessageRead(showMessage.id)}
            className="px-16 py-6 bg-teal-500 text-white text-3xl font-bold rounded-2xl hover:bg-teal-600 transition-colors"
          >
            הבנתי ❤️
          </button>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        
        {/* Time & Weather - Left Column */}
        <div className="col-span-5 space-y-6">
          {/* Date & Time Card */}
          <div className="bg-white rounded-3xl p-8 shadow-lg">
            <div className="text-center">
              <p className="text-3xl text-gray-600 mb-2">{formatDate(currentTime)}</p>
              <p className="text-9xl font-light text-gray-800 tracking-tight">
                {formatTime(currentTime)}
              </p>
            </div>
            
            {/* Weather */}
            <div className="mt-6 flex items-center justify-center gap-4 text-2xl text-gray-600">
              <Sun className="text-yellow-500" size={40} />
              <span>18°C</span>
              <span className="text-gray-400">|</span>
              <span>נאה</span>
            </div>
          </div>

          {/* Today's Contact */}
          {todayMember && (
            <div className="bg-white rounded-3xl p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <SeinfeldAvatar character={todayMember.avatar_character} size={80} />
                <div className="flex-1">
                  <p className="text-xl text-gray-500">היום איתך</p>
                  <p className="text-4xl font-bold text-gray-800">{todayMember.first_name}</p>
                </div>
                <a
                  href={`tel:${todayMember.phone || ''}`}
                  className="p-4 bg-green-500 text-white rounded-2xl hover:bg-green-600 transition-colors"
                >
                  <Phone size={32} />
                </a>
              </div>
            </div>
          )}

          {/* Weekend Shopping */}
          {weekendMember && (
            <div className="bg-amber-50 rounded-3xl p-6 shadow-lg border-2 border-amber-200">
              <div className="flex items-center gap-4">
                <div className="text-5xl">🛒</div>
                <div>
                  <p className="text-lg text-amber-700">קניות השבוע</p>
                  <p className="text-2xl font-bold text-gray-800">{weekendMember.first_name}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Photo Gallery - Right Column */}
        <div className="col-span-7">
          <div className="bg-white rounded-3xl p-4 shadow-lg h-full">
            {photos.length > 0 ? (
              <div className="relative h-full min-h-[400px]">
                <img
                  src={photos[currentPhotoIndex]?.url}
                  alt={photos[currentPhotoIndex]?.caption || 'תמונה משפחתית'}
                  className="w-full h-full object-cover rounded-2xl"
                />
                {photos[currentPhotoIndex]?.caption && (
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <p className="text-white text-xl bg-black/50 inline-block px-4 py-2 rounded-full">
                      {photos[currentPhotoIndex].caption}
                    </p>
                  </div>
                )}
                {/* Photo dots */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {photos.slice(0, 10).map((_, idx) => (
                    <div
                      key={idx}
                      className={`w-3 h-3 rounded-full transition-colors ${
                        idx === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Heart size={64} className="mx-auto mb-4" />
                  <p className="text-2xl">תמונות משפחתיות</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row - Cards */}
        <div className="col-span-4">
          {/* Medications Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">💊</span>
              <h3 className="text-2xl font-bold text-gray-800">תרופות</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-xl">☀️ בוקר</span>
                <span className={`text-xl font-bold ${morningDone === morningMeds.length ? 'text-green-600' : 'text-amber-600'}`}>
                  {morningDone === morningMeds.length ? '✅ ניתנו' : `${morningDone}/${morningMeds.length}`}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl">
                <span className="text-xl">🌙 ערב</span>
                <span className={`text-xl font-bold ${eveningDone === eveningMeds.length ? 'text-green-600' : 'text-indigo-600'}`}>
                  {eveningDone === eveningMeds.length ? '✅ ניתנו' : `⏰ 20:00`}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-4">
          {/* Events Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📅</span>
              <h3 className="text-2xl font-bold text-gray-800">אירועים</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 2).map(event => (
                <div key={event.id} className="p-3 bg-blue-50 rounded-xl">
                  <p className="text-lg font-medium text-gray-800">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.start_datetime).toLocaleDateString('he-IL')}
                  </p>
                </div>
              ))}
              {upcomingHolidays.slice(0, 1).map(holiday => (
                <div key={holiday.id} className="p-3 bg-amber-50 rounded-xl flex items-center gap-2">
                  <span>🕯️</span>
                  <div>
                    <p className="text-lg font-medium text-gray-800">{holiday.name_hebrew}</p>
                    <p className="text-sm text-gray-500">
                      עוד {Math.ceil((new Date(holiday.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} ימים
                    </p>
                  </div>
                </div>
              ))}
              {upcomingEvents.length === 0 && upcomingHolidays.length === 0 && (
                <p className="text-gray-400 text-center py-4">אין אירועים קרובים</p>
              )}
            </div>
          </div>
        </div>

        <div className="col-span-4">
          {/* Tutorials Card */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">📺</span>
              <h3 className="text-2xl font-bold text-gray-800">הדרכות</h3>
            </div>
            <p className="text-gray-500 text-lg text-center py-4">
              הילדים יציגו לך הדרכות כאן 💕
            </p>
          </div>
        </div>

        {/* Latest Message */}
        {latestMessage && (
          <div className="col-span-12">
            <div 
              className="bg-gradient-to-r from-teal-500 to-blue-500 rounded-3xl p-6 shadow-lg text-white cursor-pointer hover:from-teal-600 hover:to-blue-600 transition-colors"
              onClick={() => setShowMessage(latestMessage)}
            >
              <div className="flex items-center gap-4">
                <span className="text-4xl">💬</span>
                <div className="flex-1">
                  <p className="text-lg opacity-80">
                    הודעה מ{familyMembers.find(m => m.id === latestMessage.from_member_id)?.first_name}
                  </p>
                  <p className="text-2xl font-medium truncate">"{latestMessage.message}"</p>
                </div>
                <button className="px-6 py-3 bg-white/20 rounded-xl text-xl font-medium">
                  לקרוא
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
