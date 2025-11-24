import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, MessageSquare, Award, Zap, Search, List, Calendar, Settings, CheckCircle2, Leaf, Lock, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-interview.jpg";

export default function Landing() {
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Interviews",
      description: "Practice with advanced AI that simulates real interview scenarios",
    },
    {
      icon: Target,
      title: "Personalized Feedback",
      description: "Get detailed analysis and improvement suggestions after each session",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your performance and see improvement over time",
    },
    {
      icon: MessageSquare,
      title: "Real-Time Guidance",
      description: "Receive help during practice sessions to learn on the go",
    },
    {
      icon: Award,
      title: "Earn Badges",
      description: "Unlock achievements as you master different interview skills",
    },
    {
      icon: Zap,
      title: "30 Minutes Daily Free",
      description: "Get free daily practice time to perfect your skills",
    },
  ];

  const testimonials = [
    {
      text: "This app has completely transformed how I manage my projects and deadlines.",
      name: "Jamie Teller",
      handle: "@jamietechguru00"
    },
    {
      text: "I was amazed at how quickly we were able to integrate this app into our workflow.",
      name: "Casey Jordan",
      handle: "@caseyj"
    },
    {
      text: "Adopting this app for our team has streamlined our project management and improved communication.",
      name: "Jordan Patels",
      handle: "@jpatelsdesign"
    },
    {
      text: "Our team's productivity has skyrocketed since we started using this tool.",
      name: "Alex Rivera",
      handle: "@alexinnovates"
    },
    {
      text: "Planning and executing events has never been easier. This app helps me keep track of all the moving parts.",
      name: "Taylor Kim",
      handle: "@taykimm"
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">


      {/* Navbar */}
      <header className="bg-white py-6">
        <div className="container mx-auto flex items-center justify-between px-6">
          <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <Brain className="h-8 w-8 text-blue-600" />
            InterviewAI
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <Link to="#" className="hover:text-slate-900">Features</Link>
            <Link to="#" className="hover:text-slate-900">Pricing</Link>
            <Link to="#" className="hover:text-slate-900">About Us</Link>
          </nav>

          <Button variant="outline" className="border-slate-200 text-slate-900 font-medium rounded-lg px-6 hover:bg-slate-50" asChild>
            <Link to="/auth">Log In</Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div className="flex flex-col space-y-8 max-w-xl">
              <h1 className="text-5xl font-bold leading-tight text-slate-900 lg:text-6xl tracking-tight">
                Ace Your Next Job Interview with Our AI Agent
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed">
                Practice in a low-stress environment, get instant, personalized feedback, and boost your confidence with real-time coaching from our advanced AI. Prepare for any role, anytime.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 h-14 text-lg font-medium shadow-lg shadow-blue-200/50" asChild>
                  <Link to="/auth">Start Practicing for Free</Link>
                </Button>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Trusted by job seekers worldwide. 95% success rate.
              </p>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg">
                <img
                  src={heroImage}
                  alt="AI Interview Practice"
                  className="w-full h-auto object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Productivity & Progress Section */}
      <section className="py-24 bg-slate-50/50">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-20">
            <span className="inline-block py-1.5 px-4 rounded-full bg-purple-100 text-purple-700 text-sm font-semibold border border-purple-200 mb-8">
              Boost your productivity
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
              A more effective way<br />to track progress
            </h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto">
              Effortlessly turn your ideas into a fully functional, responsive, no-code SaaS website in just minutes with the set of free components for Framer.
            </p>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative mb-24 mx-auto max-w-6xl">
            {/* Main Window */}
            <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-2xl bg-white relative z-10">
              {/* Window Header */}
              <div className="bg-slate-900 h-14 flex items-center px-6 gap-4 border-b border-slate-800">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600/80"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600/80"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600/80"></div>
                </div>
                <div className="ml-auto bg-slate-800/50 rounded-md px-4 py-1.5 text-xs text-slate-400 w-64 flex items-center justify-between border border-slate-700/50">
                  <span>Search</span>
                  <Search className="h-3 w-3 opacity-50" />
                </div>
              </div>

              <div className="flex h-[600px] lg:h-[700px]">
                {/* Sidebar */}
                <div className="w-20 bg-slate-900 flex flex-col items-center py-8 gap-8 border-t border-slate-800 flex-shrink-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <List className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <Target className="h-5 w-5" />
                  </div>
                  <div className="mt-auto w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer">
                    <Settings className="h-5 w-5" />
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white flex flex-col overflow-hidden">
                  {/* Top Bar */}
                  <div className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center text-white">
                        <Zap className="h-4 w-4" />
                      </div>
                      <span className="font-bold text-slate-900">Marketing</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-medium text-slate-600">Website</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex -space-x-2">
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">JD</div>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-600">AS</div>
                        <div className="h-8 w-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">+3</div>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-8">
                    <div className="mb-8">
                      <h3 className="text-2xl font-bold text-slate-900 mb-6">Launch</h3>

                      <div className="space-y-1">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Design</div>

                        {[
                          { title: "Define color scheme & typography", date: "Mar 23", status: "Done", statusColor: "bg-green-100 text-green-700" },
                          { title: "Design homepage", date: "Mar 28", status: "Done", statusColor: "bg-green-100 text-green-700" },
                          { title: "Design responsive layouts", date: "Apr 12", status: "In progress", statusColor: "bg-yellow-100 text-yellow-700" },
                          { title: "Implement navigation", date: "Apr 18", status: "In progress", statusColor: "bg-yellow-100 text-yellow-700" },
                        ].map((item, i) => (
                          <div key={i} className="group flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.status === 'Done' ? 'border-purple-500 bg-purple-500' : 'border-slate-300'}`}>
                              {item.status === 'Done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${item.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.title}
                            </span>
                            <div className="ml-auto flex items-center gap-4">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </div>
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${item.statusColor}`}>
                                {item.status}
                              </span>
                              <div className="h-6 w-6 rounded-full bg-slate-200" />
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-1 mt-8">
                        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">SEO</div>
                        {[
                          { title: "Research keywords", date: "Mar 21", status: "Done", statusColor: "bg-green-100 text-green-700" },
                          { title: "Meta titles and descriptions", date: "Apr 17", status: "In progress", statusColor: "bg-yellow-100 text-yellow-700" },
                        ].map((item, i) => (
                          <div key={i} className="group flex items-center gap-4 p-3 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-50 last:border-0">
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${item.status === 'Done' ? 'border-purple-500 bg-purple-500' : 'border-slate-300'}`}>
                              {item.status === 'Done' && <CheckCircle2 className="h-3 w-3 text-white" />}
                            </div>
                            <span className={`text-sm font-medium ${item.status === 'Done' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                              {item.title}
                            </span>
                            <div className="ml-auto flex items-center gap-4">
                              <div className="flex items-center gap-2 text-xs text-slate-400">
                                <Calendar className="h-3 w-3" />
                                {item.date}
                              </div>
                              <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${item.statusColor}`}>
                                {item.status}
                              </span>
                              <div className="h-6 w-6 rounded-full bg-slate-200" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12">
            {[
              {
                icon: Leaf,
                title: "Integration ecosystem",
                desc: "Track your progress and motivate your efforts everyday."
              },
              {
                icon: Target,
                title: "Goal setting and tracking",
                desc: "Set and track goals with manageable task breakdowns."
              },
              {
                icon: Lock,
                title: "Secure data encryption",
                desc: "Ensure your data's safety with top-tier encryption."
              },
              {
                icon: Bell,
                title: "Customizable notifications",
                desc: "Get alerts on tasks and deadlines that matter most."
              }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-start">
                <feature.icon className="h-8 w-8 text-slate-900 mb-4" strokeWidth={1.5} />
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed mb-4">
                  {feature.desc}
                </p>
                <Link to="#" className="flex items-center gap-1 text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors mt-auto">
                  Learn more <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-block py-1.5 px-4 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold border border-slate-200 mb-6">
              Testimonials
            </span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900">
              What our users say
            </h2>
          </div>

          <div
            className="relative h-[600px] -mx-6 md:mx-0 overflow-hidden"
            style={{
              maskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent, black 10%, black 90%, transparent)',
            }}
          >
            <div className="grid md:grid-cols-3 gap-6 h-full">
              {/* Column 1 */}
              <div className="space-y-6 animate-scroll-vertical pause-on-hover">
                {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                  <Card key={`col1-${i}`} className="p-6 border-slate-100 shadow-sm bg-slate-50/50 hover:shadow-md transition-shadow">
                    <p className="text-slate-600 mb-6 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}`} alt={t.name} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-sm text-slate-500">{t.handle}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Column 2 */}
              <div className="space-y-6 animate-scroll-vertical pause-on-hover" style={{ animationDuration: '30s' }}>
                {[...testimonials.reverse(), ...testimonials, ...testimonials].map((t, i) => (
                  <Card key={`col2-${i}`} className="p-6 border-slate-100 shadow-sm bg-slate-50/50 hover:shadow-md transition-shadow">
                    <p className="text-slate-600 mb-6 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}2`} alt={t.name} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-sm text-slate-500">{t.handle}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Column 3 */}
              <div className="space-y-6 animate-scroll-vertical pause-on-hover" style={{ animationDuration: '25s' }}>
                {[...testimonials, ...testimonials, ...testimonials].map((t, i) => (
                  <Card key={`col3-${i}`} className="p-6 border-slate-100 shadow-sm bg-slate-50/50 hover:shadow-md transition-shadow">
                    <p className="text-slate-600 mb-6 leading-relaxed">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-slate-200 overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.name}3`} alt={t.name} />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{t.name}</div>
                        <div className="text-sm text-slate-500">{t.handle}</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-slate-900">Why Choose AI Interview Agents?</h2>
            <p className="text-xl text-slate-500">
              Everything you need to ace your next interview
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-slate-200 transition-all hover:shadow-lg hover:-translate-y-1 bg-white">
                <CardContent className="p-6">
                  <feature.icon className="mb-4 h-12 w-12 text-blue-600" />
                  <h3 className="mb-2 text-xl font-semibold text-slate-900">{feature.title}</h3>
                  <p className="text-slate-500">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 py-20 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl text-slate-300">
            Join thousands of professionals improving their interview skills
          </p>
          <Button size="lg" className="bg-cyan-400 hover:bg-cyan-500 text-slate-900 font-bold" asChild>
            <Link to="/auth">Start Your Free Practice</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-slate-500">
          <p>© 2025 AI Interview Agents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}