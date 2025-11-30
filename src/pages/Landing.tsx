import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, MessageSquare, Award, Zap, CheckCircle2, ArrowRight, Sparkles, Users, Clock, Star, Menu, X, Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight;

      setScrolled(scrollY > 20);
      // Hide navbar when scrolled past the hero section (with a small buffer)
      setHidden(scrollY > heroHeight - 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Interviews",
      description: "Practice with advanced AI that adapts to your responses and simulates real interview scenarios",
      gradient: "from-indigo-500 to-purple-500",
    },
    {
      icon: Target,
      title: "Personalized Feedback",
      description: "Get detailed analysis with actionable improvement suggestions after each session",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your performance metrics and see measurable improvement over time",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Coaching",
      description: "Receive intelligent guidance during practice sessions to learn on the go",
      gradient: "from-cyan-500 to-blue-500",
    },
    {
      icon: Award,
      title: "Earn Achievements",
      description: "Unlock badges and milestones as you master different interview skills",
      gradient: "from-blue-500 to-indigo-500",
    },
    {
      icon: Zap,
      title: "Daily Free Practice",
      description: "Get 30 minutes of free daily practice time to perfect your skills",
      gradient: "from-yellow-500 to-orange-500",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Choose Your Role",
      description: "Select the job position you're preparing for",
      icon: Target,
    },
    {
      number: "02",
      title: "Start Interview",
      description: "Begin your AI-powered practice session",
      icon: MessageSquare,
    },
    {
      number: "03",
      title: "Get Feedback",
      description: "Receive detailed analysis and improvement tips",
      icon: TrendingUp,
    },
    {
      number: "04",
      title: "Improve & Repeat",
      description: "Track progress and keep practicing",
      icon: Award,
    },
  ];

  const testimonials = [
    {
      text: "I was skeptical about AI interviews at first, but Aura blew me away. The voice interaction feels so natural, and the feedback on my tone and pacing was something I couldn't get from just practicing with friends. It really helped me polish my soft skills for the Google behavioral round.",
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
    {
      text: "The system design templates are gold. I used to struggle with structuring my answers, but the step-by-step guidance here gave me a solid framework. I felt much more in control during my actual interview at Meta. Definitely worth it.",
      name: "Michael Rodriguez",
      role: "Product Manager at Meta",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
    {
      text: "What I love is the specificity of the feedback. It doesn't just say 'good job', it points out exactly where I missed an edge case or could have optimized my code better. It's like having a senior engineer reviewing your code 24/7.",
      name: "Priya Sharma",
      role: "Data Scientist at Amazon",
      image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
    {
      text: "As a UX designer, I get nervous explaining my design decisions. Aura helped me practice articulating my thought process clearly. The 'why' behind the design is just as important as the design itself, and this tool really gets that.",
      name: "James Wilson",
      role: "UX Designer at Apple",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
    {
      text: "I had a gap in my resume and was terrified of the 'tell me about yourself' question. I practiced it 50 times on Aura until I nailed the delivery. The confidence boost was real, and I think that's what got me the offer.",
      name: "Emily Taylor",
      role: "Marketing Manager at Netflix",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
    {
      text: "The daily challenges kept me consistent. It's easy to slack off on prep, but seeing my streak grow and my scores improve became a fun little game. It turned a stressful process into something actually manageable.",
      name: "David Kim",
      role: "Senior Dev at Microsoft",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=faces",
      rating: 5,
    },
  ];

  const stats = [
    { value: "50K+", label: "Active Users" },
    { value: "500K+", label: "Interviews Completed" },
    { value: "95%", label: "Success Rate" },
    { value: "4.9/5", label: "User Rating" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 overflow-x-hidden">
      {/* Navbar */}
      {/* Navbar */}
      <header
        className={`fixed left-0 right-0 z-50 transition-all duration-500 ease-in-out ${hidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"
          } ${scrolled
            ? "top-4 flex justify-center px-4"
            : "top-0 py-6"
          }`}
      >
        <div
          className={`transition-all duration-500 ease-in-out flex items-center justify-between ${scrolled
            ? "bg-[#0f1117]/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-full px-6 py-3 w-full max-w-4xl ring-1 ring-white/5"
            : "w-full container mx-auto px-6 bg-transparent border-transparent border ring-0"
            }`}
        >
          <Link to="/" className="flex items-center gap-2 text-xl font-bold group">
            <div className="relative">
              <Brain className={`h-8 w-8 transition-colors duration-300 ${scrolled ? "text-indigo-400" : "text-white"}`} />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className={`bg-clip-text text-transparent transition-all duration-300 ${scrolled
              ? "bg-gradient-to-r from-indigo-400 to-purple-400"
              : "bg-gradient-to-r from-white to-indigo-200"
              }`}>
              Aura
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className={`hidden md:flex items-center gap-8 text-sm font-medium transition-colors duration-300 ${scrolled ? "text-slate-300" : "text-slate-300"
            }`}>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="hover:text-white transition-colors">
              Testimonials
            </a>
          </nav>

          <div className="flex items-center gap-4">
            <div className="hidden md:block">
              <Button
                variant={scrolled ? "ghost" : "secondary"}
                className={`transition-all duration-300 ${scrolled
                  ? "text-white hover:bg-white/10 rounded-full px-6"
                  : "bg-white text-indigo-900 hover:bg-indigo-50 rounded-lg px-6"
                  } font-medium`}
                asChild
              >
                <Link to="/auth">
                  {scrolled ? "Login" : "Get Started"}
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className={`md:hidden p-2 text-white transition-colors hover:bg-white/10 rounded-full`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-[#0f1117] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-4 animate-in slide-in-from-top-5 z-50">
            <a
              href="#features"
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-4 rounded-lg hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-4 rounded-lg hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              How It Works
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-slate-300 hover:text-white py-2 px-4 rounded-lg hover:bg-white/5"
              onClick={() => setMobileMenuOpen(false)}
            >
              Testimonials
            </a>
            <Button
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl"
              asChild
            >
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0B] pt-32 pb-20">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          <div className="absolute top-[20%] left-[50%] transform -translate-x-1/2 w-[800px] h-[800px] bg-blue-900/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-sm font-medium text-indigo-200">
                New: AI Voice Intelligence 2.0
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight tracking-wide text-white animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
              Ace Any Interview.
              <br />
              <span className="bg-gradient-to-r from-indigo-400/90 via-purple-400/90 to-pink-400/90 bg-clip-text text-transparent">
                Powered by AI.
              </span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Practice real interviews with AI scoring, analytics & feedback. Your personal AI interviewer that listens, analyzes, and trains like a hiring manager.
            </p>

            {/* Mini Text Line with Avatars */}
            <div className="flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-9 duration-700 delay-250">
              <div className="flex items-center -space-x-3">
                {[
                  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=64&h=64&q=80&fit=crop&crop=faces",
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&q=80&fit=crop&crop=faces"
                ].map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="User"
                    className="h-10 w-10 rounded-full border-2 border-[#0A0A0B] object-cover"
                  />
                ))}
                <div className="flex items-center justify-center h-10 w-10 rounded-full border-2 border-[#0A0A0B] bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                  <Plus className="h-4 w-4" />
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-indigo-200/80">
                <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
                Trusted by 20,000+ candidates
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-2 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
              <Button
                size="lg"
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-105"
                asChild
              >
                <Link to="/auth">
                  Start My Interview
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-white/10 rounded-full px-8 h-14 text-lg font-semibold bg-transparent"
                asChild
              >
                <Link to="#demo">Watch Demo</Link>
              </Button>
            </div>

            {/* Dashboard Mockup */}
            <div className="mt-16 relative mx-auto max-w-5xl animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
              {/* Dynamic Glow Behind Mockup */}
              <div
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10 opacity-40 blur-3xl"
                style={{
                  background: "radial-gradient(circle at 50% 50%, rgba(128, 90, 213, 0.25), transparent 70%)"
                }}
              ></div>

              {/* Strong Ambient Glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-[2.5rem] blur-3xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>

              <div className="relative rounded-2xl bg-[#0f1117] border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden ring-1 ring-white/5 group">

                {/* Mac Window Header */}
                <div className="relative h-11 bg-[#1a1b26] border-b border-white/5 flex items-center px-4 gap-2 z-10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57] border border-[#E0443E]/50 shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#FEBC2E] border border-[#D89E24]/50 shadow-inner"></div>
                    <div className="w-3 h-3 rounded-full bg-[#28C840] border border-[#1AAB29]/50 shadow-inner"></div>
                  </div>
                  {/* Optional: URL Bar or Title */}
                  <div className="ml-4 flex-1 flex justify-center">
                    <div className="h-6 w-64 bg-white/5 rounded-md flex items-center justify-center border border-white/5">
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                        aura-interview.ai
                      </div>
                    </div>
                  </div>
                </div>

                {/* Window Content */}
                <div className="relative z-0 bg-[#0f1117]">
                  <img
                    src="/dashboard-preview.png"
                    alt="Dashboard Preview"
                    className="w-full h-auto object-cover opacity-95 hover:opacity-100 transition-opacity duration-500"
                  />
                  {/* Overlay Gradient for depth */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-transparent opacity-20 pointer-events-none"></div>
                </div>
              </div>

              {/* Floating Elements (Decorative) */}
              <div className="absolute -right-12 -bottom-12 hidden lg:block">
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Performance Score</div>
                      <div className="text-xs text-slate-400">Top 5% of candidates</div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full w-[92%] bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="absolute -left-12 top-1/2 hidden lg:block">
                <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 p-4 rounded-xl shadow-2xl max-w-xs transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">Real-time Feedback</div>
                      <div className="text-xs text-slate-400">AI analysis active</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* Features Section */}
      <section id="features" className="py-24 bg-slate-50 relative overflow-hidden">

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
              Everything you need to ace the interview
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our AI-powered platform provides a comprehensive suite of tools to help you prepare, practice, and perform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1: Voice-based AI Interviews (Large Card - Spans 2 cols on desktop) */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 overflow-hidden relative group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-500">
              <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

              <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                <div className="flex-1 z-10">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Voice-based AI Interviews.</h3>
                  <p className="text-slate-600 mb-6">Practice real-time scenarios with instant feedback. Our AI adapts to your responses just like a human interviewer.</p>
                  <div className="flex items-center gap-2 text-indigo-400 font-medium">
                    <div className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse"></div>
                    Listening now...
                  </div>
                </div>

                {/* Phone Mockup */}
                <div className="relative w-[280px] h-[500px] bg-white rounded-[3rem] border-8 border-slate-900 shadow-2xl flex flex-col overflow-hidden transform rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  {/* Dynamic Island */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-black rounded-b-2xl z-20"></div>

                  {/* Screen Content */}
                  <div className="flex-1 bg-white relative flex flex-col items-center pt-16 px-6">
                    <div className="w-full flex justify-between items-center mb-8">
                      <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                        <ArrowRight className="h-4 w-4 text-slate-900 rotate-180" />
                      </div>
                      <span className="text-slate-900 font-medium">Start Interview</span>
                      <div className="h-8 w-8"></div>
                    </div>

                    <div className="relative w-40 h-40 mb-12 flex items-center justify-center">
                      <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
                      <div className="absolute inset-4 bg-indigo-500/20 rounded-full blur-xl"></div>
                      <div className="relative w-32 h-32 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg border border-white/20">
                        <div className="w-12 h-16 flex items-center justify-center gap-1">
                          <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_1s_infinite]"></div>
                          <div className="w-1.5 h-12 bg-white rounded-full animate-[bounce_1.2s_infinite]"></div>
                          <div className="w-1.5 h-6 bg-white rounded-full animate-[bounce_0.8s_infinite]"></div>
                        </div>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      <div className="h-2 bg-slate-100 rounded-full w-3/4 mx-auto"></div>
                      <div className="h-2 bg-slate-100 rounded-full w-1/2 mx-auto"></div>
                    </div>

                    {/* Audio Waveform Visualization */}
                    <div className="mt-auto mb-12 flex items-center justify-center gap-1 h-12 w-full px-4">
                      {[...Array(20)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full"
                          style={{
                            height: `${Math.random() * 100}%`,
                            animation: `pulse 0.5s infinite ${i * 0.05}s alternate`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2: Instant Score + Feedback */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-500">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500"></div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Score + Feedback.</h3>
              <p className="text-slate-600 text-sm mb-6">Get detailed scoring and actionable tips immediately.</p>

              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-md">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500">Recent Interview</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3].map(i => <Star key={i} className="h-3 w-3 text-yellow-500 fill-yellow-500" />)}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 flex items-center justify-center">
                    <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                      <path className="text-emerald-500" strokeDasharray="64, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    </svg>
                    <span className="absolute text-xl font-bold text-slate-900">64%</span>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Score</span>
                        <span className="text-slate-900">64%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[64%] bg-gradient-to-r from-emerald-400 to-green-500"></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Feedback</span>
                        <span className="text-slate-900">8%</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full w-[8%] bg-red-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3: Skill Templates */}
            <div className="md:col-span-3 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-500">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Skill Templates.</h3>
                  <p className="text-slate-600">Choose from a wide range of role-specific interview templates.</p>
                </div>
                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 mt-4 md:mt-0">
                  View All <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { id: "BA", title: "Backend Developer", color: "bg-blue-500" },
                  { id: "BL", title: "Blockchain Developer", color: "bg-purple-500" },
                  { id: "DI", title: "AI/ML Engineer", color: "bg-green-500" },
                  { id: "DE", title: "DevOps Engineer", color: "bg-orange-500" }
                ].map((template, i) => (
                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-500/50 hover:shadow-md transition-all cursor-pointer group/card">
                    <div className={`w-10 h-10 rounded-lg ${template.color}/10 flex items-center justify-center mb-4 text-${template.color.split('-')[1]}-600 font-bold`}>
                      {template.id}
                    </div>
                    <h4 className="text-slate-900 font-medium mb-2">{template.title}</h4>
                    <p className="text-xs text-slate-500 mb-4 line-clamp-2">Comprehensive assessment for {template.title} roles including technical and behavioral questions.</p>
                    <div className="text-xs font-medium text-indigo-400 group-hover/card:translate-x-1 transition-transform inline-flex items-center">
                      Learn more <ArrowRight className="ml-1 h-3 w-3" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature 4: Leaderboard Gamification */}
            <div className="bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-500">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Leaderboard Gamification.</h3>
              <p className="text-slate-600 text-sm mb-6">Compete with others and climb the rankings.</p>

              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md relative overflow-hidden">
                <div className="flex justify-center items-end gap-4 mb-6">
                  {/* Rank 2 */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 mb-2 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop" alt="Rank 2" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-16 w-12 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-600 font-bold text-sm">2</div>
                  </div>
                  {/* Rank 1 */}
                  <div className="flex flex-col items-center relative z-10">
                    <div className="absolute -top-6 text-yellow-500">
                      <Award className="h-6 w-6 fill-yellow-500" />
                    </div>
                    <div className="w-14 h-14 rounded-full bg-yellow-500/20 border-2 border-yellow-500 mb-2 overflow-hidden ring-4 ring-yellow-500/10">
                      <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop" alt="Rank 1" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-24 w-16 bg-gradient-to-b from-yellow-500/20 to-yellow-500/5 rounded-t-lg flex items-center justify-center text-yellow-500 font-bold text-lg border-t border-yellow-500/30">1</div>
                  </div>
                  {/* Rank 3 */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-slate-200 mb-2 overflow-hidden">
                      <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&h=100&fit=crop" alt="Rank 3" className="w-full h-full object-cover" />
                    </div>
                    <div className="h-12 w-12 bg-slate-100 rounded-t-lg flex items-center justify-center text-slate-600 font-bold text-sm">3</div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-3 flex items-center justify-between border border-slate-100 shadow-sm mt-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400">4</span>
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-xs text-indigo-600 font-bold">You</div>
                    <div className="text-xs text-slate-900 font-medium">Ujjawal</div>
                  </div>
                  <span className="text-xs font-bold text-green-600">#1</span>
                </div>
              </div>
            </div>

            {/* Feature 5: Smart Analytics Reports */}
            <div className="md:col-span-2 bg-white rounded-3xl border border-slate-200 p-8 relative overflow-hidden group hover:border-indigo-500/30 hover:shadow-lg transition-all duration-500">
              <div className="flex flex-col md:flex-row items-center gap-8 h-full">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">Smart Analytics Reports.</h3>
                  <p className="text-slate-600 mb-6">Track your progress with real-time data visualization. Identify strengths and weaknesses to focus your preparation.</p>

                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Interviews</div>
                      <div className="text-xl font-bold text-slate-900">21</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Avg Score</div>
                      <div className="text-xl font-bold text-slate-900">78%</div>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <div className="text-xs text-slate-500 mb-1">Rank</div>
                      <div className="text-xl font-bold text-slate-900">Top 7%</div>
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-1/2 bg-white rounded-2xl p-4 border border-slate-100 shadow-md relative overflow-hidden">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-xs font-medium text-slate-500">Average Score Trend</span>
                    <div className="flex gap-2">
                      <div className="flex items-center gap-1">
                        <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                        <span className="text-[10px] text-slate-400">Score</span>
                      </div>

                    </div>
                  </div>

                  {/* Combined Chart */}
                  <div className="relative h-32 w-full">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                      {/* Bars */}
                      {[30, 45, 35, 60, 55, 75, 85].map((h, i) => (
                        <rect
                          key={`bar-${i}`}
                          x={i * 14.28 + 3.14}
                          y={100 - h}
                          width="8"
                          height={h}
                          rx="2"
                          fill="url(#barGradient)"
                          className="opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
                        />
                      ))}


                    </svg>


                  </div>

                  {/* X Axis */}
                  <div className="flex justify-between mt-2 text-[10px] text-slate-500 px-2">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>



      {/* Testimonials Section */}
      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-[#0A0A0B] overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-2 px-4 rounded-full bg-pink-500/10 text-pink-400 text-sm font-semibold border border-pink-500/20 mb-4">
              Testimonials
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
              Loved by{" "}
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-xl text-slate-400">See what our users have to say</p>
          </div>

          <div
            className="relative h-[800px] -mx-6 md:mx-0"
            style={{
              maskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
              WebkitMaskImage: "linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)",
            }}
          >
            <div className="grid md:grid-cols-3 gap-6 h-full">
              {[0, 1, 2].map((col) => (
                <div
                  key={col}
                  className="space-y-6 animate-scroll-vertical"
                  style={{ animationDuration: `${(25 + col * 5) * 2}s` }}
                >
                  {[...testimonials, ...testimonials, ...testimonials, ...testimonials].map((testimonial, i) => (
                    <Card
                      key={`${col}-${i}`}
                      className="p-6 border border-white/10 shadow-lg bg-[#0f1117] hover:border-indigo-500/30 transition-all"
                    >
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-slate-300 mb-6 leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3">
                        <img
                          src={testimonial.image}
                          alt={testimonial.name}
                          className="h-12 w-12 rounded-full object-cover border-2 border-white/10"
                        />
                        <div>
                          <div className="font-bold text-white">{testimonial.name}</div>
                          <div className="text-sm text-slate-500">{testimonial.role}</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600"></div>

        {/* Animated Particles */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
            Ready to Ace Your Interview?
          </h2>
          <p className="text-xl md:text-2xl text-indigo-100 mb-12 max-w-2xl mx-auto">
            Join thousands of professionals who've landed their dream jobs with our AI-powered practice platform
          </p>
          <Button
            size="lg"
            className="bg-white text-indigo-600 hover:bg-indigo-50 rounded-full px-10 h-16 text-xl font-bold shadow-2xl hover:shadow-white/20 transition-all hover:scale-105"
            asChild
          >
            <Link to="/auth">
              Start Your Free Practice
              <ArrowRight className="ml-2 h-6 w-6" />
            </Link>
          </Button>
          <p className="text-indigo-200 mt-6 text-sm">
            No credit card required • 30 minutes free daily
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2 text-xl font-bold">
              <Brain className="h-8 w-8 text-indigo-600" />
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Aura
              </span>
            </div>
            <div className="text-slate-500 text-sm">
              © 2025 Aura AI Interview Practice. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}