'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SeinfeldAvatar from '@/components/shared/SeinfeldAvatar'
import { 
  ArrowRight, Plus, CheckCircle2, Circle, Clock,
  AlertTriangle, Filter, X
} from 'lucide-react'

interface TasksClientProps {
  member: any
  familyMembers: any[]
  tasks: any[]
}

export default function TasksClient({
  member,
  familyMembers,
  tasks,
}: TasksClientProps) {
  const [filter, setFilter] = useState<'all' | 'mine' | 'completed'>('all')
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const isEditor = member.role === 'admin' || member.role === 'editor'

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    if (filter === 'mine') return task.owner_id === member.id
    if (filter === 'completed') return task.status === 'completed'
    return task.status !== 'completed' && task.status !== 'cancelled'
  })

  // Group tasks by status
  const tasksByStatus = {
    new: filteredTasks.filter(t => t.status === 'new'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    waiting: filteredTasks.filter(t => t.status === 'waiting'),
    completed: filteredTasks.filter(t => t.status === 'completed'),
  }

  // Handle task completion toggle
  const handleToggleComplete = async (task: any) => {
    if (!isEditor && task.owner_id !== member.id) return
    
    const newStatus = task.status === 'completed' ? 'new' : 'completed'
    
    await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', task.id)
    
    router.refresh()
  }

  // Handle new task creation
  const handleCreateTask = async () => {
    if (!newTaskTitle.trim() || !isEditor) return
    
    setLoading(true)
    
    await supabase.from('tasks').insert({
      family_id: member.family_id,
      title: newTaskTitle,
      priority: newTaskPriority,
      owner_id: member.id,
      created_by: member.id,
      status: 'new',
      is_mother_related: true,
    })
    
    setNewTaskTitle('')
    setShowNewTask(false)
    setLoading(false)
    router.refresh()
  }

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-green-500',
  }

  const priorityLabels = {
    high: 'גבוהה',
    medium: 'בינונית',
    low: 'נמוכה',
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
            <h1 className="font-bold text-lg">משימות</h1>
            <p className="text-sm text-gray-500">{filteredTasks.length} משימות</p>
          </div>
          {isEditor && (
            <button 
              onClick={() => setShowNewTask(true)}
              className="p-2 bg-teal-500 text-white rounded-full hover:bg-teal-600"
            >
              <Plus size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 bg-white border-b border-gray-100">
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'פתוחות' },
            { key: 'mine', label: 'שלי' },
            { key: 'completed', label: 'הושלמו' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as any)}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                filter === key 
                  ? 'bg-teal-500 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* New Task Modal */}
      {showNewTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg">משימה חדשה</h2>
              <button onClick={() => setShowNewTask(false)}>
                <X size={24} />
              </button>
            </div>
            
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="תיאור המשימה..."
              className="w-full p-4 border border-gray-200 rounded-xl mb-4 focus:outline-none focus:border-teal-500"
              autoFocus
            />
            
            <div className="mb-4">
              <p className="text-sm text-gray-500 mb-2">עדיפות</p>
              <div className="flex gap-2">
                {(['high', 'medium', 'low'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setNewTaskPriority(p)}
                    className={`flex-1 py-2 rounded-xl text-sm transition-all ${
                      newTaskPriority === p 
                        ? `${priorityColors[p]} text-white` 
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {priorityLabels[p]}
                  </button>
                ))}
              </div>
            </div>
            
            <button
              onClick={handleCreateTask}
              disabled={!newTaskTitle.trim() || loading}
              className="w-full py-4 bg-teal-500 text-white rounded-xl font-medium disabled:opacity-50"
            >
              {loading ? 'יוצר...' : 'צור משימה'}
            </button>
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="p-4 pb-24">
        {filteredTasks.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
            <CheckCircle2 className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">
              {filter === 'completed' ? 'אין משימות שהושלמו' : 'אין משימות פתוחות'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map(task => {
              const isCompleted = task.status === 'completed'
              const canEdit = isEditor || task.owner_id === member.id
              
              return (
                <div 
                  key={task.id}
                  className={`bg-white rounded-2xl p-4 shadow-sm transition-all ${
                    isCompleted ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleComplete(task)}
                      disabled={!canEdit}
                      className="mt-1"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : (
                        <Circle className="text-gray-300" size={24} />
                      )}
                    </button>
                    
                    <div className="flex-1">
                      <p className={`font-medium ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                        {task.title}
                      </p>
                      
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`w-2 h-2 rounded-full ${priorityColors[task.priority as keyof typeof priorityColors]}`} />
                        <span className="text-xs text-gray-500">{priorityLabels[task.priority as keyof typeof priorityLabels]}</span>
                        
                        {task.due_date && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={12} />
                            {new Date(task.due_date).toLocaleDateString('he-IL')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {task.owner && (
                      <SeinfeldAvatar 
                        character={task.owner.avatar_character} 
                        size={32} 
                      />
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
