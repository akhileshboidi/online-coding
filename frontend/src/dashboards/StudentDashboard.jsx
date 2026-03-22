import { useState, useEffect } from 'react';
import useAuthStore from '../stores/authStore';
import CodeEditor from '../components/CodeEditor';

const StudentDashboard = () => {
  const { user, getAuthHeaders, API_BASE_URL } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [problems, setProblems] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditorMinimized, setIsEditorMinimized] = useState(false);
  const [assignmentScore, setAssignmentScore] = useState(null);
  const [showScoreModal, setShowScoreModal] = useState(false);
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'assignments', label: 'Assignments', icon: '📚' },
    { id: 'problems', label: 'Problems', icon: '📝' },
    { id: 'solve', label: 'Solve Problem', icon: '💻' },
    { id: 'progress', label: 'Progress', icon: '📈' }
  ];

  // Load problems and assignments on component mount
  useEffect(() => {
    if (activeTab === 'problems') {
      loadProblems();
    } else if (activeTab === 'assignments') {
      loadAssignments();
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

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/student`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      if (response.ok) {
        // Load submissions for each assignment
        const assignmentsWithSubmissions = await Promise.all(
          data.map(async (assignment) => {
            try {
              const submissionsResponse = await fetch(
                `${API_BASE_URL}/assignments/${assignment._id}/submissions`,
                { headers: getAuthHeaders() }
              );
              const submissionsData = await submissionsResponse.json();
              return {
                ...assignment,
                submissions: submissionsResponse.ok ? submissionsData : []
              };
            } catch (error) {
              console.error('Failed to load submissions for assignment:', assignment._id, error);
              return { ...assignment, submissions: [] };
            }
          })
        );
        setAssignments(assignmentsWithSubmissions);
      }
    } catch (error) {
      console.error('Failed to load assignments:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectProblem = async (problem) => {
    try {
      const response = await fetch(`${API_BASE_URL}/problems/${problem._id}`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const fullProblem = await response.json();
        setSelectedProblem(fullProblem);
        setSelectedAssignment(null); // Clear assignment state when selecting standalone problem
        setActiveTab('solve');
        setSubmissionResult(null);
      }
    } catch (error) {
      console.error('Failed to load problem:', error);
    }
  };

  const selectAssignment = async (assignment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignment._id}/student`, {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedAssignment(data);
        // Start with the first problem in the assignment
        if (data.assignment.problems && data.assignment.problems.length > 0) {
          const firstProblem = data.assignment.problems[0].problemId;
          setSelectedProblem(firstProblem);
        }
        setActiveTab('solve');
        setSubmissionResult(null);
      }
    } catch (error) {
      console.error('Failed to load assignment:', error);
    }
  };

  const submitSolution = async (code, language) => {
    console.log('submitSolution called - solving standalone problem:', selectedProblem?.title);
    if (!selectedProblem) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      // Get the language ID for Judge0
      const languages = [
        { id: 63, name: 'JavaScript' },
        { id: 71, name: 'Python' },
        { id: 62, name: 'Java' },
        { id: 50, name: 'C' },
        { id: 54, name: 'C++' },
        { id: 51, name: 'C#' },
        { id: 60, name: 'Go' },
        { id: 72, name: 'Ruby' },
        { id: 68, name: 'PHP' },
        { id: 73, name: 'Rust' },
        { id: 74, name: 'TypeScript' }
      ];

      const selectedLang = languages.find(lang => lang.name.toLowerCase() === language.toLowerCase());
      if (!selectedLang) {
        throw new Error('Unsupported language');
      }

      // Test against all visible test cases
      const visibleTestCases = selectedProblem.testCases.filter(tc => !tc.isHidden);
      let allPassed = true;
      const results = [];

      for (const testCase of visibleTestCases) {
        try {
          const response = await fetch(`${API_BASE_URL}/code/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...getAuthHeaders()
            },
            body: JSON.stringify({
              source_code: code,
              language_id: selectedLang.id,
              stdin: testCase.input
            })
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.message || 'Execution failed');
          }

          const actualOutput = (result.stdout || '').trim();
          const expectedOutput = testCase.expectedOutput.trim();

          const passed = actualOutput === expectedOutput;
          if (!passed) allPassed = false;

          results.push({
            input: testCase.input,
            expectedOutput,
            actualOutput,
            passed
          });

        } catch (error) {
          allPassed = false;
          results.push({
            input: testCase.input,
            expectedOutput: testCase.expectedOutput,
            actualOutput: error.message,
            passed: false,
            error: true
          });
        }
      }

      setSubmissionResult({
        overallResult: allPassed ? 'CORRECT' : 'WRONG',
        testResults: results,
        totalTests: visibleTestCases.length,
        passedTests: results.filter(r => r.passed).length
      });

    } catch (error) {
      setSubmissionResult({
        overallResult: 'ERROR',
        error: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitAssignmentSolution = async (code, language) => {
    console.log('submitAssignmentSolution called - solving assignment problem:', selectedProblem?.title, 'in assignment:', selectedAssignment?.assignment?.title);
    if (!selectedAssignment || !selectedProblem) return;

    setIsSubmitting(true);
    setSubmissionResult(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/assignments/${selectedAssignment.assignment._id}/problems/${selectedProblem._id}/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
          },
          body: JSON.stringify({
            code,
            language
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Submission failed');
      }

      setSubmissionResult({
        overallResult: 'SUBMITTED',
        message: 'Solution submitted successfully! Check your submission status.',
        submissionId: data.submission._id
      });

    } catch (error) {
      setSubmissionResult({
        overallResult: 'ERROR',
        error: error.message
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewAssignmentScore = async (assignment) => {
    try {
      const response = await fetch(`${API_BASE_URL}/assignments/${assignment._id}/score`, {
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const scoreData = await response.json();
        setAssignmentScore(scoreData);
        setShowScoreModal(true);
      } else {
        alert('Failed to load assignment score');
      }
    } catch (error) {
      console.error('Failed to load assignment score:', error);
      alert('Failed to load assignment score');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-800">Student Dashboard</h1>
            <p className="text-lg text-gray-600 mt-1">Welcome back, {user.name}!</p>
          </div>

          {/* Navigation Tabs */}
          <div className="px-8 pb-4">
            <nav className="flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">Problems Solved</h3>
                <p className="text-3xl font-bold text-blue-600">10</p>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                <h3 className="text-xl font-semibold mb-2">Current Streak</h3>
                <p className="text-3xl font-bold text-green-600">5</p>
              </div>
            </div>
          )}

          {activeTab === 'solve' && (selectedProblem || selectedAssignment) && (
            <div className="space-y-6">
              {/* Problem/Assignment Description */}
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedAssignment ? selectedAssignment.assignment.title : selectedProblem.title}
                    </h2>
                    {selectedAssignment && (
                      <p className="text-gray-600 mt-1">Assignment: {selectedAssignment.assignment.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      {selectedProblem && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          selectedProblem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                          selectedProblem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {selectedProblem.difficulty.toUpperCase()}
                        </span>
                      )}
                      {selectedProblem && <span className="text-gray-600">{selectedProblem.category}</span>}
                      {selectedAssignment && (
                        <span className="text-sm text-gray-500">
                          Due: {new Date(selectedAssignment.assignment.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {selectedAssignment && selectedAssignment.assignment.problems && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600">
                          Problem {selectedAssignment.assignment.problems.findIndex(p => p.problemId._id === selectedProblem._id) + 1} of {selectedAssignment.assignment.problems.length}
                        </p>
                        <div className="flex space-x-2 mt-2">
                          {selectedAssignment.assignment.problems.map((problem, index) => (
                            <button
                              key={problem.problemId._id}
                              onClick={() => setSelectedProblem(problem.problemId)}
                              className={`px-3 py-1 text-sm rounded ${
                                problem.problemId._id === selectedProblem._id
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {index + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedProblem(null);
                      setSelectedAssignment(null);
                      setActiveTab(selectedAssignment ? 'assignments' : 'problems');
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ← Back to {selectedAssignment ? 'Assignments' : 'Problems'}
                  </button>
                </div>

                <div className="prose max-w-none">
                  <p className="text-gray-700 mb-4">
                    {selectedAssignment ? selectedProblem.description : selectedProblem.description}
                  </p>

                  {selectedProblem.sampleInput && selectedProblem.sampleOutput && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <h4 className="font-semibold mb-2">Sample Input:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm font-mono">{selectedProblem.sampleInput}</pre>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Sample Output:</h4>
                        <pre className="bg-gray-100 p-3 rounded text-sm font-mono">{selectedProblem.sampleOutput}</pre>
                      </div>
                    </div>
                  )}

                  {selectedProblem.constraints && (
                    <div className="mb-4">
                      <h4 className="font-semibold mb-2">Constraints:</h4>
                      <p className="text-gray-700">{selectedProblem.constraints}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Code Editor and Results */}
              <div className={`grid gap-6 ${isEditorMinimized ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
                {/* Code Editor */}
                <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${
                  isEditorMinimized ? 'h-[300px]' : 'h-[700px]'
                }`}>
                  <div className="flex items-center justify-between p-4 border-b bg-gray-50">
                    <h3 className="font-semibold text-gray-800">Code Editor</h3>
                    <button
                      onClick={() => setIsEditorMinimized(!isEditorMinimized)}
                      className="text-gray-500 hover:text-gray-700 p-1"
                      title={isEditorMinimized ? "Maximize Editor" : "Minimize Editor"}
                    >
                      {isEditorMinimized ? '⬆️' : '⬇️'}
                    </button>
                  </div>
                  <div className={`transition-all duration-300 ${isEditorMinimized ? 'h-[250px]' : 'h-[650px]'}`}>
                    <CodeEditor
                      onSubmit={selectedAssignment ? submitAssignmentSolution : submitSolution}
                      isSubmitting={isSubmitting}
                      problem={selectedProblem}
                      assignment={selectedAssignment}
                    />
                  </div>
                </div>

                {/* Submission Results */}
                {!isEditorMinimized && (
                  <div className="space-y-4">
                    {submissionResult && (
                      <div className="bg-white p-6 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold mb-4">Submission Result</h3>

                        <div className={`p-4 rounded-lg mb-4 ${
                          submissionResult.overallResult === 'CORRECT'
                            ? 'bg-green-50 border border-green-200'
                            : submissionResult.overallResult === 'WRONG'
                            ? 'bg-red-50 border border-red-200'
                            : submissionResult.overallResult === 'SUBMITTED'
                            ? 'bg-blue-50 border border-blue-200'
                            : 'bg-yellow-50 border border-yellow-200'
                        }`}>
                          <div className="flex items-center">
                            <span className={`text-2xl mr-3 ${
                              submissionResult.overallResult === 'CORRECT' ? '✅' :
                              submissionResult.overallResult === 'WRONG' ? '❌' :
                              submissionResult.overallResult === 'SUBMITTED' ? '📤' : '⚠️'
                            }`}></span>
                            <div>
                              <h4 className={`font-bold text-lg ${
                                submissionResult.overallResult === 'CORRECT' ? 'text-green-800' :
                                submissionResult.overallResult === 'WRONG' ? 'text-red-800' :
                                submissionResult.overallResult === 'SUBMITTED' ? 'text-blue-800' : 'text-yellow-800'
                              }`}>
                                {submissionResult.overallResult === 'CORRECT' ? 'CORRECT ANSWER' :
                                 submissionResult.overallResult === 'WRONG' ? 'WRONG ANSWER' :
                                 submissionResult.overallResult === 'SUBMITTED' ? 'SOLUTION SUBMITTED' :
                                 submissionResult.overallResult}
                              </h4>
                              {submissionResult.overallResult !== 'ERROR' && submissionResult.overallResult !== 'SUBMITTED' && (
                                <p className="text-sm text-gray-600">
                                  {submissionResult.passedTests} / {submissionResult.totalTests} test cases passed
                                </p>
                              )}
                              {submissionResult.overallResult === 'SUBMITTED' && submissionResult.message && (
                                <p className="text-sm text-gray-600">{submissionResult.message}</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {submissionResult.testResults && (
                          <div className="space-y-2">
                            <h5 className="font-medium">Test Case Results:</h5>
                            {submissionResult.testResults.map((result, index) => (
                              <div key={index} className={`p-3 rounded border ${
                                result.passed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium">Test Case {index + 1}</span>
                                  <span className={`font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.passed ? '✅ CORRECT' : '❌ WRONG'}
                                  </span>
                                </div>
                                <div className="text-sm space-y-1">
                                  <div><strong>Input:</strong> <code className="bg-gray-100 px-1 rounded">{result.input}</code></div>
                                  <div><strong>Expected Output:</strong> <code className="bg-gray-100 px-1 rounded">{result.expectedOutput}</code></div>
                                  <div><strong>Your Output:</strong> <code className={`px-1 rounded ${result.passed ? 'bg-green-100' : 'bg-red-100'}`}>{result.actualOutput}</code></div>
                                  {result.error && (
                                    <div className="text-red-600"><strong>Error:</strong> {result.actualOutput}</div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {submissionResult.error && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded">
                            <p className="text-red-800 font-medium">Error: {submissionResult.error}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'assignments' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">My Assignments</h2>

              {loading ? (
                <div className="text-center py-8">Loading assignments...</div>
              ) : (
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const totalProblems = assignment.problems?.length || 0;
                    const submittedProblems = Object.values(assignment.submissionStatus || {}).filter(status => status.status === 'accepted').length;
                    const isOverdue = new Date() > new Date(assignment.dueDate);

                    return (
                      <div
                        key={assignment._id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => selectAssignment(assignment)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mt-1">{assignment.description.substring(0, 100)}...</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-sm text-gray-500">
                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </span>
                              <span className={`text-sm px-2 py-1 rounded ${
                                isOverdue ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {isOverdue ? 'Overdue' : 'Active'}
                              </span>
                              <span className="text-sm text-gray-500">
                                {submittedProblems}/{totalProblems} problems solved
                              </span>
                            </div>
                            {/* Show grades for each problem */}
                            <div className="mt-3 space-y-1">
                              {assignment.problems?.map(problem => {
                                const submission = assignment.submissions?.find(s => s.problemId === problem.problemId._id);
                                return (
                                  <div key={problem.problemId._id} className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">{problem.problemId.title}</span>
                                    <div className="flex items-center space-x-2">
                                      {submission ? (
                                        <>
                                          <span className={`px-2 py-1 rounded text-xs ${
                                            submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                            submission.status === 'wrong_answer' ? 'bg-red-100 text-red-800' :
                                            submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-gray-100 text-gray-800'
                                          }`}>
                                            {submission.status === 'pending' ? 'Submitted' : submission.status.replace('_', ' ').toUpperCase()}
                                          </span>
                                          {submission.score !== undefined && (
                                            <span className="font-medium text-blue-600">{submission.score}/100</span>
                                          )}
                                          {submission.feedback && (
                                            <span className="text-xs text-gray-500 max-w-xs truncate" title={submission.feedback}>
                                              💬
                                            </span>
                                          )}
                                        </>
                                      ) : (
                                        <span className="text-gray-400 text-xs">Not submitted</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition-colors">
                              Solve Assignment
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                viewAssignmentScore(assignment);
                              }}
                              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
                            >
                              View Score
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {assignments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No assignments available yet. Check back later!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'problems' && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-bold mb-4">Available Problems</h2>

              {loading ? (
                <div className="text-center py-8">Loading problems...</div>
              ) : (
                <div className="space-y-4">
                  {problems.map(problem => (
                    <div
                      key={problem._id}
                      className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => selectProblem(problem)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{problem.title}</h3>
                          <p className="text-sm text-gray-600 mt-1">{problem.description.substring(0, 100)}...</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <span className={`text-sm px-2 py-1 rounded capitalize ${
                              problem.difficulty === 'easy' ? 'bg-green-100 text-green-800' :
                              problem.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {problem.difficulty}
                            </span>
                            <span className="text-sm text-gray-500">{problem.category}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            selectProblem(problem);
                            setActiveTab('solve');
                          }}
                          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                        >
                          Solve Problem
                        </button>
                      </div>
                    </div>
                  ))}

                  {problems.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No problems available yet. Check back later!
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'progress' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Assignment Submissions</h2>
                <div className="space-y-4">
                  {assignments.map(assignment => {
                    const submissions = assignment.submissions || [];
                    return (
                      <div key={assignment._id} className="border rounded-lg p-4">
                        <h3 className="font-semibold text-lg mb-2">{assignment.title}</h3>
                        <div className="space-y-2">
                          {assignment.problems?.map(problem => {
                            const submission = submissions.find(s => s.problemId === problem.problemId._id);
                            return (
                              <div key={problem.problemId._id} className="flex justify-between items-center">
                                <span className="text-sm">{problem.problemId.title}</span>
                                <div className="flex items-center space-x-2">
                                  {submission ? (
                                    <>
                                      <span className={`text-sm px-2 py-1 rounded ${
                                        submission.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                        submission.status === 'wrong_answer' ? 'bg-red-100 text-red-800' :
                                        submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {submission.status === 'pending' ? 'Submitted' : submission.status.replace('_', ' ').toUpperCase()}
                                      </span>
                                      {submission.score !== undefined && (
                                        <span className="text-sm font-medium">{submission.score}/100</span>
                                      )}
                                      {submission.feedback && (
                                        <span className="text-xs text-gray-500 max-w-xs truncate" title={submission.feedback}>
                                          "{submission.feedback}"
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-500">Not submitted</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {assignments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No assignments yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold mb-4">Problem Progress</h2>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Sum</span>
                    <span className="text-green-600">Solved</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Binary Search</span>
                    <span className="text-yellow-600">Attempted</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Score Modal */}
      {showScoreModal && assignmentScore && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Assignment Score</h2>
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">{assignmentScore.assignmentTitle}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="bg-blue-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{assignmentScore.totalScore}</div>
                    <div className="text-sm text-blue-800">Total Score</div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{assignmentScore.maxPossibleScore}</div>
                    <div className="text-sm text-green-800">Max Score</div>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{assignmentScore.percentage}%</div>
                    <div className="text-sm text-purple-800">Percentage</div>
                  </div>
                  <div className="bg-yellow-50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{assignmentScore.gradedProblems}/{assignmentScore.totalProblems}</div>
                    <div className="text-sm text-yellow-800">Graded</div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-semibold mb-4">Problem Breakdown</h4>
                <div className="space-y-3">
                  {assignmentScore.problemScores.map((problem, index) => (
                    <div key={problem.problemId} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <h5 className="font-medium">{index + 1}. {problem.problemTitle}</h5>
                        <div className="flex items-center space-x-3">
                          {problem.score !== null ? (
                            <>
                              <span className="font-bold text-lg text-blue-600">{problem.score}/100</span>
                              <span className={`px-2 py-1 rounded text-sm ${
                                problem.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                problem.status === 'wrong_answer' ? 'bg-red-100 text-red-800' :
                                problem.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {problem.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500 text-sm">Not graded yet</span>
                          )}
                        </div>
                      </div>
                      {problem.feedback && (
                        <div className="mt-2 p-3 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">
                            <strong>Feedback:</strong> {problem.feedback}
                          </p>
                        </div>
                      )}
                      {problem.submittedAt && (
                        <div className="mt-2 text-xs text-gray-500">
                          Submitted: {new Date(problem.submittedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowScoreModal(false)}
                  className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;