'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { Heart, Users } from 'lucide-react'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      setError('שגיאה בהתחברות. נסה שוב.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-primary flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md text-center">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 gradient-primary rounded-3xl flex items-center justify-center shadow-lg">
            <Heart className="text-white" size={48} fill="currentColor" />
          </div>
        </div>
        
        {/* Title */}
        <h1 className="text-3xl font-bold text-gray-800 mb-2">FamilyCare</h1>
        <p className="text-gray-500 mb-2">משפחת סיינפלד 🎭</p>
        <p className="text-sm text-gray-400 mb-8">ניהול בריאות ותפעול משפחתי</p>
        
        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {loading ? 'מתחבר...' : 'התחבר עם Google'}
        </button>
        
        {/* Family Members */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm mb-4">
            <Users size={16} />
            <span>חברי המשפחה</span>
          </div>
          <div className="flex justify-center gap-2">
            <span className="text-2xl" title="רועי">🎤</span>
            <span className="text-2xl" title="דניאל">🚪</span>
            <span className="text-2xl" title="אבשלום">📬</span>
            <span className="text-2xl" title="אלי">🦷</span>
            <span className="text-2xl" title="אמא">👓</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-400 mt-6">
          רק חברי משפחה מורשים יכולים להתחבר
        </p>
      </div>
    </div>
  )
}
