import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Target, TrendingUp, MessageSquare, Award, Zap } from "lucide-react";
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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-foreground">AI Interview Agents</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 to-background py-20">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
            <div className="flex flex-col justify-center space-y-6">
              <h1 className="text-5xl font-bold leading-tight text-foreground lg:text-6xl">
                Master Your Next Interview with AI
              </h1>
              <p className="text-xl text-muted-foreground">
                Practice with AI-powered mock interviews, get instant feedback, and boost your confidence. 
                Perfect your skills completely free, every single day.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" asChild>
                  <Link to="/auth">Start Practicing Free</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/auth">View Demo</Link>
                </Button>
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Zap className="h-4 w-4 text-primary" />
                  <span>30 min daily free</span>
                </div>
                <span>•</span>
                <span>No credit card required</span>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="AI Interview Practice"
                className="rounded-lg shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-4xl font-bold text-foreground">Why Choose AI Interview Agents?</h2>
            <p className="text-xl text-muted-foreground">
              Everything you need to ace your next interview
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-border transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <feature.icon className="mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary py-20 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">Ready to Get Started?</h2>
          <p className="mb-8 text-xl opacity-90">
            Join thousands of professionals improving their interview skills
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">Start Your Free Practice</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-card py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 AI Interview Agents. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}