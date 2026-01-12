'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import {
  Monitor, Send, Home, Play, Image, MessageSquare,
  ChevronDown, ChevronUp, Plus, X, Upload, Folder
} from 'lucide-react'

interface AdminControlPanelProps {
  member: any
  familyId: string
}

export default function AdminControlPanel({ member, familyId }: AdminControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [currentView, setCurrentView] = useState('dashboard')
  const [tutorials, setTutorials] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [showTutorialModal, setShowTutorialModal] = useState(false)
  const [messageText, setMessageText] = useState('')
  const [isUrgent, setIsUrgent] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const supabase = createClient()
  const router = useRouter()

  // Load tutorials and categories
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const [tutorialsRes, categoriesRes] = await Promise.all([
      supabase.from('tutorials').select('*, category:tutorial_categories(*)').eq('family_id', familyId).eq('is_active', true),
      supabase.from('tutorial_categories').select('*').eq('family_id', familyId).eq('is_active', true).order('display_order')
    ])
    
    if (tutorialsRes.data) setTutorials(tutorialsRes.data)
    if (categoriesRes.data) setCategories(categoriesRes.data)
  }

  // Change mom's display
  const changeDisplay = async (view: string, contentId?: string, contentData?: any) => {
    setLoading(true)
    await supabase.rpc('update_mom_display', {
      p_family_id: familyId,
      p_view: view,
      p_content_id: contentId || null,
      p_content_data: contentData || null,
      p_triggered_by: member.id
    })
    setCurrentView(view)
    setLoading(false)
  }

  // Send message to mom
  const sendMessage = async () => {
    if (!messageText.trim()) return
    
    setLoading(true)
    await supabase.from('mom_messages').insert({
      family_id: familyId,
      from_member_id: member.id,
      message: messageText,
      is_urgent: isUrgent
    })

    // If urgent, also change display to show message
    if (isUrgent) {
      await changeDisplay('message', undefined, {
        message: messageText,
        from_member_id: member.id,
        is_urgent: true
      })
    }

    setMessageText('')
    setIsUrgent(false)
    setShowMessageModal(false)
    setLoading(false)
  }

  // Show tutorial on mom's screen
  const showTutorial = async (tutorial: any) => {
    await changeDisplay('tutorial', tutorial.id)
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-24 left-4 bg-purple-500 text-white p-4 rounded-full shadow-lg hover:bg-purple-600 transition-colors z-40"
      >
        <Monitor size={24} />
      </button>
    )
  }

  return (
    <>
      {/* Control Panel */}
      <div className="fixed bottom-24 left-4 w-80 bg-white rounded-2xl shadow-2xl z-40 overflow-hidden">
        {/* Header */}
        <div className="bg-purple-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Monitor size={20} />
            <span className="font-bold">שליטה במסך אמא</span>
          </div>
          <button onClick={() => setIsExpanded(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Current Status */}
        <div className="p-4 bg-purple-50 border-b">
          <p className="text-sm text-purple-600">מוצג עכשיו:</p>
          <p className="font-bold text-purple-800">
            {currentView === 'dashboard' && '🏠 דשבורד ראשי'}
            {currentView === 'tutorial' && '📺 הדרכה'}
            {currentView === 'message' && '💬 הודעה'}
            {currentView === 'screensaver' && '🖼️ שומר מסך'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b">
          <p className="text-sm text-gray-500 mb-3">פעולות מהירות</p>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => changeDisplay('dashboard')}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                currentView === 'dashboard' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Home size={20} />
              <span className="text-xs">בית</span>
            </button>
            <button
              onClick={() => setShowMessageModal(true)}
              className="p-3 rounded-xl flex flex-col items-center gap-1 bg-gray-100 hover:bg-gray-200"
            >
              <MessageSquare size={20} />
              <span className="text-xs">הודעה</span>
            </button>
            <button
              onClick={() => changeDisplay('screensaver')}
              className={`p-3 rounded-xl flex flex-col items-center gap-1 ${
                currentView === 'screensaver' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 hover:bg-gray-200'
              }`}
            >
              <Image size={20} />
              <span className="text-xs">תמונות</span>
            </button>
            <button
              onClick={() => setShowTutorialModal(true)}
              className="p-3 rounded-xl flex flex-col items-center gap-1 bg-gray-100 hover:bg-gray-200"
            >
              <Play size={20} />
              <span className="text-xs">הדרכה</span>
            </button>
          </div>
        </div>

        {/* Recent Tutorials */}
        <div className="p-4 max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-500 mb-3">הדרכות אחרונות</p>
          {tutorials.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">
              אין הדרכות עדיין
            </p>
          ) : (
            <div className="space-y-2">
              {tutorials.slice(0, 5).map(tutorial => (
                <button
                  key={tutorial.id}
                  onClick={() => showTutorial(tutorial)}
                  className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 text-right"
                >
                  <span className="text-xl">{tutorial.category?.icon || '📺'}</span>
                  <span className="flex-1 text-sm truncate">{tutorial.title}</span>
                  <Play size={16} className="text-purple-500" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t">
          <button
            onClick={() => router.push('/dashboard/admin/tutorials')}
            className="w-full py-2 text-sm text-purple-600 hover:text-purple-700"
          >
            ניהול הדרכות ותמונות →
          </button>
        </div>
      </div>

      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">שלח הודעה לאמא</h3>
              <button onClick={() => setShowMessageModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="כתוב הודעה..."
                className="w-full p-4 border border-gray-200 rounded-xl h-32 resize-none focus:outline-none focus:border-purple-500"
                autoFocus
              />
              
              <label className="flex items-center gap-3 mt-4 p-3 bg-red-50 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={isUrgent}
                  onChange={(e) => setIsUrgent(e.target.checked)}
                  className="w-5 h-5 text-red-500"
                />
                <div>
                  <p className="font-medium text-red-700">הודעה דחופה</p>
                  <p className="text-sm text-red-500">יופיע כפופאפ עם צליל</p>
                </div>
              </label>
            </div>
            
            <div className="p-4 border-t flex gap-3">
              <button
                onClick={() => setShowMessageModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                ביטול
              </button>
              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || loading}
                className="flex-1 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50"
              >
                {loading ? '...' : 'שלח'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Selection Modal */}
      {showTutorialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">בחר הדרכה להצגה</h3>
              <button onClick={() => setShowTutorialModal(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto max-h-96">
              {categories.map(category => {
                const categoryTutorials = tutorials.filter(t => t.category_id === category.id)
                if (categoryTutorials.length === 0) return null
                
                return (
                  <div key={category.id} className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{category.icon}</span>
                      <span className="font-medium text-gray-700">{category.name}</span>
                    </div>
                    <div className="space-y-1 mr-7">
                      {categoryTutorials.map(tutorial => (
                        <button
                          key={tutorial.id}
                          onClick={() => {
                            showTutorial(tutorial)
                            setShowTutorialModal(false)
                          }}
                          className="w-full flex items-center gap-2 p-3 rounded-xl hover:bg-purple-50 text-right"
                        >
                          <Play size={16} className="text-purple-500" />
                          <span className="flex-1">{tutorial.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
              
              {tutorials.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <Folder size={48} className="mx-auto mb-3" />
                  <p>אין הדרכות עדיין</p>
                  <button
                    onClick={() => {
                      setShowTutorialModal(false)
                      router.push('/dashboard/admin/tutorials')
                    }}
                    className="mt-4 text-purple-600 hover:text-purple-700"
                  >
                    הוסף הדרכה ראשונה →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
