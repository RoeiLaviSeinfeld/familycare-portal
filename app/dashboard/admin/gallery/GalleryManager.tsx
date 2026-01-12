'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, Plus, Image, Trash2, X, Upload, GripVertical
} from 'lucide-react'

interface GalleryManagerProps {
  member: any
  photos: any[]
}

export default function GalleryManager({
  member,
  photos: initialPhotos,
}: GalleryManagerProps) {
  const [photos, setPhotos] = useState(initialPhotos)
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [newPhotoCaption, setNewPhotoCaption] = useState('')
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Add photo
  const handleAddPhoto = async () => {
    if (!newPhotoUrl.trim()) return
    setLoading(true)
    
    const { data, error } = await supabase.from('gallery_photos').insert({
      family_id: member.family_id,
      url: newPhotoUrl,
      caption: newPhotoCaption || null,
      display_order: photos.length,
      uploaded_by: member.id
    }).select().single()
    
    if (data) {
      setPhotos([...photos, data])
    }
    
    setNewPhotoUrl('')
    setNewPhotoCaption('')
    setShowAddPhoto(false)
    setLoading(false)
  }

  // Delete photo
  const handleDeletePhoto = async (id: string) => {
    if (!confirm('למחוק את התמונה?')) return
    
    await supabase.from('gallery_photos').delete().eq('id', id)
    setPhotos(photos.filter(p => p.id !== id))
  }

  // Toggle active
  const handleToggleActive = async (photo: any) => {
    await supabase
      .from('gallery_photos')
      .update({ is_active: !photo.is_active })
      .eq('id', photo.id)
    
    setPhotos(photos.map(p => 
      p.id === photo.id ? { ...p, is_active: !p.is_active } : p
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/admin/tutorials" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">גלריית תמונות</h1>
            <p className="text-sm text-gray-500">{photos.filter(p => p.is_active).length} תמונות פעילות</p>
          </div>
          <button
            onClick={() => setShowAddPhoto(true)}
            className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600"
          >
            <Plus size={24} />
          </button>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
          <p className="text-blue-700 text-sm">
            💡 התמונות יוצגו על המסך של אמא בגלריה ובשומר המסך.
            תוכל להעלות קישורים לתמונות מ-Google Photos, Dropbox, או כל שירות אחר.
          </p>
        </div>

        {/* Add Photo Modal */}
        {showAddPhoto && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md">
              <div className="p-4 border-b flex items-center justify-between">
                <h3 className="font-bold text-lg">הוסף תמונה</h3>
                <button onClick={() => setShowAddPhoto(false)}>
                  <X size={24} />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm text-gray-500 mb-1">קישור לתמונה *</label>
                  <input
                    type="text"
                    value={newPhotoUrl}
                    onChange={(e) => setNewPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-3 border border-gray-200 rounded-xl"
                  />
                </div>
                
                <div>
                  <label className="block text-sm text-gray-500 mb-1">כיתוב (אופציונלי)</label>
                  <input
                    type="text"
                    value={newPhotoCaption}
                    onChange={(e) => setNewPhotoCaption(e.target.value)}
                    placeholder="למשל: יום הולדת לסבתא..."
                    className="w-full p-3 border border-gray-200 rounded-xl"
                  />
                </div>
                
                {/* Preview */}
                {newPhotoUrl && (
                  <div className="relative">
                    <img
                      src={newPhotoUrl}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em">שגיאה</text></svg>'
                      }}
                    />
                  </div>
                )}
              </div>
              
              <div className="p-4 border-t flex gap-3">
                <button
                  onClick={() => setShowAddPhoto(false)}
                  className="flex-1 py-3 border border-gray-200 rounded-xl hover:bg-gray-50"
                >
                  ביטול
                </button>
                <button
                  onClick={handleAddPhoto}
                  disabled={!newPhotoUrl.trim() || loading}
                  className="flex-1 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 disabled:opacity-50"
                >
                  {loading ? '...' : 'הוסף'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photos Grid */}
        {photos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <Image className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500 mb-4">אין תמונות עדיין</p>
            <button
              onClick={() => setShowAddPhoto(true)}
              className="px-6 py-2 bg-teal-500 text-white rounded-xl"
            >
              הוסף תמונה ראשונה
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {photos.map(photo => (
              <div
                key={photo.id}
                className={`relative rounded-2xl overflow-hidden shadow-sm ${
                  !photo.is_active ? 'opacity-50' : ''
                }`}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'תמונה'}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text fill="%23999" x="50%" y="50%" text-anchor="middle" dy=".3em">שגיאה</text></svg>'
                  }}
                />
                
                {photo.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-2 text-sm">
                    {photo.caption}
                  </div>
                )}
                
                <div className="absolute top-2 left-2 flex gap-1">
                  <button
                    onClick={() => handleToggleActive(photo)}
                    className={`p-2 rounded-full ${
                      photo.is_active ? 'bg-green-500' : 'bg-gray-500'
                    } text-white text-xs`}
                  >
                    {photo.is_active ? '✓' : '○'}
                  </button>
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-2 bg-red-500 text-white rounded-full"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="bg-gray-100 rounded-2xl p-4 text-sm text-gray-600">
          <p className="font-medium mb-2">💡 טיפים:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>השתמש בתמונות בגודל גדול לתצוגה טובה</li>
            <li>ניתן להעתיק קישור מ-Google Photos בלחיצה על "שתף"</li>
            <li>לחץ על הכפתור הירוק/אפור כדי להפעיל/לכבות תמונה</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
