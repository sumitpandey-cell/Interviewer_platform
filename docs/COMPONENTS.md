# Component Architecture

## Overview

This document explains all the React components in the application, their purpose, props, and how they work together.

---

## Component Hierarchy

```
App
├── AuthProvider
│   └── Router
│       ├── Landing Page
│       ├── Auth Pages (Login/Signup)
│       └── DashboardLayout
│           ├── Header
│           ├── Sidebar
│           └── Page Content
│               ├── Dashboard
│               ├── InterviewRoom
│               ├── InterviewReport
│               ├── Reports
│               └── Templates
```

---

## Core Layout Components

### DashboardLayout

**File**: `src/components/DashboardLayout.tsx`

**Purpose**: Provides consistent layout for all authenticated pages

**Structure**:
```tsx
<div className="dashboard-layout">
  <Header />
  <div className="content-wrapper">
    <Sidebar />
    <main>{children}</main>
  </div>
</div>
```

**Features**:
- Responsive sidebar (collapsible on mobile)
- Dark mode toggle
- User menu
- Navigation links

---

### Header

**File**: `src/components/Header.tsx`

**Props**:
```typescript
interface HeaderProps {
  onMenuClick?: () => void;  // Mobile menu toggle
}
```

**Features**:
- Logo and branding
- Dark mode toggle
- User profile dropdown
- Notifications (if enabled)
- Logout button

---

### Sidebar

**File**: `src/components/Sidebar.tsx`

**Props**:
```typescript
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Navigation Items**:
- Dashboard
- Start Interview
- My Reports
- Templates
- Settings

---

## Page Components

### Dashboard

**File**: `src/pages/Dashboard.tsx`

**Purpose**: Main landing page after login

**Sections**:
1. **Welcome Header**: User greeting, quick stats
2. **Quick Actions**: Start interview buttons
3. **Recent Interviews**: Last 5 interviews
4. **Performance Stats**: Charts and metrics

**Key Components Used**:
- `InterviewCard` - Display interview summary
- `StatsCard` - Show statistics
- `PerformanceChart` - Visualize trends

**Example**:
```tsx
export default function Dashboard() {
  const { user } = useAuth();
  const { sessions, loading } = useOptimizedQueries();
  
  return (
    <DashboardLayout>
      <div className="dashboard">
        {/* Welcome Section */}
        <section className="welcome">
          <h1>Welcome back, {user.name}!</h1>
          <p>Ready for your next interview?</p>
        </section>
        
        {/* Quick Actions */}
        <section className="quick-actions">
          <Button onClick={() => startInterview('technical')}>
            Technical Interview
          </Button>
          <Button onClick={() => startInterview('behavioral')}>
            Behavioral Interview
          </Button>
        </section>
        
        {/* Recent Interviews */}
        <section className="recent">
          <h2>Recent Interviews</h2>
          {sessions.map(session => (
            <InterviewCard key={session.id} session={session} />
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
```

---

### InterviewRoom

**File**: `src/pages/InterviewRoom.tsx`

**Purpose**: Active interview interface

**Sections**:
1. **Avatar**: AI interviewer visual
2. **Transcript**: Conversation history
3. **Controls**: Mic, end interview
4. **Performance Indicator**: Real-time score

**Key Hooks**:
- `useLiveAPI` - Voice interaction
- `usePerformanceStore` - Track metrics
- `useInterviewStore` - Manage state

**State Management**:
```typescript
// Local state
const [isRecording, setIsRecording] = useState(false);
const [elapsedTime, setElapsedTime] = useState(0);

// Refs for performance tracking
const currentQuestionTextRef = useRef<string>('');
const currentUserResponseRef = useRef<string>('');
const questionStartTimeRef = useRef<number>(Date.now());

// Zustand stores
const { messages, addMessage } = useInterviewStore();
const { recordResponse, getCurrentPerformance } = usePerformanceStore();
```

**Example Structure**:
```tsx
<div className="interview-room">
  {/* Header with timer and controls */}
  <header>
    <Timer elapsed={elapsedTime} />
    <Button onClick={handleEndCall}>End Interview</Button>
  </header>
  
  {/* Main content */}
  <div className="content">
    {/* Left: Avatar */}
    <div className="avatar-section">
      <Avatar isListening={isListening} isSpeaking={isSpeaking} />
    </div>
    
    {/* Right: Transcript */}
    <div className="transcript-section">
      <TranscriptPanel messages={messages} />
    </div>
  </div>
  
  {/* Footer with performance */}
  <footer>
    <PerformanceIndicator />
  </footer>
</div>
```

---

### InterviewReport

**File**: `src/pages/InterviewReport.tsx`

**Purpose**: Display interview results and feedback

**Tabs**:
1. **Summary**: Overview, scores, feedback
2. **Skills Analysis**: Detailed skill breakdown
3. **Video Playback**: (Future feature)
4. **Full Transcript**: Complete conversation

**Key Features**:
- Download report as HTML
- Copy transcript to clipboard
- Delete interview
- Radar chart for skills

**Example**:
```tsx
<DashboardLayout>
  <div className="report">
    {/* Header */}
    <Card>
      <h1>{candidateName}</h1>
      <p>{position}</p>
      <div className="score">{overallScore}%</div>
      <Button onClick={downloadReport}>Download Report</Button>
    </Card>
    
    {/* Tabs */}
    <Tabs defaultValue="summary">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="skills">Skills Analysis</TabsTrigger>
        <TabsTrigger value="transcript">Transcript</TabsTrigger>
      </TabsList>
      
      <TabsContent value="summary">
        <ExecutiveSummary />
        <StrengthsAndImprovements />
        <ActionPlan />
      </TabsContent>
      
      <TabsContent value="skills">
        <SkillsRadarChart />
        <DetailedSkillCards />
      </TabsContent>
      
      <TabsContent value="transcript">
        <TranscriptView messages={transcript} />
      </TabsContent>
    </Tabs>
  </div>
</DashboardLayout>
```

---

## Reusable UI Components

### Avatar

**File**: `src/components/Avatar.tsx`

**Props**:
```typescript
interface AvatarProps {
  isListening: boolean;
  isSpeaking: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Features**:
- Animated when speaking
- Pulse effect when listening
- Idle state animation

**Implementation**:
```tsx
export function Avatar({ isListening, isSpeaking, size = 'md' }: AvatarProps) {
  return (
    <div className={cn(
      'avatar',
      size === 'lg' && 'w-64 h-64',
      size === 'md' && 'w-32 h-32',
      size === 'sm' && 'w-16 h-16',
      isListening && 'listening',
      isSpeaking && 'speaking'
    )}>
      <div className="avatar-circle">
        <Bot className="avatar-icon" />
      </div>
      {isListening && <div className="pulse-ring" />}
      {isSpeaking && <div className="sound-waves" />}
    </div>
  );
}
```

---

### TranscriptPanel

**File**: `src/components/TranscriptPanel.tsx`

**Props**:
```typescript
interface TranscriptPanelProps {
  messages: Message[];
  autoScroll?: boolean;
}

interface Message {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
}
```

**Features**:
- Auto-scroll to latest message
- Different styling for user/AI
- Timestamp display
- Copy message functionality

**Implementation**:
```tsx
export function TranscriptPanel({ messages, autoScroll = true }: TranscriptPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, autoScroll]);
  
  return (
    <div ref={scrollRef} className="transcript-panel">
      {messages.map(msg => (
        <div key={msg.id} className={cn(
          'message',
          msg.sender === 'ai' ? 'message-ai' : 'message-user'
        )}>
          <div className="message-header">
            <span className="sender">
              {msg.sender === 'ai' ? 'AI Interviewer' : 'You'}
            </span>
            {msg.timestamp && (
              <span className="timestamp">{msg.timestamp}</span>
            )}
          </div>
          <div className="message-text">{msg.text}</div>
        </div>
      ))}
    </div>
  );
}
```

---

### PerformanceIndicator

**File**: `src/components/PerformanceIndicator.tsx`

**Purpose**: Show real-time performance during interview

**Features**:
- Current score (0-100)
- Trend indicator (↑↓→)
- Difficulty level
- Questions answered

**Implementation**:
```tsx
export function PerformanceIndicator() {
  const { currentAnalysis, performanceHistory, currentDifficulty } = usePerformanceStore();
  
  if (!currentAnalysis) return null;
  
  const { currentScore, trend } = currentAnalysis;
  
  return (
    <Card className="performance-indicator">
      <div className="score-section">
        <CircularProgress value={currentScore} />
        <div className="score-label">
          <span className="score-value">{currentScore}</span>
          <span className="score-max">/100</span>
        </div>
      </div>
      
      <div className="trend-section">
        {trend === 'improving' && <TrendingUp className="text-green-500" />}
        {trend === 'declining' && <TrendingDown className="text-red-500" />}
        {trend === 'stable' && <Minus className="text-yellow-500" />}
        <span>{trend}</span>
      </div>
      
      <div className="stats">
        <div className="stat">
          <span className="label">Difficulty</span>
          <Badge>{currentDifficulty}</Badge>
        </div>
        <div className="stat">
          <span className="label">Questions</span>
          <span className="value">{performanceHistory.length}</span>
        </div>
      </div>
    </Card>
  );
}
```

---

### CodeEditor

**File**: `src/components/CodeEditor.tsx`

**Props**:
```typescript
interface CodeEditorProps {
  language: string;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  theme?: 'light' | 'dark';
}
```

**Features**:
- Syntax highlighting
- Auto-completion
- Error detection
- Multiple language support

**Implementation** (using Monaco Editor):
```tsx
import Editor from '@monaco-editor/react';

export function CodeEditor({ language, value, onChange, readOnly, theme }: CodeEditorProps) {
  return (
    <Editor
      height="400px"
      language={language}
      value={value}
      onChange={(newValue) => onChange(newValue || '')}
      theme={theme === 'dark' ? 'vs-dark' : 'vs-light'}
      options={{
        readOnly,
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true
      }}
    />
  );
}
```

---

## shadcn/ui Components

These are pre-built components from shadcn/ui library:

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default">Click me</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost">Link</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Tabs

```tsx
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">Tab 1</TabsTrigger>
    <TabsTrigger value="tab2">Tab 2</TabsTrigger>
  </TabsList>
  <TabsContent value="tab1">Content 1</TabsContent>
  <TabsContent value="tab2">Content 2</TabsContent>
</Tabs>
```

### Dialog

```tsx
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    <p>Dialog content</p>
  </DialogContent>
</Dialog>
```

---

## Component Best Practices

### 1. Props Interface
Always define TypeScript interfaces for props:
```typescript
interface MyComponentProps {
  title: string;
  count?: number;  // Optional
  onAction: () => void;
}
```

### 2. Default Props
Use default parameters:
```typescript
function MyComponent({ title, count = 0 }: MyComponentProps) {
  // ...
}
```

### 3. Conditional Rendering
Use early returns for loading/error states:
```typescript
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
return <ActualContent />;
```

### 4. Event Handlers
Prefix with `handle`:
```typescript
const handleClick = () => { /* ... */ };
const handleSubmit = (e: FormEvent) => { /* ... */ };
```

### 5. Refs
Use refs for DOM access and values that don't trigger re-renders:
```typescript
const inputRef = useRef<HTMLInputElement>(null);
const timerRef = useRef<number>(0);
```

---

## Component Communication

### Parent to Child (Props)
```tsx
<ChildComponent data={parentData} onAction={handleAction} />
```

### Child to Parent (Callbacks)
```tsx
// Parent
const handleData = (data: string) => {
  console.log(data);
};

<ChildComponent onData={handleData} />

// Child
props.onData('some data');
```

### Sibling Components (Shared State)
```tsx
// Use Zustand store
const { data, setData } = useMyStore();

// Component A
<button onClick={() => setData('new value')}>Update</button>

// Component B
<div>{data}</div>
```

---

## Next Steps

- Read [STATE_MANAGEMENT.md](./STATE_MANAGEMENT.md) for Zustand stores
- Read [INTERVIEW_FLOW.md](./INTERVIEW_FLOW.md) for page interactions
- Check shadcn/ui docs: https://ui.shadcn.com/
