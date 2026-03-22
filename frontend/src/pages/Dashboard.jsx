import useAuthStore from '../stores/authStore';
import StudentDashboard from '../dashboards/StudentDashboard';
import TeacherDashboard from '../dashboards/TeacherDashboard';
import AdminDashboard from '../dashboards/AdminDashboard';
import LandingPage from './LandingPage';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return <LandingPage />;

  if (user.role === 'admin') return <AdminDashboard />;
  if (user.role === 'teacher') return <TeacherDashboard />;
  return <StudentDashboard />;
};

export default Dashboard;