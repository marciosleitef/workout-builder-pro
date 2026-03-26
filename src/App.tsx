import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import ExerciseLibraryPage from "./pages/ExerciseLibraryPage";
import AttendanceCalendar from "./pages/AttendanceCalendar";
import StudentGroups from "./pages/StudentGroups";
import Plans from "./pages/Plans";
import Challenges from "./pages/Challenges";
import ChallengePublic from "./pages/ChallengePublic";
import ChallengeDashboard from "./pages/ChallengeDashboard";
import ProfessorNotifications from "./pages/ProfessorNotifications";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentRegister from "./pages/StudentRegister";
import ChangePassword from "./pages/ChangePassword";
import StudentDashboard from "./pages/StudentDashboard";
import StudentWorkouts from "./pages/StudentWorkouts";
import StudentHistory from "./pages/StudentHistory";
import StudentHealth from "./pages/StudentHealth";
import StudentChallenges from "./pages/StudentChallenges";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/register/:professorId" element={<StudentRegister />} />
          <Route path="/challenge/:inviteCode" element={<ChallengePublic />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute skipPasswordCheck>
                <ChangePassword />
              </ProtectedRoute>
            }
          />
          {/* Professor routes */}
          <Route path="/dashboard" element={<ProtectedRoute allowedRole="professor"><Dashboard /></ProtectedRoute>} />
          <Route path="/students" element={<ProtectedRoute allowedRole="professor"><Students /></ProtectedRoute>} />
          <Route path="/exercises" element={<ProtectedRoute allowedRole="professor"><ExerciseLibraryPage /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute allowedRole="professor"><AttendanceCalendar /></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute allowedRole="professor"><StudentGroups /></ProtectedRoute>} />
          <Route path="/plans" element={<ProtectedRoute allowedRole="professor"><Plans /></ProtectedRoute>} />
          <Route path="/challenges" element={<ProtectedRoute allowedRole="professor"><Challenges /></ProtectedRoute>} />
          <Route path="/challenge-dashboard/:challengeId" element={<ProtectedRoute allowedRole="professor"><ChallengeDashboard /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute allowedRole="professor"><ProfessorNotifications /></ProtectedRoute>} />
          <Route path="/workout/:studentId" element={<ProtectedRoute allowedRole="professor"><Index /></ProtectedRoute>} />
          {/* Student routes */}
          <Route path="/student-dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student-workouts" element={<ProtectedRoute><StudentWorkouts /></ProtectedRoute>} />
          <Route path="/student-history" element={<ProtectedRoute><StudentHistory /></ProtectedRoute>} />
          <Route path="/student-health" element={<ProtectedRoute><StudentHealth /></ProtectedRoute>} />
          <Route path="/student-challenges" element={<ProtectedRoute><StudentChallenges /></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
