import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, MessageSquare, Award, Zap, CheckCircle2, ArrowRight, Sparkles, Users, Clock, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
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
      text: "This platform helped me land my dream job at a FAANG company. The AI feedback was incredibly detailed and actionable.",
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      rating: 5,
    },
    {
      text: "I went from nervous wreck to confident interviewee in just 2 weeks. The real-time coaching feature is a game-changer.",
      name: "Michael Rodriguez",
      role: "Product Manager at Meta",
      rating: 5,
    },
    {
      text: "The personalized feedback helped me identify and fix my weak points. Got 3 offers after using this for a month!",
      name: "Priya Sharma",
      role: "Data Scientist at Amazon",
      rating: 5,
    },
    {
      text: "Best interview prep tool I've used. The AI feels incredibly realistic and the progress tracking keeps me motivated.",
      name: "James Wilson",
      role: "UX Designer at Apple",
      rating: 5,
    },
    {
      text: "Went from 0 interview experience to multiple offers. This platform gave me the confidence I needed.",
      name: "Emily Taylor",
      role: "Marketing Manager at Netflix",
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
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
            ? "bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm"
            : "bg-transparent"
          }`}
      >
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <div className="relative">
              <Brain className="h-8 w-8 text-indigo-600" />
              <Sparkles className="h-4 w-4 text-yellow-500 absolute -top-1 -right-1" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Aura
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">
              How It Works
            </a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">
              Testimonials
            </a>
          </nav>

          <Button
            variant="outline"
            className="border-indigo-200 text-indigo-600 font-medium rounded-lg px-6 hover:bg-indigo-50"
            asChild
          >
            <Link to="/auth">Get Started</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 pt-20">
        {/* Animated Background Orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-pink-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-200 shadow-lg">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-600">
                AI-Powered Interview Practice
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Ace Your Next
              </span>
              <br />
              <span className="text-slate-900">Job Interview</span>
            </h1>

            {/* Subheading */}
            <p className="text-xl md:text-2xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Practice with our advanced AI interviewer, get instant personalized feedback, and boost your confidence with real-time coaching.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 h-14 text-lg font-semibold shadow-2xl shadow-indigo-500/50 hover:shadow-indigo-600/50 transition-all hover:scale-105"
                asChild
              >
                <Link to="/auth">
                  Start Practicing Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-slate-300 text-slate-700 rounded-full px-8 h-14 text-lg font-semibold hover:bg-slate-50"
                asChild
              >
                <Link to="#how-it-works">See How It Works</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40 shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-sm text-slate-600 mt-1 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-slate-400 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-slate-400 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block py-2 px-4 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold border border-indigo-200 mb-4">
              Features
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Everything You Need to{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Succeed
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              Powerful AI-driven features designed to help you master any interview
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity`}></div>
                <CardContent className="p-8 relative">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                  <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block py-2 px-4 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold border border-purple-200 mb-4">
              How It Works
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Get Started in{" "}
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                4 Simple Steps
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-indigo-200 to-purple-200 -z-10"></div>
                )}

                <div className="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-slate-100">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-6 shadow-lg">
                    <step.icon className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-sm font-bold text-indigo-600 mb-2">STEP {step.number}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{step.title}</h3>
                  <p className="text-slate-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-2 px-4 rounded-full bg-pink-100 text-pink-700 text-sm font-semibold border border-pink-200 mb-4">
              Testimonials
            </span>
            <h2 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6">
              Loved by{" "}
              <span className="bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                Thousands
              </span>
            </h2>
            <p className="text-xl text-slate-600">See what our users have to say</p>
          </div>

          <div
            className="relative h-[500px] -mx-6 md:mx-0"
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
                  style={{ animationDuration: `${25 + col * 5}s` }}
                >
                  {[...testimonials, ...testimonials].map((testimonial, i) => (
                    <Card
                      key={`${col}-${i}`}
                      className="p-6 border-0 shadow-lg bg-gradient-to-br from-white to-slate-50 hover:shadow-xl transition-shadow"
                    >
                      <div className="flex gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-slate-700 mb-6 leading-relaxed">"{testimonial.text}"</p>
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-lg">
                          {testimonial.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{testimonial.name}</div>
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