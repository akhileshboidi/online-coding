import { Link } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated || !user) return null;

  const getNavLinks = () => {
    if (user.role === 'admin') {
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/problems', label: 'Problem Management' },
        { to: '/contest', label: 'Contest Management' },
        { to: '/leaderboard', label: 'User Management' }
      ];
    } else if (user.role === 'teacher') {
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/problems', label: 'Problems' },
        { to: '/contest', label: 'Assignments' },
        { to: '/leaderboard', label: 'Student Progress' }
      ];
    } else {
      return [
        { to: '/dashboard', label: 'Dashboard' },
        { to: '/problems', label: 'Problems' },
        { to: '/contest', label: 'Contest' },
        { to: '/leaderboard', label: 'Leaderboard' }
      ];
    }
  };

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex space-x-6">
          {getNavLinks().map(link => (
            <Link key={link.to} to={link.to} className="hover:text-blue-200 transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm">Logged in as {user.role}</span>
          <button onClick={logout} className="bg-blue-700 hover:bg-blue-800 px-4 py-2 rounded transition-colors">Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;