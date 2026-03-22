import { Link } from 'react-router-dom';

const Login = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-4xl w-full mx-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Welcome to Coding Platform</h2>
        <p className="text-gray-600 mb-8 text-center">New users must sign up first. Select your role to get started.</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Student Signup */}
          <div className="border rounded-lg p-6 bg-blue-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-blue-600">Student</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Access coding problems and practice</p>
            <Link
              to="/student/signup"
              className="inline-block w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
            >
              Sign Up as Student
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Already have an account? <Link to="/student/login" className="text-blue-500 hover:text-blue-700">Login</Link>
            </p>
          </div>

          {/* Teacher Signup */}
          <div className="border rounded-lg p-6 bg-green-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-green-600">Teacher</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">Create problems and manage students</p>
            <Link
              to="/teacher/signup"
              className="inline-block w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
            >
              Sign Up as Teacher
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Already have an account? <Link to="/teacher/login" className="text-green-500 hover:text-green-700">Login</Link>
            </p>
          </div>

          {/* Admin Login Only */}
          <div className="border rounded-lg p-6 bg-red-50">
            <h3 className="text-xl font-semibold mb-4 text-center text-red-600">Admin</h3>
            <p className="text-sm text-gray-600 mb-4 text-center">System administration and management</p>
            <Link
              to="/admin/login"
              className="inline-block w-full bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-lg font-medium transition-colors text-center"
            >
              Admin Login
            </Link>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Admin accounts are pre-configured
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            New to the platform? Sign up above to create your account and start coding!
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;