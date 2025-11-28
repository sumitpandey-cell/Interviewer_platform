import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Jobs from "./pages/Jobs";
import Templates from "./pages/Templates";
import Reports from "./pages/Reports";
import AdminNotifications from "./pages/AdminNotifications";
import StartInterview from "./pages/StartInterview";
import InterviewSetup from "./pages/InterviewSetup";
import InterviewRoom from "./pages/InterviewRoom";
import InterviewReport from "./pages/InterviewReport";
import InterviewComplete from "./pages/InterviewComplete";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import CodingRound from "./pages/CodingRound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/jobs"
              element={
                <ProtectedRoute>
                  <Jobs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/templates"
              element={
                <ProtectedRoute>
                  <Templates />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute>
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/start-interview"
              element={
                <ProtectedRoute>
                  <StartInterview />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId/setup"
              element={
                <ProtectedRoute>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId/active"
              element={
                <ProtectedRoute>
                  <InterviewRoom />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId/report"
              element={
                <ProtectedRoute>
                  <InterviewReport />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId/complete"
              element={
                <ProtectedRoute>
                  <InterviewComplete />
                </ProtectedRoute>
              }
            />
            <Route
              path="/interview/:sessionId"
              element={
                <ProtectedRoute>
                  <InterviewSetup />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pricing"
              element={
                <ProtectedRoute>
                  <Pricing />
                </ProtectedRoute>
              }
            />
            <Route
              path="/coding-round"
              element={
                <ProtectedRoute>
                  <CodingRound />
                </ProtectedRoute>
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
