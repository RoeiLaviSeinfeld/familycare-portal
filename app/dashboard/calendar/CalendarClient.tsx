'use client'

import { useState } from 'react'
import Link from 'next/link'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import { 
  ArrowRight, ChevronLeft, ChevronRight, Calendar as CalendarIcon,
  Pill, ShoppingCart, Star, Users, Plus
} from 'lucide-react'

interface CalendarClientProps {
  member: any
  familyMembers: any[]
  rotationSchedule: any[]
  events: any[]
  holidays: any[]
}

const DAYS_HE = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳']
const MONTHS_HE = [
  'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
  'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
]

export default function CalendarClient({
  member,
  familyMembers,
  rotationSchedule,
  events,
  holidays,
}: CalendarClientProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month')
  const [filterMember, setFilterMember] = useState<string | null>(null)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Get calendar days for current month
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDay = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days: (Date | null)[] = []
    
    // Add empty cells for days before first day
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    
    // Add all days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i))
    }
    
    return days
  }

  // Get rotation for a specific date
  const getRotation = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return rotationSchedule.find(r => r.date === dateStr)
  }

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => e.start_datetime.split('T')[0] === dateStr)
  }

  // Get holiday for a specific date
  const getHoliday = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return holidays.find(h => h.date === dateStr)
  }

  // Navigate months
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const days = getMonthDays()

  // Get selected date info
  const selectedRotation = selectedDate ? getRotation(selectedDate) : null
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : []
  const selectedHoliday = selectedDate ? getHoliday(selectedDate) : null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">יומן</h1>
          </div>
          <button className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600">
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Month Navigation */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronRight size={24} />
          </button>
          <h2 className="font-bold text-lg">
            {MONTHS_HE[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      {/* Filter by member */}
      <div className="bg-white p-4 border-b border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setFilterMember(null)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              !filterMember ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            הכל
          </button>
          {familyMembers.filter(m => !m.is_mother).map(m => (
            <button
              key={m.id}
              onClick={() => setFilterMember(m.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                filterMember === m.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <SeinfeldAvatar character={m.avatar_character} size={20} />
              {m.first_name}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white p-4">
        {/* Days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS_HE.map(day => (
            <div key={day} className="text-center text-sm text-gray-500 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => {
            if (!date) {
              return <div key={`empty-${index}`} className="aspect-square" />
            }

            const rotation = getRotation(date)
            const dayEvents = getEventsForDate(date)
            const holiday = getHoliday(date)
            const isToday = date.getTime() === today.getTime()
            const isSelected = selectedDate && date.getTime() === selectedDate.getTime()
            const isWeekend = date.getDay() === 5 || date.getDay() === 6
            
            // Filter check
            const showDay = !filterMember || rotation?.assigned_member_id === filterMember

            return (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedDate(date)}
                className={`aspect-square p-1 rounded-xl transition-all relative ${
                  isSelected ? 'bg-teal-500 text-white' :
                  isToday ? 'bg-teal-100' :
                  holiday?.is_yom_tov ? 'bg-amber-50' :
                  isWeekend ? 'bg-gray-50' : 'hover:bg-gray-50'
                } ${!showDay && filterMember ? 'opacity-30' : ''}`}
              >
                <span className={`text-sm ${isToday && !isSelected ? 'font-bold text-teal-600' : ''}`}>
                  {date.getDate()}
                </span>
                
                {/* Rotation indicator */}
                {rotation && showDay && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                    <SeinfeldAvatar 
                      character={rotation.assigned_member?.avatar_character || 'jerry'} 
                      size={16} 
                    />
                  </div>
                )}

                {/* Holiday indicator */}
                {holiday && (
                  <div className="absolute top-1 left-1">
                    <Star size={10} className="text-amber-500" fill="currentColor" />
                  </div>
                )}

                {/* Events indicator */}
                {dayEvents.length > 0 && (
                  <div className="absolute top-1 right-1 w-2 h-2 bg-teal-500 rounded-full" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="p-4 space-y-4">
          {/* Date header */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="font-bold text-lg">
              {selectedDate.toLocaleDateString('he-IL', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </h3>
            {selectedHoliday && (
              <p className="text-amber-600 flex items-center gap-2 mt-1">
                <Star size={16} fill="currentColor" />
                {selectedHoliday.name_hebrew}
              </p>
            )}
          </div>

          {/* Rotation */}
          {selectedRotation && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <Pill size={18} />
                <span className="text-sm">תורנות תרופות</span>
              </div>
              <div className="flex items-center gap-3">
                <SeinfeldAvatar 
                  character={selectedRotation.assigned_member?.avatar_character || 'jerry'} 
                  size={48} 
                />
                <div>
                  <p className="font-bold">{selectedRotation.assigned_member?.first_name}</p>
                  <p className="text-sm text-gray-500">
                    {selectedRotation.is_weekend 
                      ? 'סופ"ש: אירוח + תרופות + קניות' 
                      : 'ביקור + תרופות בוקר וערב'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Events */}
          {selectedEvents.length > 0 && (
            <div className="bg-white rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-2 text-gray-500 mb-3">
                <CalendarIcon size={18} />
                <span className="text-sm">אירועים</span>
              </div>
              <div className="space-y-3">
                {selectedEvents.map(event => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className={`w-3 h-3 rounded-full ${
                      event.category === 'medical' ? 'bg-red-500' :
                      event.category === 'shopping' ? 'bg-purple-500' :
                      event.category === 'family' ? 'bg-blue-500' :
                      'bg-teal-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium">{event.title}</p>
                      {event.start_datetime && (
                        <p className="text-xs text-gray-500">
                          {new Date(event.start_datetime).toLocaleTimeString('he-IL', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      )}
                    </div>
                    {event.responsible_member && (
                      <SeinfeldAvatar 
                        character={event.responsible_member.avatar_character} 
                        size={28} 
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No events message */}
          {!selectedRotation && selectedEvents.length === 0 && !selectedHoliday && (
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <CalendarIcon className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">אין אירועים ביום זה</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
