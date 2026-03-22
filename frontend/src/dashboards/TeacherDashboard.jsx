import useAuthStore from '../stores/authStore';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
  const { user, logout, getAuthHeaders, API_BASE_URL } = useAuthStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [assignments, setAssignments] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateAssignment, setShowCreateAssignment] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    description: '',
    classId: '',
    dueDate: '',
    instructions: '',
    selectedProblems: []
  });
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([]);
  const [showSubmissions, setShowSubmissions] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Load assignments and problems
  useEffect(() => {
    if (activeTab === 'assignments') {
      loadAssignments();
      loadProblems();
    }
  }, [activeTab]);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/teacher`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setAssignments(data);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProblems = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setProblems(data.problems || []);
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const problemsData = assignmentForm.selectedProblems.map(problemId => ({
        problemId,
        order: 0
      }));

      const response = await fetch(`${API_BASE_URL}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title: assignmentForm.title,
          description: assignmentForm.description,
          problems: problemsData,
          classId: assignmentForm.classId,
          dueDate: assignmentForm.dueDate,
          instructions: assignmentForm.instructions,
          totalPoints: 100
        })
      });

      if (response.ok) {
        setShowCreateAssignment(false);
        setAssignmentForm({
          title: '',
          description: '',
          classId: '',
          dueDate: '',
          instructions: '',
          selectedProblems: []
        });
        loadAssignments();
        alert('Assignment created successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to create assignment');
      }
    } catch (error) {
      console.error('Create assignment error:', error);
      alert('Failed to create assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleProblemToggle = (problemId) => {
    setAssignmentForm(prev => ({
      ...prev,
      selectedProblems: prev.selectedProblems.includes(problemId)
        ? prev.selectedProblems.filter(id => id !== problemId)
        : [...prev.selectedProblems, problemId]
    }));
  };

  const viewAssignmentSubmissions = async (assignment) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignment._id}/submissions/teacher`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAssignment(data.assignment);
        setAssignmentSubmissions(data.submissions);
        setShowSubmissions(true);
        setActiveTab('assignments');
      }
    } catch (error) {
      console.error('Failed to load submissions:', error);
      alert('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleGradeSubmission = async (submissionId, score, feedback) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/submissions/${submissionId}/grade`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ score: parseInt(score), feedback })
      });

      if (response.ok) {
        // Refresh submissions
        const currentAssignment = selectedAssignment;
        if (currentAssignment) {
          await viewAssignmentSubmissions(currentAssignment);
        }
        alert('Submission graded successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to grade submission');
      }
    } catch (error) {
      console.error('Grade submission error:', error);
      alert('Failed to grade submission');
    }
  };

  const handleEditAssignment = async (assignment) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignment._id}/edit`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const assignmentData = await response.json();
        setEditingAssignment(assignmentData);
        setAssignmentForm({
          title: assignmentData.title,
          description: assignmentData.description,
          classId: assignmentData.classId,
          dueDate: new Date(assignmentData.dueDate).toISOString().slice(0, 16),
          instructions: assignmentData.instructions || '',
          selectedProblems: assignmentData.problems.map(p => p.problemId._id)
        });
        setShowEditForm(true);
        setActiveTab('assignments');
      }
    } catch (error) {
      console.error('Failed to load assignment for editing:', error);
      alert('Failed to load assignment for editing');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssignment = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const problemsData = assignmentForm.selectedProblems.map(problemId => ({
        problemId,
        order: 0
      }));

      const response = await fetch(`${API_BASE_URL}/assignments/${editingAssignment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          title: assignmentForm.title,
          description: assignmentForm.description,
          problems: problemsData,
          classId: assignmentForm.classId,
          dueDate: assignmentForm.dueDate,
          instructions: assignmentForm.instructions,
          totalPoints: 100
        })
      });

      if (response.ok) {
        setShowEditForm(false);
        setEditingAssignment(null);
        setAssignmentForm({
          title: '',
          description: '',
          classId: '',
          dueDate: '',
          instructions: '',
          selectedProblems: []
        });
        loadAssignments();
        alert('Assignment updated successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update assignment');
      }
    } catch (error) {
      console.error('Update assignment error:', error);
      alert('Failed to update assignment');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        loadAssignments();
        alert('Assignment deleted successfully!');
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to delete assignment');
      }
    } catch (error) {
      console.error('Delete assignment error:', error);
      alert('Failed to delete assignment');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'problems', label: 'My Problems' },
    { id: 'assignments', label: 'Assignments' },
    { id: 'progress', label: 'Student Progress' },
    { id: 'create', label: 'Create Problem' },
    { id: 'profile', label: 'Profile' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Teacher Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome, {user?.name || 'Teacher'}!</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Logout
          </button>
        </div>

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
              <h2 className="text-2xl font-bold mb-4">Teaching Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">Total Students</h3>
                  <p className="text-2xl font-bold text-blue-600">67</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Problems Created</h3>
                  <p className="text-2xl font-bold text-green-600">23</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">Active Assignments</h3>
                  <p className="text-2xl font-bold text-yellow-600">8</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800">Avg. Class Score</h3>
                  <p className="text-2xl font-bold text-purple-600">85%</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    <div className="p-3 bg-gray-50 rounded">Student Anand solved "Two Sum"</div>
                    <div className="p-3 bg-gray-50 rounded">New problem "Merge Intervals" created</div>
                    <div className="p-3 bg-gray-50 rounded">Assignment "Array Basics" due tomorrow</div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                  <div className="space-y-2">
                    <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create New Problem</button>
                    <button className="w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">Assign Homework</button>
                    <button className="w-full bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600">View Reports</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'problems' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">My Problems</h2>
              <div className="mb-4 flex justify-between">
                <input type="text" placeholder="Search my problems..." className="px-4 py-2 border rounded-lg" />
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Create Problem</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Two Sum</h3>
                  <p className="text-sm text-gray-600">Easy • Array • 245 solves</p>
                  <div className="mt-2 flex justify-between">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-green-500 hover:text-green-700">View Stats</button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Valid Palindrome</h3>
                  <p className="text-sm text-gray-600">Easy • String • 189 solves</p>
                  <div className="mt-2 flex justify-between">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-green-500 hover:text-green-700">View Stats</button>
                  </div>
                </div>
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold">Merge Intervals</h3>
                  <p className="text-sm text-gray-600">Medium • Array • 156 solves</p>
                  <div className="mt-2 flex justify-between">
                    <button className="text-blue-500 hover:text-blue-700">Edit</button>
                    <button className="text-green-500 hover:text-green-700">View Stats</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                  {showSubmissions ? `Submissions for ${selectedAssignment?.title}` :
                   showEditForm ? `Edit Assignment: ${editingAssignment?.title}` : 'Assignments'}
                </h2>
                <div className="flex space-x-2">
                  {showSubmissions && (
                    <button
                      onClick={() => {
                        setShowSubmissions(false);
                        setSelectedAssignment(null);
                        setAssignmentSubmissions([]);
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Back to Assignments
                    </button>
                  )}
                  {showEditForm && (
                    <button
                      onClick={() => {
                        setShowEditForm(false);
                        setEditingAssignment(null);
                        setAssignmentForm({
                          title: '',
                          description: '',
                          classId: '',
                          dueDate: '',
                          instructions: '',
                          selectedProblems: []
                        });
                      }}
                      className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                    >
                      Cancel Edit
                    </button>
                  )}
                  {!showSubmissions && !showEditForm && (
                    <button
                      onClick={() => setShowCreateAssignment(!showCreateAssignment)}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                    >
                      {showCreateAssignment ? 'Cancel' : 'Create Assignment'}
                    </button>
                  )}
                </div>
              </div>

              {showCreateAssignment && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">Create New Assignment</h3>
                  <form onSubmit={handleCreateAssignment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Assignment Title</label>
                        <input
                          type="text"
                          value={assignmentForm.title}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter assignment title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Class ID</label>
                        <input
                          type="text"
                          value={assignmentForm.classId}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, classId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., CS101"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Describe the assignment..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                          type="datetime-local"
                          value={assignmentForm.dueDate}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instructions (Optional)</label>
                        <input
                          type="text"
                          value={assignmentForm.instructions}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional instructions..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Select Problems</label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                        {problems.length === 0 ? (
                          <p className="text-gray-500 text-sm">No problems available. Create some problems first.</p>
                        ) : (
                          <div className="space-y-2">
                            {problems.map(problem => (
                              <label key={problem._id} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={assignmentForm.selectedProblems.includes(problem._id)}
                                  onChange={() => handleProblemToggle(problem._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <span className="font-medium">{problem.title}</span>
                                  <span className={`ml-2 text-xs px-2 py-1 rounded capitalize ${
                                    problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {problem.difficulty}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">{problem.category}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {assignmentForm.selectedProblems.length} problems
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowCreateAssignment(false)}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={loading || assignmentForm.selectedProblems.length === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {loading ? 'Creating...' : 'Create Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showEditForm && editingAssignment && (
                <div className="bg-gray-50 p-6 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold mb-4">Edit Assignment</h3>
                  <form onSubmit={handleUpdateAssignment} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Assignment Title</label>
                        <input
                          type="text"
                          value={assignmentForm.title}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter assignment title"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Class ID</label>
                        <input
                          type="text"
                          value={assignmentForm.classId}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, classId: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., CS101"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <textarea
                        value={assignmentForm.description}
                        onChange={(e) => setAssignmentForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
                        placeholder="Describe the assignment..."
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <input
                          type="datetime-local"
                          value={assignmentForm.dueDate}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Instructions (Optional)</label>
                        <input
                          type="text"
                          value={assignmentForm.instructions}
                          onChange={(e) => setAssignmentForm(prev => ({ ...prev, instructions: e.target.value }))}
                          className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Additional instructions..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Select Problems</label>
                      <div className="max-h-48 overflow-y-auto border rounded-lg p-3 bg-white">
                        {problems.length === 0 ? (
                          <p className="text-gray-500 text-sm">No problems available. Create some problems first.</p>
                        ) : (
                          <div className="space-y-2">
                            {problems.map(problem => (
                              <label key={problem._id} className="flex items-center space-x-3">
                                <input
                                  type="checkbox"
                                  checked={assignmentForm.selectedProblems.includes(problem._id)}
                                  onChange={() => handleProblemToggle(problem._id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <div className="flex-1">
                                  <span className="font-medium">{problem.title}</span>
                                  <span className={`ml-2 text-xs px-2 py-1 rounded capitalize ${
                                    problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                                    problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-red-100 text-red-800'
                                  }`}>
                                    {problem.difficulty}
                                  </span>
                                  <span className="ml-2 text-xs text-gray-500">{problem.category}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Selected: {assignmentForm.selectedProblems.length} problems
                      </p>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="submit"
                        disabled={loading || assignmentForm.selectedProblems.length === 0}
                        className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
                      >
                        {loading ? 'Updating...' : 'Update Assignment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {showSubmissions ? (
                <div className="space-y-4">
                  {assignmentSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No submissions yet for this assignment.
                    </div>
                  ) : (
                    assignmentSubmissions.map(submission => (
                      <div key={submission._id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{submission.studentId.name}</h3>
                            <p className="text-sm text-gray-600">{submission.studentId.email}</p>
                            <p className="text-sm text-gray-500">
                              Submitted: {new Date(submission.submittedAt).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-sm rounded ${
                              submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                              submission.status === 'wrong_answer' ? 'bg-red-100 text-red-800' :
                              submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {submission.status.replace('_', ' ').toUpperCase()}
                            </span>
                            {submission.score !== undefined && (
                              <p className="text-sm font-medium mt-1">{submission.score}/100</p>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <h4 className="font-medium mb-1">{submission.problemId.title}</h4>
                          <div className="bg-gray-100 p-3 rounded text-sm font-mono max-h-32 overflow-y-auto">
                            <pre>{submission.code}</pre>
                          </div>
                        </div>

                        {submission.feedback && (
                          <div className="mb-3">
                            <h4 className="font-medium mb-1">Feedback:</h4>
                            <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded">{submission.feedback}</p>
                          </div>
                        )}

                        <div className="flex items-center space-x-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="Score"
                            className="w-20 px-2 py-1 border rounded text-sm"
                            id={`score-${submission._id}`}
                          />
                          <input
                            type="text"
                            placeholder="Feedback"
                            className="flex-1 px-3 py-1 border rounded text-sm"
                            id={`feedback-${submission._id}`}
                          />
                          <button
                            onClick={() => {
                              const score = document.getElementById(`score-${submission._id}`).value;
                              const feedback = document.getElementById(`feedback-${submission._id}`).value;
                              if (score) {
                                handleGradeSubmission(submission._id, score, feedback);
                              } else {
                                alert('Please enter a score');
                              }
                            }}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
                          >
                            Grade
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {loading && assignments.length === 0 ? (
                    <div className="text-center py-8">Loading assignments...</div>
                  ) : assignments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No assignments created yet. Click "Create Assignment" to get started.
                    </div>
                  ) : (
                    assignments.map(assignment => (
                      <div key={assignment._id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg">{assignment.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                          <span>Class: {assignment.classId}</span>
                          <span>Problems: {assignment.problems?.length || 0}</span>
                        </div>
                        <div className="mt-3">
                          <button
                            onClick={() => handleEditAssignment(assignment)}
                            className="text-blue-500 hover:text-blue-700 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => viewAssignmentSubmissions(assignment)}
                            className="text-green-500 hover:text-green-700 mr-3"
                          >
                            View Submissions
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(assignment._id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Student Progress</h2>
              <div className="mb-4">
                <select className="px-4 py-2 border rounded">
                  <option>All Classes</option>
                  <option>CS101</option>
                  <option>CS201</option>
                </select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full table-auto">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-4 py-2 text-left">Student</th>
                      <th className="px-4 py-2 text-left">Problems Solved</th>
                      <th className="px-4 py-2 text-left">Avg. Score</th>
                      <th className="px-4 py-2 text-left">Last Active</th>
                      <th className="px-4 py-2 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="px-4 py-2">Anand</td>
                      <td className="px-4 py-2">45/50</td>
                      <td className="px-4 py-2">92%</td>
                      <td className="px-4 py-2">2 hours ago</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Dev</td>
                      <td className="px-4 py-2">38/50</td>
                      <td className="px-4 py-2">85%</td>
                      <td className="px-4 py-2">1 day ago</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Bheem</td>
                      <td className="px-4 py-2">42/50</td>
                      <td className="px-4 py-2">88%</td>
                      <td className="px-4 py-2">3 hours ago</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Ganesh</td>
                      <td className="px-4 py-2">48/50</td>
                      <td className="px-4 py-2">88%</td>
                      <td className="px-4 py-2">8 hours ago</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2">Tharun</td>
                      <td className="px-4 py-2">42/50</td>
                      <td className="px-4 py-2">88%</td>
                      <td className="px-4 py-2">3 hours ago</td>
                      <td className="px-4 py-2">
                        <button className="text-blue-500 hover:text-blue-700">View Details</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'create' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Create New Problem</h2>
              <div className="bg-white p-6 rounded-lg shadow">
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Problem Title</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        placeholder="Enter problem title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Difficulty</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                        <option>Easy</option>
                        <option>Medium</option>
                        <option>Hard</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Pattern/Category</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option>Array</option>
                      <option>String</option>
                      <option>Linked List</option>
                      <option>Tree</option>
                      <option>Dynamic Programming</option>
                      <option>Graph</option>
                      <option>Backtracking</option>
                      <option>Greedy</option>
                      <option>Bit Manipulation</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Problem Description</label>
                    <textarea
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-32"
                      placeholder="Describe the problem..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Input Example</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                        placeholder="Example input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Output Example</label>
                      <textarea
                        className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 h-20"
                        placeholder="Example output"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Save Draft
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      Create Problem
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">Teacher Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-gray-900">{user?.name || 'Teacher Name'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-gray-900">teacher@example.com</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      <p className="text-gray-900">Computer Science</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Employee ID</label>
                      <p className="text-gray-900">TCH001</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow">
                  <h3 className="text-lg font-semibold mb-4">Teaching Statistics</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                      <p className="text-gray-900">5 years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Classes Taught</label>
                      <p className="text-gray-900">CS101, CS201, Algorithms</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Total Students</label>
                      <p className="text-gray-900">67</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Average Rating</label>
                      <p className="text-gray-900">4.8/5.0</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 bg-white p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Account Settings</h3>
                <div className="space-y-4">
                  <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Change Password</button>
                  <button className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 ml-4">Edit Profile</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;