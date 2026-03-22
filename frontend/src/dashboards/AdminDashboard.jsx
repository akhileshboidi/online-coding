import useAuthStore from '../stores/authStore';
import { useState, useEffect } from 'react';

const AdminDashboard = () => {
  const { user, getAuthHeaders, API_BASE_URL } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [problems, setProblems] = useState([]);
  const [users, setUsers] = useState([]);
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [userFormData, setUserFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    isActive: true,
    profile: {}
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'easy',
    category: '',
    tags: [],
    timeLimit: 1000,
    memoryLimit: 256,
    sampleInput: '',
    sampleOutput: '',
    constraints: '',
    hints: [],
    testCases: [{ input: '', expectedOutput: '', isHidden: false }]
  });

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'User Management' },
    { id: 'problems', label: 'Problem Management' },
    { id: 'contests', label: 'Contest Management' },
    { id: 'settings', label: 'System Settings' },
    { id: 'profile', label: 'Profile' }
  ];

  // Load data based on active tab
  useEffect(() => {
    if (activeTab === 'problems') {
      loadProblems();
    } else if (activeTab === 'users') {
      loadUsers();
      loadUserStats();
    }
  }, [activeTab]);

  const loadProblems = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/problems`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setProblems(data.problems || []);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (roleFilter) params.append('role', roleFilter);

      const response = await fetch(`${API_BASE_URL}/users?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/stats`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        setUserStats(data);
      }
    } catch (error) {
      console.error('Failed to load user stats:', error);
    }
  };

  const handleCreateProblem = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setShowCreateForm(false);
        resetForm();
        loadProblems();
        alert('Problem created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create problem');
      }
    } catch (error) {
      console.error('Create problem error:', error);
      alert('Failed to create problem');
    }
  };

  const handleUpdateProblem = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${editingProblem._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        setEditingProblem(null);
        resetForm();
        loadProblems();
        alert('Problem updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update problem');
      }
    } catch (error) {
      console.error('Update problem error:', error);
      alert('Failed to update problem');
    }
  };

  const handleDeleteProblem = async (problemId) => {
    if (!confirm('Are you sure you want to delete this problem?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        loadProblems();
        alert('Problem deleted successfully!');
      } else {
        alert('Failed to delete problem');
      }
    } catch (error) {
      console.error('Delete problem error:', error);
      alert('Failed to delete problem');
    }
  };

  const startEdit = async (problem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problem._id}/admin`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const fullProblem = await response.json();
        setFormData({
          title: fullProblem.title,
          description: fullProblem.description,
          difficulty: fullProblem.difficulty,
          category: fullProblem.category,
          tags: fullProblem.tags || [],
          timeLimit: fullProblem.timeLimit,
          memoryLimit: fullProblem.memoryLimit,
          sampleInput: fullProblem.sampleInput || '',
          sampleOutput: fullProblem.sampleOutput || '',
          constraints: fullProblem.constraints || '',
          hints: fullProblem.hints || [],
          testCases: fullProblem.testCases || [{ input: '', expectedOutput: '', isHidden: false }]
        });
        setEditingProblem(fullProblem);
        setShowCreateForm(true);
      }
    } catch (error) {
      console.error('Failed to load problem for editing:', error);
      alert('Failed to load problem details');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      difficulty: 'easy',
      category: '',
      tags: [],
      timeLimit: 1000,
      memoryLimit: 256,
      sampleInput: '',
      sampleOutput: '',
      constraints: '',
      hints: [],
      testCases: [{ input: '', expectedOutput: '', isHidden: false }]
    });
    setEditingProblem(null);
    setShowCreateForm(false);
  };

  const resetUserForm = () => {
    setUserFormData({
      name: '',
      email: '',
      password: '',
      role: 'student',
      isActive: true,
      profile: {}
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const handleCreateUser = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(userFormData)
      });

      if (response.ok) {
        setShowUserForm(false);
        resetUserForm();
        loadUsers();
        loadUserStats();
        alert('User created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('Create user error:', error);
      alert('Failed to create user');
    }
  };

  const handleUpdateUser = async () => {
    try {
      const updateData = { ...userFormData };
      delete updateData.password; // Don't send password on update

      const response = await fetch(`${API_BASE_URL}/users/${editingUser._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setEditingUser(null);
        resetUserForm();
        loadUsers();
        alert('User updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('Update user error:', error);
      alert('Failed to update user');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        loadUsers();
        loadUserStats();
        alert('User deleted successfully!');
      } else {
        alert('Failed to delete user');
      }
    } catch (error) {
      console.error('Delete user error:', error);
      alert('Failed to delete user');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${userId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      if (response.ok) {
        loadUsers();
        loadUserStats();
        alert(`User ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Toggle user status error:', error);
      alert('Failed to update user status');
    }
  };

  const startEditUser = (user) => {
    setUserFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't populate password
      role: user.role,
      isActive: user.isActive,
      profile: user.profile || {}
    });
    setEditingUser(user);
    setShowUserForm(true);
  };

  const addTestCase = () => {
    setFormData(prev => ({
      ...prev,
      testCases: [...prev.testCases, { input: '', expectedOutput: '', isHidden: false }]
    }));
  };

  const removeTestCase = (index) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const updateTestCase = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      testCases: prev.testCases.map((tc, i) =>
        i === index ? { ...tc, [field]: value } : tc
      )
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, {user?.name || 'Admin'}!</p>

        <div className="mb-6">
          <nav className="flex space-x-1 bg-white p-1 rounded-lg shadow">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                }`}
              >
                {tab.label}
                
              </button>
            ))}
          </nav>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          {activeTab === 'overview' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Total Users</h3>
                  <p className="text-2xl font-bold text-blue-600">{userStats?.totalUsers || 0}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Active Users</h3>
                  <p className="text-2xl font-bold text-green-600">{userStats?.activeUsers || 0}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Active Problems</h3>
                  <p className="text-2xl font-bold text-yellow-600">{problems.length}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">System Health</h3>
                  <p className="text-2xl font-bold text-purple-600">98%</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded">New user registered: john_doe</div>
                    <div className="p-3 bg-gray-50 rounded">Problem "Two Sum" updated</div>
                    <div className="p-3 bg-gray-50 rounded">Contest "Weekly Challenge" created</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create New Problem</button>
                    <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Schedule Contest</button>
                    <button className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">Generate Report</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">User Management</h2>

              {/* User Statistics */}
              {userStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-800">Total Users</h3>
                    <p className="text-2xl font-bold text-blue-600">{userStats.totalUsers}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-800">Active Users</h3>
                    <p className="text-2xl font-bold text-green-600">{userStats.activeUsers}</p>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-yellow-800">Inactive Users</h3>
                    <p className="text-2xl font-bold text-yellow-600">{userStats.inactiveUsers}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-purple-800">Students</h3>
                    <p className="text-2xl font-bold text-purple-600">
                      {userStats.roleStats?.find(r => r._id === 'student')?.count || 0}
                    </p>
                  </div>
                </div>
              )}

              {/* Filters and Actions */}
              <div className="mb-4 flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  />
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-4 py-2 border rounded-lg"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="teacher">Teachers</option>
                    <option value="admin">Admins</option>
                  </select>
                  <button
                    onClick={() => {
                      loadUsers();
                      loadUserStats();
                    }}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                  >
                    Search
                  </button>
                </div>
                <button
                  onClick={() => setShowUserForm(true)}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                  Add User
                </button>
              </div>

              {/* User List */}
              {loading ? (
                <div className="text-center py-8">Loading users...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full table-auto">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-2 text-left">Name</th>
                        <th className="px-4 py-2 text-left">Email</th>
                        <th className="px-4 py-2 text-left">Role</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-left">Last Login</th>
                        <th className="px-4 py-2 text-left">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(user => (
                        <tr key={user._id} className="border-t">
                          <td className="px-4 py-2">{user.name}</td>
                          <td className="px-4 py-2">{user.email}</td>
                          <td className="px-4 py-2 capitalize">{user.role}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 rounded text-sm ${
                              user.isActive
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-4 py-2">
                            {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="px-4 py-2">
                            <button
                              onClick={() => startEditUser(user)}
                              className="text-blue-500 hover:text-blue-700 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(user._id, user.isActive)}
                              className={`mr-2 ${
                                user.isActive
                                  ? 'text-yellow-500 hover:text-yellow-700'
                                  : 'text-green-500 hover:text-green-700'
                              }`}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(user._id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan="6" className="px-4 py-8 text-center text-gray-500">
                            No users found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Problem Management</h2>

              {!showCreateForm ? (
                <>
                  <div className="mb-4 flex justify-between">
                    <input type="text" placeholder="Search problems..." className="px-4 py-2 border rounded-lg" />
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      Create Problem
                    </button>
                  </div>

                  {loading ? (
                    <div className="text-center py-8">Loading problems...</div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {problems.map(problem => (
                        <div key={problem._id} className="border rounded-lg p-4">
                          <h3 className="font-semibold">{problem.title}</h3>
                          <p className="text-sm text-gray-600 capitalize">{problem.difficulty} • {problem.category}</p>
                          <div className="mt-2 flex space-x-2">
                            <button
                              onClick={() => startEdit(problem)}
                              className="text-blue-500 hover:text-blue-700 text-sm"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProblem(problem._id)}
                              className="text-red-500 hover:text-red-700 text-sm"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                      {problems.length === 0 && (
                        <div className="col-span-full text-center py-8 text-gray-500">
                          No problems found. Create your first problem!
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="max-w-4xl">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold">
                      {editingProblem ? 'Edit Problem' : 'Create New Problem'}
                    </h3>
                    <button
                      onClick={resetForm}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title *</label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Difficulty *</label>
                        <select
                          value={formData.difficulty}
                          onChange={(e) => setFormData(prev => ({ ...prev, difficulty: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Category *</label>
                        <input
                          type="text"
                          value={formData.category}
                          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g., Array, String, Dynamic Programming"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Time Limit (ms)</label>
                        <input
                          type="number"
                          value={formData.timeLimit}
                          onChange={(e) => setFormData(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          min="100"
                          max="10000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Memory Limit (MB)</label>
                        <input
                          type="number"
                          value={formData.memoryLimit}
                          onChange={(e) => setFormData(prev => ({ ...prev, memoryLimit: parseInt(e.target.value) }))}
                          className="w-full px-3 py-2 border rounded-lg"
                          min="16"
                          max="1024"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Description *</label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg h-32"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Sample Input</label>
                        <textarea
                          value={formData.sampleInput}
                          onChange={(e) => setFormData(prev => ({ ...prev, sampleInput: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg h-20 font-mono text-sm"
                          placeholder="Enter sample input..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-1">Sample Output</label>
                        <textarea
                          value={formData.sampleOutput}
                          onChange={(e) => setFormData(prev => ({ ...prev, sampleOutput: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg h-20 font-mono text-sm"
                          placeholder="Enter expected sample output..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <h4 className="text-lg font-medium mb-3">Test Cases *</h4>
                    {formData.testCases.map((testCase, index) => (
                      <div key={index} className="border rounded-lg p-4 mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-medium">Test Case {index + 1}</span>
                          {formData.testCases.length > 1 && (
                            <button
                              onClick={() => removeTestCase(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-1">Input</label>
                            <textarea
                              value={testCase.input}
                              onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg font-mono text-sm h-20"
                              placeholder="Test input..."
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium mb-1">Expected Output</label>
                            <textarea
                              value={testCase.expectedOutput}
                              onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                              className="w-full px-3 py-2 border rounded-lg font-mono text-sm h-20"
                              placeholder="Expected output..."
                              required
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={testCase.isHidden}
                              onChange={(e) => updateTestCase(index, 'isHidden', e.target.checked)}
                              className="mr-2"
                            />
                            <span className="text-sm">Hidden test case</span>
                          </label>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={addTestCase}
                      className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-4"
                    >
                      Add Test Case
                    </button>
                  </div>

                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={editingProblem ? handleUpdateProblem : handleCreateProblem}
                      className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                    >
                      {editingProblem ? 'Update Problem' : 'Create Problem'}
                    </button>
                    <button
                      onClick={resetForm}
                      className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'contests' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Contest Management</h2>
              <div className="mb-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create Contest</button>
              </div>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Weekly Challenge #45</h3>
                  <p className="text-sm text-gray-600">Starts: 2025-10-10 10:00 | Duration: 2 hours</p>
                  <p className="text-sm">Problems: 5 | Participants: 234</p>
                  <div className="mt-2">
                    <button className="text-blue-500 hover:text-blue-700 mr-2">Edit</button>
                    <button className="text-red-500 hover:text-red-700">Delete</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">System Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max File Upload Size (MB)</label>
                  <input type="number" defaultValue="10" className="px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Default Time Limit (seconds)</label>
                  <input type="number" defaultValue="2" className="px-3 py-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Maintenance Mode</label>
                  <input type="checkbox" className="ml-2" />
                </div>
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Save Settings</button>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Admin Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{user?.name || 'Admin Name'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">admin@example.com</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="text-gray-900">IT Administration</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <p className="text-gray-900">ADM001</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Administrative Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Years of Service</label>
                      <p className="text-gray-900">8 years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Systems Managed</label>
                      <p className="text-gray-900">Coding Platform, User Database, Contest System</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Users</label>
                      <p className="text-gray-900">1,250</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">System Uptime</label>
                      <p className="text-gray-900">99.9%</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change Password</button>
                  <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4">Edit Profile</button>
                  <button className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 ml-4">Security Settings</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Form Modal */}
        {showUserForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {editingUser ? 'Edit User' : 'Create New User'}
                  </h3>
                  <button
                    onClick={resetUserForm}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <input
                      type="text"
                      value={userFormData.name}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Email *</label>
                    <input
                      type="email"
                      value={userFormData.email}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                      required
                    />
                  </div>

                  {!editingUser && (
                    <div>
                      <label className="block text-sm font-medium mb-1">Password *</label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">Role *</label>
                    <select
                      value={userFormData.role}
                      onChange={(e) => setUserFormData(prev => ({ ...prev, role: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="student">Student</option>
                      <option value="teacher">Teacher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={userFormData.isActive}
                        onChange={(e) => setUserFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Active User</span>
                    </label>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={editingUser ? handleUpdateUser : handleCreateUser}
                    className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                  >
                    {editingUser ? 'Update User' : 'Create User'}
                  </button>
                  <button
                    onClick={resetUserForm}
                    className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;