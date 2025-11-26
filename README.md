# 🎯 Aura - AI Interview Practice Platform

An intelligent AI-powered interview practice platform that helps job seekers ace their interviews with personalized feedback, real-time coaching, and progress tracking.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg)
![Supabase](https://img.shields.io/badge/Supabase-Latest-3ecf8e.svg)

## ✨ Features

### 🤖 AI-Powered Interviews
- Practice with advanced AI that simulates real interview scenarios
- Adaptive questioning based on your responses
- Natural conversation flow with voice interaction

### 📊 Personalized Feedback
- Detailed analysis of your interview performance
- Actionable improvement suggestions
- Strengths and weaknesses identification

### 📈 Progress Tracking
- Monitor your performance over time
- Track your interview streak
- View comprehensive reports and analytics

### 🎯 Real-Time Coaching
- Get intelligent guidance during practice sessions
- Learn on the go with contextual tips
- Improve your responses in real-time

### 🏆 Gamification
- Earn badges and achievements
- Compete on the leaderboard
- Stay motivated with daily streaks

### 💎 Premium Features
- 30 minutes of free daily practice
- Multiple interview templates
- Customizable interview settings

## 🚀 Tech Stack

### Frontend
- **React 18.3** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **React Router** - Navigation
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend & Services
- **Supabase** - Backend as a Service
  - Authentication
  - PostgreSQL Database
  - Row Level Security (RLS)
  - Storage (for profile images)
- **Google Gemini AI** - AI interview agent
- **Web Speech API** - Voice recognition

### Key Libraries
- `@google/generative-ai` - Gemini AI integration
- `browser-image-compression` - Image optimization
- `sonner` - Toast notifications
- `lucide-react` - Icons

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Google Gemini API key

### Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-interview-hub
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Variables**

Create a `.env.local` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_ADMIN_EMAILS=admin@example.com
```

4. **Database Setup**

Run the migrations in your Supabase SQL editor (located in `supabase/migrations/`):
- Create profiles table
- Create interview_sessions table
- Set up RLS policies
- Create storage bucket for avatars
- Set up streak tracking

5. **Start Development Server**
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 🏗️ Project Structure

```
ai-interview-hub/
├── src/
│   ├── assets/          # Images and static files
│   ├── components/      # React components
│   │   └── ui/         # shadcn/ui components
│   ├── contexts/       # React contexts (Auth, etc.)
│   ├── hooks/          # Custom React hooks
│   ├── integrations/   # External service integrations
│   │   └── supabase/  # Supabase client and types
│   ├── lib/           # Utility functions
│   ├── pages/         # Page components
│   └── main.tsx       # App entry point
├── supabase/
│   └── migrations/    # Database migrations
└── public/           # Public assets
```

## 🎨 Key Features Implementation

### Authentication
- Email/password signup and login
- Google OAuth integration
- Profile image upload with compression
- User metadata management

### Interview System
- AI-powered voice interviews using Gemini
- Real-time transcription
- Session recording and playback
- Comprehensive feedback generation

### Dashboard
- Interview history
- Performance metrics
- Streak tracking with hover details
- Quick access to templates

### Settings
- Profile management
- Avatar upload and update
- Password change
- Notification preferences

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Secure authentication with Supabase Auth
- API keys stored in environment variables
- Image uploads restricted to authenticated users

## 🚢 Deployment

### Build for Production
```bash
npm run build
```

The build output will be in the `dist/` directory.

### Deploy to Vercel/Netlify
1. Connect your repository
2. Set environment variables
3. Deploy!

## 📝 Database Schema

### Profiles Table
- `id` - User ID (UUID)
- `full_name` - User's full name
- `avatar_url` - Profile image URL
- `streak_count` - Current streak
- `last_activity_date` - Last interview date

### Interview Sessions Table
- `id` - Session ID (UUID)
- `user_id` - User reference
- `job_title` - Interview position
- `difficulty` - Interview difficulty level
- `duration` - Session duration
- `transcript` - Interview transcript
- `feedback` - AI feedback
- `score` - Performance score
- `created_at` - Session timestamp

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful UI components
- [Supabase](https://supabase.com/) for the backend infrastructure
- [Google Gemini](https://deepmind.google/technologies/gemini/) for the AI capabilities

---

Built with ❤️ by the Aura team
