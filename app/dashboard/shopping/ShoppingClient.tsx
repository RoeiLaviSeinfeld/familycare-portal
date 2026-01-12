'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowRight, Plus, ShoppingCart, Check, X,
  Package, Pill as PillIcon, MoreHorizontal
} from 'lucide-react'

interface ShoppingClientProps {
  member: any
  items: any[]
}

export default function ShoppingClient({
  member,
  items,
}: ShoppingClientProps) {
  const [showNewItem, setShowNewItem] = useState(false)
  const [newItemName, setNewItemName] = useState('')
  const [newItemCategory, setNewItemCategory] = useState<'groceries' | 'pharmacy' | 'other'>('groceries')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isEditor = member.role === 'admin' || member.role === 'editor'

  // Group items by status
  const openItems = items.filter(i => i.status === 'open')
  const boughtItems = items.filter(i => i.status === 'bought')

  // Handle marking item as bought
  const handleToggleBought = async (item: any) => {
    if (!isEditor) return
    
    const newStatus = item.status === 'bought' ? 'open' : 'bought'
    
    await supabase
      .from('shopping_items')
      .update({ status: newStatus })
      .eq('id', item.id)
    
    router.refresh()
  }

  // Handle creating new item
  const handleCreateItem = async () => {
    if (!newItemName.trim() || !isEditor) return
    
    setLoading(true)
    
    await supabase.from('shopping_items').insert({
      family_id: member.family_id,
      item: newItemName,
      category: newItemCategory,
      created_by: member.id,
      status: 'open',
    })
    
    setNewItemName('')
    setShowNewItem(false)
    setLoading(false)
    router.refresh()
  }

  // Handle delete item
  const handleDeleteItem = async (itemId: string) => {
    if (!isEditor) return
    
    await supabase
      .from('shopping_items')
      .delete()
      .eq('id', itemId)
    
    router.refresh()
  }

  const categoryIcons = {
    groceries: Package,
    pharmacy: PillIcon,
    other: MoreHorizontal,
  }

  const categoryLabels = {
    groceries: 'מכולת',
    pharmacy: 'בית מרקחת',
    other: 'אחר',
  }

  const categoryColors = {
    groceries: 'bg-green-100 text-green-600',
    pharmacy: 'bg-blue-100 text-blue-600',
    other: 'bg-gray-100 text-gray-600',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 -mr-2 hover:bg-gray-100 rounded-full">
            <ArrowRight size={24} />
          </Link>
          <div className="flex-1">
            <h1 className="font-bold text-lg">רשימת קניות</h1>
            <p className="text-sm text-gray-500">{openItems.length} פריטים</p>
          </div>
          {isEditor && (
            <button 
              onClick={() => setShowNewItem(true)}
              className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </header>

      {/* New Item Modal */}
      {showNewItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">פריט חדש</h2>
              <button onClick={() => setShowNewItem(false)}>
                <X size={24} />
              </button>
            </div>
            
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="שם הפריט..."
              className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-teal-500"
              autoFocus
            />
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">קטגוריה</p>
              <div className="flex gap-2">
                {(['groceries', 'pharmacy', 'other'] as const).map(cat => {
                  const Icon = categoryIcons[cat]
                  return (
                    <button
                      key={cat}
                      onClick={() => setNewItemCategory(cat)}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm transition-all ${
                        newItemCategory === cat 
                          ? 'bg-teal-500 text-white' 
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon size={18} />
                      {categoryLabels[cat]}
                    </button>
                  )
                })}
              </div>
            </div>
            
            <button
              onClick={handleCreateItem}
              disabled={!newItemName.trim() || loading}
              className="w-full py-4 bg-teal-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'מוסיף...' : 'הוסף פריט'}
            </button>
          </div>
        </div>
      )}

      {/* Items List */}
      <div className="p-4 pb-24">
        {/* Open Items */}
        {openItems.length === 0 && boughtItems.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <ShoppingCart className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">רשימת הקניות ריקה</p>
          </div>
        ) : (
          <>
            {openItems.length > 0 && (
              <div className="mb-6">
                <h2 className="font-bold text-gray-800 mb-3">לקנות ({openItems.length})</h2>
                <div className="space-y-2">
                  {openItems.map(item => {
                    const Icon = categoryIcons[item.category as keyof typeof categoryIcons] || Package
                    return (
                      <div 
                        key={item.id}
                        className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3"
                      >
                        <button
                          onClick={() => handleToggleBought(item)}
                          disabled={!isEditor}
                          className="w-6 h-6 border-2 border-gray-300 rounded-full flex items-center justify-center hover:border-teal-500 transition-colors"
                        />
                        
                        <div className="flex-1">
                          <p className="font-medium">{item.item}</p>
                          {item.notes && (
                            <p className="text-xs text-gray-500">{item.notes}</p>
                          )}
                        </div>
                        
                        <span className={`px-2 py-1 rounded-full text-xs ${categoryColors[item.category as keyof typeof categoryColors]}`}>
                          {categoryLabels[item.category as keyof typeof categoryLabels]}
                        </span>
                        
                        {isEditor && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Bought Items */}
            {boughtItems.length > 0 && (
              <div>
                <h2 className="font-bold text-gray-400 mb-3">נקנו ({boughtItems.length})</h2>
                <div className="space-y-2">
                  {boughtItems.map(item => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-3 opacity-60"
                    >
                      <button
                        onClick={() => handleToggleBought(item)}
                        disabled={!isEditor}
                        className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                      >
                        <Check size={14} className="text-white" />
                      </button>
                      
                      <p className="flex-1 line-through text-gray-400">{item.item}</p>
                      
                      {isEditor && (
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
