import { useState } from 'react';

const Contest = () => {
  const [selectedContest, setSelectedContest] = useState(0);

  const contests = [
    {
      title: 'Weekly Contest 1',
      date: '2025-10-05',
      duration: '90 minutes',
      problems: [
        { title: 'Two Sum', difficulty: 'Easy', solved: true },
        { title: 'Binary Tree Traversal', difficulty: 'Medium', solved: false },
        { title: 'Merge Lists', difficulty: 'Easy', solved: true },
        { title: 'Graph Shortest Path', difficulty: 'Hard', solved: false }
      ],
      status: 'Completed'
    },
    {
      title: 'Weekly Contest 2',
      date: '2025-10-12',
      duration: '90 minutes',
      problems: [
        { title: 'Array Rotation', difficulty: 'Easy', solved: false },
        { title: 'Dynamic Programming', difficulty: 'Medium', solved: false },
        { title: 'String Matching', difficulty: 'Medium', solved: false },
        { title: 'Advanced Graph', difficulty: 'Hard', solved: false }
      ],
      status: 'Upcoming'
    }
  ];

  const currentContest = contests[selectedContest];
  const solvedCount = currentContest.problems.filter(p => p.solved).length;
  const totalProblems = currentContest.problems.length;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Weekly Contests</h1>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">Contest List</h2>
            <div className="space-y-2">
              {contests.map((contest, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedContest(index)}
                  className={`p-4 rounded-lg cursor-pointer transition-colors ${
                    selectedContest === index ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'
                  } border`}
                >
                  <h3 className="font-semibold">{contest.title}</h3>
                  <p className="text-sm text-gray-600">{contest.date}</p>
                  <p className={`text-sm ${contest.status === 'Completed' ? 'text-green-600' : 'text-orange-600'}`}>
                    {contest.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-3xl font-bold mb-2">{currentContest.title}</h2>
              <p className="text-gray-600 mb-4">Date: {currentContest.date} | Duration: {currentContest.duration}</p>
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Progress</h3>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-blue-600 h-4 rounded-full"
                    style={{ width: `${(solvedCount / totalProblems) * 100}%` }}
                  ></div>
                </div>
                <p className="mt-2 text-sm text-gray-600">{solvedCount} / {totalProblems} problems solved</p>
              </div>
              <h3 className="text-xl font-semibold mb-4">Problems</h3>
              <div className="space-y-3">
                {currentContest.problems.map((problem, idx) => (
                  <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium">{problem.title}</h4>
                      <p className={`text-sm ${problem.difficulty === 'Easy' ? 'text-green-600' : problem.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                        {problem.difficulty}
                      </p>
                    </div>
                    <div className="flex items-center">
                      {problem.solved ? (
                        <span className="text-green-600 font-semibold">Solved</span>
                      ) : (
                        <span className="text-gray-500">Not Solved</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contest;