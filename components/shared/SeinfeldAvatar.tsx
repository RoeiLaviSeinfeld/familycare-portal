'use client'

interface SeinfeldAvatarProps {
  character: string
  size?: number
  className?: string
}

export default function SeinfeldAvatar({ character, size = 40, className = '' }: SeinfeldAvatarProps) {
  const avatars: Record<string, { emoji: string; bg: string; name: string }> = {
    jerry: { emoji: '🎤', bg: 'bg-blue-100', name: "ג'רי" },
    kramer: { emoji: '🚪', bg: 'bg-orange-100', name: 'קריימר' },
    newman: { emoji: '📬', bg: 'bg-yellow-100', name: 'ניומן' },
    dentist: { emoji: '🦷', bg: 'bg-green-100', name: 'רופא השיניים' },
    jerrysMom: { emoji: '👓', bg: 'bg-pink-100', name: "אמא של ג'רי" },
  }

  const avatar = avatars[character] || avatars.jerry

  return (
    <div
      className={`${avatar.bg} rounded-full flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      title={avatar.name}
    >
      <span style={{ fontSize: size * 0.5 }}>{avatar.emoji}</span>
    </div>
  )
}

export function getAvatarInfo(character: string) {
  const avatars: Record<string, { emoji: string; bg: string; name: string; color: string }> = {
    jerry: { emoji: '🎤', bg: 'bg-blue-100', name: "ג'רי", color: 'blue' },
    kramer: { emoji: '🚪', bg: 'bg-orange-100', name: 'קריימר', color: 'orange' },
    newman: { emoji: '📬', bg: 'bg-yellow-100', name: 'ניומן', color: 'yellow' },
    dentist: { emoji: '🦷', bg: 'bg-green-100', name: 'רופא השיניים', color: 'green' },
    jerrysMom: { emoji: '👓', bg: 'bg-pink-100', name: "אמא של ג'רי", color: 'pink' },
  }
  return avatars[character] || avatars.jerry
}
