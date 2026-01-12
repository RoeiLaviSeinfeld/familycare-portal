'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowRight, Plus, Folder, Play, Trash2, Edit,
  Video, Image, FileText, X, Save, ChevronDown
} from 'lucide-react'

interface TutorialsManagerProps {
  member: any
  categories: any[]
  tutorials: any[]
}

export default function TutorialsManager({
  member,
  categories: initialCategories,
  tutorials: initialTutorials,
}: TutorialsManagerProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [tutorials, setTutorials] = useState(initialTutorials)
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [showNewTutorial, setShowNewTutorial] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📺')
  const [newTutorial, setNewTutorial] = useState({
    title: '',
    category_id: '',
    content_type: 'images',
    video_url: '',
    steps: [{ text: '', image_url: '' }]
  })
  const [loading, setLoading] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  // Create category
  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return
    setLoading(true)
    
    const { data, error } = await supabase.from('tutorial_categories').insert({
      family_id: member.family_id,
      name: newCategoryName,
      icon: newCategoryIcon,
      display_order: categories.length
    }).select().single()
    
    if (data) {
      setCategories([...categories, data])
    }
    
    setNewCategoryName('')
    setNewCategoryIcon('📺')
    setShowNewCategory(false)
    setLoading(false)
  }

  // Create tutorial
  const handleCreateTutorial = async () => {
    if (!newTutorial.title.trim() || !newTutorial.category_id) return
    setLoading(true)
    
    const { data, error } = await supabase.from('tutorials').insert({
      family_id: member.family_id,
      title: newTutorial.title,
      category_id: newTutorial.category_id,
      content_type: newTutorial.content_type,
      video_url: newTutorial.content_type === 'video' ? newTutorial.video_url : null,
      steps: newTutorial.content_type === 'images' ? newTutorial.steps.filter(s => s.text.trim()) : null,
      created_by: member.id
    }).select('*, category:tutorial_categories(*)').single()
    
    if (data) {
      setTutorials([data, ...tutorials])
    }
    
    setNewTutorial({
      title: '',
      category_id: '',
      content_type: 'images',
      video_url: '',
      steps: [{ text: '', image_url: '' }]
    })
    setShowNewTutorial(false)
    setLoading(false)
  }

  // Delete tutorial
  const handleDeleteTutorial = async (id: string) => {
    if (!confirm('למחוק את ההדרכה?')) return
    
    await supabase.from('tutorials').delete().eq('id', id)
    setTutorials(tutorials.filter(t => t.id !== id))
  }

  // Add step
  const addStep = () => {
    setNewTutorial({
      ...newTutorial,
      steps: [...newTutorial.steps, { text: '', image_url: '' }]
    })
  }

  // Update step
  const updateStep = (index: number, field: string, value: string) => {
    const newSteps = [...newTutorial.steps]
    newSteps[index] = { ...newSteps[index], [field]: value }
    setNewTutorial({ ...newTutorial, steps: newSteps })
  }

  // Remove step
  const removeStep = (index: number) => {
    setNewTutorial({
      ...newTutorial,
      steps: newTutorial.steps.filter((_, i) => i !== index)
    })
  }

  const iconOptions = ['📺', '📱', '🏠', '💊', '🎬', '📸', '🔧', '❓']

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">ניהול הדרכות</h1>
            <p className="text-sm text-gray-500">{tutorials.length} הדרכות</p>
          </div>
          <Link
            href="/dashboard/admin/gallery"
            className="px-4 py-2 bg-gray-100 rounded-xl text-sm hover:bg-gray-200"
          >
            גלריית תמונות
          </Link>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Categories Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800">קטגוריות</h2>
            <button
              onClick={() => setShowNewCategory(true)}
              className="p-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600"
            >
              <Plus size={20} />
            </button>
          </div>
          
          {showNewCategory && (
            <div className="mb-4 p-4 bg-gray-50 rounded-xl">
              <div className="flex gap-3 mb-3">
                <select
                  value={newCategoryIcon}
                  onChange={(e) => setNewCategoryIcon(e.target.value)}
                  className="p-2 border border-gray-200 rounded-xl text-2xl"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="שם הקטגוריה..."
                  className="flex-1 p-2 border border-gray-200 rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewCategory(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl"
                >
                  ביטול
                </button>
                <button
                  onClick={handleCreateCategory}
                  disabled={loading || !newCategoryName.trim()}
                  className="flex-1 py-2 bg-teal-500 text-white rounded-xl disabled:opacity-50"
                >
                  {loading ? '...' : 'שמור'}
                </button>
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl"
              >
                <span className="text-xl">{cat.icon}</span>
                <span>{cat.name}</span>
                <span className="text-xs text-gray-400">
                  ({tutorials.filter(t => t.category_id === cat.id).length})
                </span>
              </div>
            ))}
            {categories.length === 0 && !showNewCategory && (
              <p className="text-gray-400">אין קטגוריות עדיין</p>
            )}
          </div>
        </div>

        {/* Add Tutorial Button */}
        <button
          onClick={() => setShowNewTutorial(true)}
          className="w-full py-4 bg-purple-500 text-white rounded-2xl font-medium flex items-center justify-center gap-2 hover:bg-purple-600"
        >
          <Plus size={24} />
          הוסף הדרכה חדשה
        </button>

        {/* New Tutorial Form */}
        {showNewTutorial && (
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">הדרכה חדשה</h3>
              <button onClick={() => setShowNewTutorial(false)}>
                <X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <input
                type="text"
                value={newTutorial.title}
                onChange={(e) => setNewTutorial({ ...newTutorial, title: e.target.value })}
                placeholder="כותרת ההדרכה..."
                className="w-full p-3 border border-gray-200 rounded-xl"
              />
              
              <select
                value={newTutorial.category_id}
                onChange={(e) => setNewTutorial({ ...newTutorial, category_id: e.target.value })}
                className="w-full p-3 border border-gray-200 rounded-xl"
              >
                <option value="">בחר קטגוריה...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
              
              {/* Content Type */}
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTutorial({ ...newTutorial, content_type: 'images' })}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                    newTutorial.content_type === 'images' ? 'bg-purple-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <Image size={20} />
                  תמונות + טקסט
                </button>
                <button
                  onClick={() => setNewTutorial({ ...newTutorial, content_type: 'video' })}
                  className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 ${
                    newTutorial.content_type === 'video' ? 'bg-purple-500 text-white' : 'bg-gray-100'
                  }`}
                >
                  <Video size={20} />
                  סרטון
                </button>
              </div>
              
              {/* Video URL */}
              {newTutorial.content_type === 'video' && (
                <input
                  type="text"
                  value={newTutorial.video_url}
                  onChange={(e) => setNewTutorial({ ...newTutorial, video_url: e.target.value })}
                  placeholder="קישור ל-YouTube..."
                  className="w-full p-3 border border-gray-200 rounded-xl"
                />
              )}
              
              {/* Steps */}
              {newTutorial.content_type === 'images' && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-500">שלבים:</p>
                  {newTutorial.steps.map((step, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          type="text"
                          value={step.text}
                          onChange={(e) => updateStep(index, 'text', e.target.value)}
                          placeholder="תיאור השלב..."
                          className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                        />
                        <input
                          type="text"
                          value={step.image_url}
                          onChange={(e) => updateStep(index, 'image_url', e.target.value)}
                          placeholder="קישור לתמונה (אופציונלי)"
                          className="w-full p-2 border border-gray-200 rounded-xl text-sm"
                        />
                      </div>
                      {newTutorial.steps.length > 1 && (
                        <button
                          onClick={() => removeStep(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addStep}
                    className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-500"
                  >
                    + הוסף שלב
                  </button>
                </div>
              )}
              
              <button
                onClick={handleCreateTutorial}
                disabled={loading || !newTutorial.title.trim() || !newTutorial.category_id}
                className="w-full py-4 bg-purple-500 text-white rounded-xl font-medium disabled:opacity-50"
              >
                {loading ? 'שומר...' : 'שמור הדרכה'}
              </button>
            </div>
          </div>
        )}

        {/* Tutorials List */}
        <div className="space-y-3">
          <h2 className="font-bold text-gray-800">הדרכות קיימות</h2>
          
          {tutorials.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
              <Folder className="mx-auto text-gray-300 mb-3" size={48} />
              <p className="text-gray-500">אין הדרכות עדיין</p>
            </div>
          ) : (
            tutorials.map(tutorial => (
              <div
                key={tutorial.id}
                className="bg-white rounded-2xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tutorial.category?.icon || '📺'}</span>
                  <div className="flex-1">
                    <p className="font-medium">{tutorial.title}</p>
                    <p className="text-sm text-gray-500">
                      {tutorial.category?.name} • {tutorial.content_type === 'video' ? 'סרטון' : `${tutorial.steps?.length || 0} שלבים`}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteTutorial(tutorial.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
