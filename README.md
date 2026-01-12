# 🏥 FamilyCare Portal - משפחת סיינפלד 🎭

אפליקציית ניהול בריאות ותפעול משפחתי

## ✨ פיצ'רים

- 📱 **PWA** - מותקנת כאפליקציה על הטלפון
- 🔐 **Google SSO** - התחברות מאובטחת
- 💊 **ניהול תרופות** - מעקב בוקר וערב
- 📅 **יומן** - תורנויות, אירועים, חגים
- ✅ **משימות** - ניהול משימות משפחתיות  
- 🛒 **קניות** - רשימת קניות משותפת
- 🔔 **התראות** - תזכורות לתרופות

## 🚀 התקנה

### 1. הגדרות Environment

צור קובץ `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. התקנה

```bash
npm install
npm run dev
```

### 3. Deploy ל-Vercel

1. העלה ל-GitHub
2. חבר ל-Vercel
3. הגדר Environment Variables
4. Deploy!

## 👥 בני המשפחה

| שם | תפקיד | דמות |
|---|---|---|
| 🎤 רועי | Admin | ג'רי |
| 🚪 דניאל | Editor | קריימר |
| 📬 אבשלום | Editor | ניומן |
| 🦷 אלי | Editor | רופא השיניים |
| 👓 אמא | Viewer | אמא של ג'רי |

## 📁 מבנה הפרויקט

```
app/
├── auth/           # Login, OAuth callback
├── dashboard/      # Main app pages
│   ├── calendar/   # Calendar view
│   ├── medications/# Meds tracking
│   ├── tasks/      # Task management
│   ├── shopping/   # Shopping list
│   └── settings/   # User settings
components/
├── shared/         # Shared components
lib/
├── supabase/       # Supabase clients
```

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** Vercel
- **Icons:** Lucide React

---

Made with ❤️ for משפחת סיינפלד
