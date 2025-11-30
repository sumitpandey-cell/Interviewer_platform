# System Overview - AI Interviewer Platform

## What is This Application?

This is an **AI-powered technical interview platform** that simulates real technical interviews using voice interaction. Think of it as having a professional interviewer available 24/7 who can:

- Conduct technical interviews via voice
- Ask follow-up questions based on your answers
- Adjust difficulty based on your performance
- Provide detailed feedback and analysis
- Track your progress over time

---

## Who is This For?

### Candidates
- Practice technical interviews anytime
- Get instant AI feedback
- Track performance improvements
- Prepare for real interviews

### Companies
- Screen candidates efficiently
- Standardize interview process
- Get detailed candidate reports
- Save interviewer time

---

## How Does It Work? (Simple Explanation)

### 1. **You Start an Interview**
- Choose interview type (Technical, Behavioral, Coding, etc.)
- Select position (Frontend, Backend, Full Stack, etc.)
- Click "Start Interview"

### 2. **AI Asks Questions**
- AI speaks questions to you (like a real interviewer)
- You answer using your voice
- AI listens and understands your response

### 3. **Dynamic Adjustment**
- If you're doing well → Questions get harder
- If you're struggling → Questions get easier
- AI adapts in real-time

### 4. **Get Feedback**
- After interview, AI analyzes your performance
- Provides detailed feedback on strengths/weaknesses
- Gives actionable improvement suggestions
- Shows skill breakdown with scores

---

## Core Features Explained

### 🎙️ Voice Interaction
**What**: Talk to AI like a real interviewer
**How**: Uses Google Gemini Live API for natural conversation
**Why**: More realistic than typing, tests communication skills

### 📊 Performance Tracking
**What**: Tracks how well you answer each question
**How**: AI evaluates response quality, timing, clarity
**Why**: Provides data-driven feedback

### 🎯 Dynamic Difficulty
**What**: Questions adapt to your skill level
**How**: Algorithm adjusts based on recent performance
**Why**: Keeps interview challenging but fair

### 💻 Coding Challenges
**What**: Write and run code during interview
**How**: Monaco editor with test case execution
**Why**: Tests practical coding skills

### 📈 Analytics Dashboard
**What**: View all past interviews and trends
**How**: Charts and metrics from database
**Why**: Track improvement over time

---

## Technical Architecture (Beginner-Friendly)

### Frontend (What You See)
```
User Interface (React)
    ↓
Components (Buttons, Cards, etc.)
    ↓
Pages (Dashboard, Interview, Reports)
```

**Technologies:**
- **React**: JavaScript library for building UI
- **TypeScript**: JavaScript with type safety
- **Tailwind CSS**: Utility-first styling
- **shadcn/ui**: Pre-built beautiful components

### Backend (Behind the Scenes)
```
Database (Supabase)
    ↓
Stores Interview Data
    ↓
Provides to Frontend
```

**Technologies:**
- **Supabase**: Database + Authentication
- **PostgreSQL**: Actual database engine

### AI Services (The Brain)
```
Your Voice
    ↓
Gemini Live API (Speech-to-Text + AI)
    ↓
AI Processes & Responds
    ↓
Text-to-Speech
    ↓
You Hear Response
```

**Technologies:**
- **Gemini API**: Google's AI for conversation
- **Live API**: Real-time voice interaction

---

## Data Flow Example

Let's trace what happens when you answer a question:

```
1. You speak: "React uses virtual DOM for performance"
   ↓
2. Gemini Live API converts speech to text
   ↓
3. Text sent to AI for evaluation
   ↓
4. AI analyzes:
   - Is answer correct? ✓
   - Is it detailed enough? ✓
   - Response time? 15 seconds
   ↓
5. Performance score calculated: 85/100
   ↓
6. Stored in database
   ↓
7. Difficulty adjusted (if needed)
   ↓
8. AI asks next question
```

---

## Key Concepts for Beginners

### 1. **State Management (Zustand)**
**What**: Stores data that multiple components need
**Example**: Current interview session, user info, performance data
**Why**: Avoids passing data through many components

### 2. **API Integration**
**What**: Communicating with external services
**Example**: Sending questions to Gemini, saving to Supabase
**Why**: Leverage powerful external services

### 3. **Real-time Updates**
**What**: UI updates instantly when data changes
**Example**: Performance score updates as you answer
**Why**: Better user experience

### 4. **Authentication**
**What**: User login/signup system
**Example**: Email/password or Google sign-in
**Why**: Personalized experience, save progress

---

## File Structure Explained

```
src/
├── components/          # Reusable UI pieces
│   ├── ui/             # Basic components (Button, Card)
│   └── ...             # Custom components (Avatar, CodeEditor)
│
├── pages/              # Full page views
│   ├── Dashboard.tsx   # Main dashboard
│   ├── InterviewRoom.tsx  # Active interview
│   └── InterviewReport.tsx # Results page
│
├── lib/                # Business logic (the "brain")
│   ├── gemini-feedback.ts    # AI feedback generation
│   ├── performance-tracker.ts # Score calculation
│   └── ai-response-evaluator.ts # Answer evaluation
│
├── stores/             # Global state
│   ├── use-interview-store.ts  # Interview data
│   └── use-performance-store.ts # Performance data
│
├── hooks/              # Reusable logic
│   ├── use-live-api.ts       # Voice interaction
│   └── use-speech-recognition.ts # Speech input
│
└── types/              # TypeScript definitions
    └── ...             # Type definitions
```

---

## How Components Work Together

```
┌─────────────────────────────────────────┐
│         Dashboard (Page)                │
│  Shows: Recent interviews, stats        │
│  Uses: InterviewCard, StatsCard         │
└─────────────────────────────────────────┘
                  │
                  ▼ (User clicks "Start Interview")
┌─────────────────────────────────────────┐
│       InterviewRoom (Page)              │
│  Shows: AI avatar, transcript           │
│  Uses: Avatar, TranscriptPanel          │
│  Hooks: useLiveAPI, usePerformance      │
└─────────────────────────────────────────┘
                  │
                  ▼ (Interview ends)
┌─────────────────────────────────────────┐
│      InterviewReport (Page)             │
│  Shows: Scores, feedback, transcript    │
│  Uses: SkillsChart, FeedbackCard        │
└─────────────────────────────────────────┘
```

---

## Common Workflows

### Starting an Interview
1. User logs in → `AuthContext` verifies
2. Dashboard loads → `useOptimizedQueries` fetches data
3. User clicks "Start" → `InterviewRoom` component mounts
4. `useLiveAPI` hook connects to Gemini
5. Interview begins

### Answering a Question
1. User speaks → `useLiveAPI` captures audio
2. Gemini converts to text → Displayed in transcript
3. `recordResponse` called → Saves to `usePerformanceStore`
4. AI evaluates → `evaluateResponseQuality` runs
5. Score calculated → Performance updated
6. Next question generated

### Viewing Results
1. Interview ends → Data saved to Supabase
2. Navigate to report → `InterviewReport` loads
3. Fetch session data → `fetchSessionDetail` runs
4. Generate feedback → `generateFeedback` called
5. Display results → Charts and cards render

---

## Important Concepts

### 1. **Hooks** (React)
Functions that let you use React features:
- `useState`: Store component data
- `useEffect`: Run code on mount/update
- `useRef`: Store values that don't trigger re-render

### 2. **Async/Await**
Handle asynchronous operations:
```typescript
async function fetchData() {
  const data = await supabase.from('table').select();
  return data;
}
```

### 3. **TypeScript Types**
Define data structures:
```typescript
interface User {
  id: string;
  name: string;
  email: string;
}
```

### 4. **Components**
Reusable UI pieces:
```tsx
function Button({ text, onClick }) {
  return <button onClick={onClick}>{text}</button>;
}
```

---

## Next Steps for Beginners

1. **Read**: [GETTING_STARTED.md](./GETTING_STARTED.md) - Set up the project
2. **Explore**: [INTERVIEW_FLOW.md](./INTERVIEW_FLOW.md) - Understand core feature
3. **Study**: [COMPONENTS.md](./COMPONENTS.md) - Learn UI structure
4. **Practice**: Make small changes and see results

---

## Glossary

- **API**: Application Programming Interface (way to communicate with services)
- **Component**: Reusable piece of UI
- **Hook**: React function for using features
- **State**: Data that can change over time
- **Props**: Data passed to components
- **Store**: Global state accessible anywhere
- **Migration**: Database schema change
- **Supabase**: Backend-as-a-Service platform
- **Gemini**: Google's AI model
- **Live API**: Real-time voice interaction API

---

**Questions?** Check other documentation files or the troubleshooting guide!
