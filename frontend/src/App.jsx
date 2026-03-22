import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './stores/authStore';
import Navigation from './components/Navigation';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import StudentLogin from './pages/StudentLogin';
import TeacherLogin from './pages/TeacherLogin';
import AdminLogin from './pages/AdminLogin';
import StudentSignup from './pages/StudentSignup';
import TeacherSignup from './pages/TeacherSignup';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Problems from './pages/Problems';
import Contest from './pages/Contest';
import Leaderboard from './pages/Leaderboard';

function App() {
  const { isAuthenticated, loading } = useAuthStore();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navigation />
      <Routes>
        {/* Public routes - accessible when not authenticated */}
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/student/login" element={!isAuthenticated ? <StudentLogin /> : <Navigate to="/dashboard" replace />} />
        <Route path="/teacher/login" element={!isAuthenticated ? <TeacherLogin /> : <Navigate to="/dashboard" replace />} />
        <Route path="/admin/login" element={!isAuthenticated ? <AdminLogin /> : <Navigate to="/dashboard" replace />} />
        <Route path="/student/signup" element={!isAuthenticated ? <StudentSignup /> : <Navigate to="/dashboard" replace />} />
        <Route path="/teacher/signup" element={!isAuthenticated ? <TeacherSignup /> : <Navigate to="/dashboard" replace />} />
        {/* Admin signup not allowed - only login */}
        <Route path="/signup" element={!isAuthenticated ? <Signup /> : <Navigate to="/dashboard" replace />} />

        {/* Protected routes - only accessible when authenticated */}
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" replace />} />
        <Route path="/problems" element={isAuthenticated ? <Problems /> : <Navigate to="/login" replace />} />
        <Route path="/contest" element={isAuthenticated ? <Contest /> : <Navigate to="/login" replace />} />
        <Route path="/leaderboard" element={isAuthenticated ? <Leaderboard /> : <Navigate to="/login" replace />} />

        {/* Catch all route - redirect to appropriate page based on auth status */}
        <Route path="*" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
