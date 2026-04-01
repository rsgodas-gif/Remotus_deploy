import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PatientProvider, usePatient } from './contexts/PatientContext';
import { WeeklyLockProvider, useWeeklyLockContext } from './contexts/WeeklyLockContext';
import Index from './pages/Index';
import PradetiPrograma from './pages/PradetiPrograma';
import Pratimai from './pages/Pratimai';
import Mityba from './pages/Mityba';
import Gyvensena from './pages/Gyvensena';
import SkausmoPaumejimas from './pages/SkausmoPaumejimas';
import SavaitesProgresas from './pages/SavaitesProgresas';
import Prisijungti from './pages/Prisijungti';
import AccessDenied from './pages/AccessDenied';
import AuthCallback from './pages/AuthCallback';
import NotFound from './pages/NotFound';
import Stebesena from './pages/Stebesena';

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowWhenLocked = false }: { children: React.ReactNode; allowWhenLocked?: boolean }) {
  const { patient, loading } = usePatient();
  const { isLocked, loading: lockLoading } = useWeeklyLockContext();
  const hasWeeklyBypass =
    !!patient && sessionStorage.getItem(`weekly_lock_bypass_${patient.id}`) === '1';

  if (loading || lockLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#5B8A72] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!patient) {
    return <Navigate to="/prisijungti" replace />;
  }

  if (!patient.access_allowed) {
    return <Navigate to="/prieiga-neleidziama" replace />;
  }

  // If user is locked and this route doesn't allow locked access, redirect to progress page
  if (isLocked && !allowWhenLocked && !hasWeeklyBypass) {
    return <Navigate to="/progresas" replace />;
  }

  return <>{children}</>;
}

const AppRoutes = () => {
  const { patient, loading } = usePatient();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-[#5B8A72] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/prisijungti"
        element={patient && patient.access_allowed ? <Navigate to="/" replace /> : <Prisijungti />}
      />
      <Route path="/prieiga-neleidziama" element={<AccessDenied />} />
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
      <Route path="/pradeti" element={<ProtectedRoute><PradetiPrograma /></ProtectedRoute>} />
      <Route path="/pratimai" element={<ProtectedRoute><Pratimai /></ProtectedRoute>} />
      <Route path="/mityba" element={<ProtectedRoute><Mityba /></ProtectedRoute>} />
      <Route path="/gyvensena" element={<ProtectedRoute><Gyvensena /></ProtectedRoute>} />
      <Route path="/skausmo-paumejimas" element={<ProtectedRoute><SkausmoPaumejimas /></ProtectedRoute>} />
      {/* Progress page is always accessible (allowWhenLocked) */}
      <Route path="/progresas" element={<ProtectedRoute allowWhenLocked><SavaitesProgresas /></ProtectedRoute>} />
      {/* Internal monitoring page (separate from patient flow) */}
      <Route path="/stebesena" element={<ProtectedRoute allowWhenLocked><Stebesena /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <BrowserRouter>
        <PatientProvider>
          <WeeklyLockProvider>
            <AppRoutes />
          </WeeklyLockProvider>
        </PatientProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;