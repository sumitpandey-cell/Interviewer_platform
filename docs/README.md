# AI Interviewer Platform - Complete Documentation

## 📚 Table of Contents

1. [Overview](#overview)
2. [Documentation Files](#documentation-files)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)

---

## Overview

This is an **AI-powered interview platform** that conducts technical interviews using voice interaction, real-time performance tracking, and intelligent difficulty adjustment. The platform provides detailed feedback and analytics for candidates.

**Key Features:**
- 🎙️ Voice-based interviews with AI
- 📊 Real-time performance tracking
- 🎯 Dynamic difficulty adjustment
- 💻 Coding challenges with live editor
- 📈 Detailed feedback and analytics
- 🌙 Dark mode support
- 📱 Responsive design

---

## Documentation Files

### Core Documentation
- **[OVERVIEW.md](./OVERVIEW.md)** - High-level system overview and architecture
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Setup and installation guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed system architecture

### Feature Documentation
- **[INTERVIEW_FLOW.md](./INTERVIEW_FLOW.md)** - How interviews work end-to-end
- **[PERFORMANCE_TRACKING.md](./PERFORMANCE_TRACKING.md)** - Performance analysis system
- **[FEEDBACK_SYSTEM.md](./FEEDBACK_SYSTEM.md)** - AI feedback generation
- **[CODING_CHALLENGES.md](./CODING_CHALLENGES.md)** - Code editor and execution

### Technical Documentation
- **[DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** - Database structure and tables
- **[API_INTEGRATION.md](./API_INTEGRATION.md)** - External API integrations
- **[STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md)** - Zustand stores explained
- **[COMPONENTS.md](./COMPONENTS.md)** - React components guide

### Developer Guides
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - How to contribute
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide

---

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd interviewer

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Run database migrations
# (Instructions in GETTING_STARTED.md)

# 5. Start development server
npm run dev
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE                        │
│  (React + TypeScript + Tailwind + shadcn/ui)            │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  STATE MANAGEMENT                        │
│  (Zustand Stores: Interview, Performance, Auth)         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   CORE SERVICES                          │
│  • Live API (Gemini Voice)                              │
│  • Performance Tracker                                   │
│  • Feedback Generator                                    │
│  • Code Executor                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  EXTERNAL SERVICES                       │
│  • Supabase (Database + Auth)                           │
│  • Gemini API (AI + Voice)                              │
│  • OpenAI API (Fallback)                                │
└─────────────────────────────────────────────────────────┘
```

---

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, shadcn/ui
- **State**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Google Gemini API
- **Voice**: Gemini Live API
- **Code Editor**: Monaco Editor

---

## Project Structure

```
interviewer/
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/          # Page components (routes)
│   ├── lib/            # Core business logic
│   ├── hooks/          # Custom React hooks
│   ├── stores/         # Zustand state stores
│   ├── contexts/       # React contexts
│   ├── types/          # TypeScript types
│   └── prompts/        # AI system prompts
├── docs/               # Documentation (you are here)
├── supabase/          # Database migrations
└── public/            # Static assets
```

---

## Next Steps

1. Read [GETTING_STARTED.md](./GETTING_STARTED.md) for setup
2. Understand [INTERVIEW_FLOW.md](./INTERVIEW_FLOW.md) for core functionality
3. Explore [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
4. Check [COMPONENTS.md](./COMPONENTS.md) for UI components

---

**Need Help?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or open an issue.
