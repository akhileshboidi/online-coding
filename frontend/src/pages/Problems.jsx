import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';

const Problems = () => {
  const [code, setCode] = useState('// Write your code here');
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [selectedProblem, setSelectedProblem] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [patternFilter, setPatternFilter] = useState('All');
  const [expandedPatterns, setExpandedPatterns] = useState(new Set(['Array', 'String', 'Linked List', 'Tree', 'Dynamic Programming', 'Graph', 'Backtracking', 'Greedy', 'Bit Manipulation']));
  const [customTestCases, setCustomTestCases] = useState([]);

  const problems = [
    // Array Problems
    {
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      examples: [
        { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]' },
        { input: 'nums = [3,2,4], target = 6', output: '[1,2]' }
      ],
      difficulty: 'Easy',
      pattern: 'Array'
    },
    {
      title: 'Maximum Subarray',
      description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
      examples: [
        { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' }
      ],
      difficulty: 'Medium',
      pattern: 'Array'
    },
    {
      title: 'Contains Duplicate',
      description: 'Given an integer array nums, return true if any value appears at least twice in the array, and return false if every element is distinct.',
      examples: [
        { input: 'nums = [1,2,3,1]', output: 'true' },
        { input: 'nums = [1,2,3,4]', output: 'false' }
      ],
      difficulty: 'Easy',
      pattern: 'Array'
    },
    {
      title: 'Product of Array Except Self',
      description: 'Given an integer array nums, return an array answer such that answer[i] is equal to the product of all the elements of nums except nums[i].',
      examples: [
        { input: 'nums = [1,2,3,4]', output: '[24,12,8,6]' }
      ],
      difficulty: 'Medium',
      pattern: 'Array'
    },

    // String Problems
    {
      title: 'Valid Palindrome',
      description: 'Given a string s, determine if it is a palindrome, considering only alphanumeric characters and ignoring cases.',
      examples: [
        { input: 's = "A man, a plan, a canal: Panama"', output: 'true' },
        { input: 's = "race a car"', output: 'false' }
      ],
      difficulty: 'Easy',
      pattern: 'String'
    },
    {
      title: 'Longest Substring Without Repeating Characters',
      description: 'Given a string s, find the length of the longest substring without repeating characters.',
      examples: [
        { input: 's = "abcabcbb"', output: '3' },
        { input: 's = "bbbbb"', output: '1' }
      ],
      difficulty: 'Medium',
      pattern: 'String'
    },
    {
      title: 'Group Anagrams',
      description: 'Given an array of strings strs, group the anagrams together.',
      examples: [
        { input: 'strs = ["eat","tea","tan","ate","nat","bat"]', output: '[["bat"],["nat","tan"],["ate","eat","tea"]]' }
      ],
      difficulty: 'Medium',
      pattern: 'String'
    },

    // Linked List Problems
    {
      title: 'Merge Two Sorted Lists',
      description: 'Merge two sorted linked lists and return it as a sorted list.',
      examples: [
        { input: 'list1 = [1,2,4], list2 = [1,3,4]', output: '[1,1,2,3,4,4]' }
      ],
      difficulty: 'Easy',
      pattern: 'Linked List'
    },
    {
      title: 'Reverse Linked List',
      description: 'Given the head of a singly linked list, reverse the list, and return the reversed list.',
      examples: [
        { input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }
      ],
      difficulty: 'Easy',
      pattern: 'Linked List'
    },
    {
      title: 'Linked List Cycle',
      description: 'Given head, the head of a linked list, determine if the linked list has a cycle in it.',
      examples: [
        { input: 'head = [3,2,0,-4], pos = 1', output: 'true' }
      ],
      difficulty: 'Easy',
      pattern: 'Linked List'
    },

    // Tree Problems
    {
      title: 'Binary Tree Inorder Traversal',
      description: 'Given the root of a binary tree, return the inorder traversal of its nodes\' values.',
      examples: [
        { input: 'root = [1,null,2,3]', output: '[1,3,2]' }
      ],
      difficulty: 'Medium',
      pattern: 'Tree'
    },
    {
      title: 'Maximum Depth of Binary Tree',
      description: 'Given the root of a binary tree, return its maximum depth.',
      examples: [
        { input: 'root = [3,9,20,null,null,15,7]', output: '3' }
      ],
      difficulty: 'Easy',
      pattern: 'Tree'
    },
    {
      title: 'Validate Binary Search Tree',
      description: 'Given the root of a binary tree, determine if it is a valid binary search tree (BST).',
      examples: [
        { input: 'root = [2,1,3]', output: 'true' },
        { input: 'root = [5,1,4,null,null,3,6]', output: 'false' }
      ],
      difficulty: 'Medium',
      pattern: 'Tree'
    },

    // Dynamic Programming
    {
      title: 'Climbing Stairs',
      description: 'You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?',
      examples: [
        { input: 'n = 2', output: '2' },
        { input: 'n = 3', output: '3' }
      ],
      difficulty: 'Easy',
      pattern: 'Dynamic Programming'
    },
    {
      title: 'House Robber',
      description: 'You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed, the only constraint stopping you from robbing each of them is that adjacent houses have security systems connected.',
      examples: [
        { input: 'nums = [1,2,3,1]', output: '4' },
        { input: 'nums = [2,7,9,3,1]', output: '12' }
      ],
      difficulty: 'Medium',
      pattern: 'Dynamic Programming'
    },
    {
      title: 'Longest Common Subsequence',
      description: 'Given two strings text1 and text2, return the length of their longest common subsequence.',
      examples: [
        { input: 'text1 = "abcde", text2 = "ace"', output: '3' }
      ],
      difficulty: 'Medium',
      pattern: 'Dynamic Programming'
    },

    // Graph Problems
    {
      title: 'Number of Islands',
      description: 'Given an m x n 2D binary grid grid which represents a map of \'1\'s (land) and \'0\'s (water), return the number of islands.',
      examples: [
        { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: '1' }
      ],
      difficulty: 'Medium',
      pattern: 'Graph'
    },
    {
      title: 'Course Schedule',
      description: 'There are a total of numCourses courses you have to take, labeled from 0 to numCourses - 1. You are given an array prerequisites where prerequisites[i] = [ai, bi] indicates that you must take course bi first if you want to take course ai.',
      examples: [
        { input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' },
        { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false' }
      ],
      difficulty: 'Medium',
      pattern: 'Graph'
    },

    // Backtracking
    {
      title: 'Permutations',
      description: 'Given an array nums of distinct integers, return all the possible permutations.',
      examples: [
        { input: 'nums = [1,2,3]', output: '[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]' }
      ],
      difficulty: 'Medium',
      pattern: 'Backtracking'
    },
    {
      title: 'Subsets',
      description: 'Given an integer array nums of unique elements, return all possible subsets (the power set).',
      examples: [
        { input: 'nums = [1,2,3]', output: '[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]' }
      ],
      difficulty: 'Medium',
      pattern: 'Backtracking'
    },

    // Greedy
    {
      title: 'Jump Game',
      description: 'Given an array of non-negative integers nums, you are initially positioned at the first index of the array. Each element in the array represents your maximum jump length at that position. Determine if you are able to reach the last index.',
      examples: [
        { input: 'nums = [2,3,1,1,4]', output: 'true' },
        { input: 'nums = [3,2,1,0,4]', output: 'false' }
      ],
      difficulty: 'Medium',
      pattern: 'Greedy'
    },
    {
      title: 'Maximum Subarray',
      description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
      examples: [
        { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6' }
      ],
      difficulty: 'Medium',
      pattern: 'Greedy'
    },

    // Bit Manipulation
    {
      title: 'Single Number',
      description: 'Given a non-empty array of integers nums, every element appears twice except for one. Find that single one.',
      examples: [
        { input: 'nums = [2,2,1]', output: '1' },
        { input: 'nums = [4,1,2,1,2]', output: '4' }
      ],
      difficulty: 'Easy',
      pattern: 'Bit Manipulation'
    },
    {
      title: 'Number of 1 Bits',
      description: 'Write a function that takes an unsigned integer and returns the number of \'1\' bits it has (also known as the Hamming weight).',
      examples: [
        { input: 'n = 00000000000000000000000000001011', output: '3' }
      ],
      difficulty: 'Easy',
      pattern: 'Bit Manipulation'
    }
  ];

  const filteredProblems = problems.filter(problem => {
    const matchesSearch = problem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          problem.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || problem.difficulty === difficultyFilter;
    const matchesPattern = patternFilter === 'All' || problem.pattern === patternFilter;
    return matchesSearch && matchesDifficulty && matchesPattern;
  });

  useEffect(() => {
    const examples = problems[selectedProblem].examples;
    const defaultTC = examples.map(ex => ({ input: ex.input, expected: ex.output }));
    // Add more if less than 3
    while (defaultTC.length < 3) {
      defaultTC.push({ input: '', expected: '' });
    }
    setCustomTestCases(defaultTC);
  }, [selectedProblem]);

  const togglePattern = (pattern) => {
    const newExpanded = new Set(expandedPatterns);
    if (newExpanded.has(pattern)) {
      newExpanded.delete(pattern);
    } else {
      newExpanded.add(pattern);
    }
    setExpandedPatterns(newExpanded);
  };

  const addTestCase = () => {
    setCustomTestCases([...customTestCases, { input: '', expected: '' }]);
  };

  const updateTestCase = (idx, field, value) => {
    const newTC = [...customTestCases];
    newTC[idx][field] = value;
    setCustomTestCases(newTC);
  };

  const handleRun = () => {
    let output = 'Running code against test cases...\n';
    customTestCases.forEach((tc, idx) => {
      if (tc.input && tc.expected) {
        output += `Test Case ${idx + 1}: Input: ${tc.input}, Expected: ${tc.expected}, Result: Mock - Passed\n`;
      }
    });
    if (customTestCases.length === 0 || customTestCases.every(tc => !tc.input)) {
      output += 'No test cases defined. Output: Hello World';
    }
    setOutput(output);
  };

  const handleSubmit = () => {
    // mock submit
    setOutput('Submitting...\nAccepted');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">Problems</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <h2 className="text-2xl font-bold mb-4">DSA Patterns</h2>
            <div className="mb-6">
              <input
                type="text"
                placeholder="Search problems..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full p-2 border rounded mb-4"
              />
              <div className="flex flex-wrap gap-2 mb-4">
                <button onClick={() => setDifficultyFilter('All')} className={`px-4 py-2 rounded ${difficultyFilter === 'All' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}>All Difficulties</button>
                <button onClick={() => setDifficultyFilter('Easy')} className={`px-4 py-2 rounded ${difficultyFilter === 'Easy' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>Easy</button>
                <button onClick={() => setDifficultyFilter('Medium')} className={`px-4 py-2 rounded ${difficultyFilter === 'Medium' ? 'bg-yellow-500 text-white' : 'bg-gray-200'}`}>Medium</button>
                <button onClick={() => setDifficultyFilter('Hard')} className={`px-4 py-2 rounded ${difficultyFilter === 'Hard' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}>Hard</button>
              </div>
              <select value={patternFilter} onChange={(e) => setPatternFilter(e.target.value)} className="p-2 border rounded">
                <option value="All">All Patterns</option>
                {['Array', 'String', 'Linked List', 'Tree', 'Dynamic Programming', 'Graph', 'Backtracking', 'Greedy', 'Bit Manipulation'].map(pattern => (
                  <option key={pattern} value={pattern}>{pattern}</option>
                ))}
              </select>
            </div>
            <div className="space-y-4">
              {['Array', 'String', 'Linked List', 'Tree', 'Dynamic Programming', 'Graph', 'Backtracking', 'Greedy', 'Bit Manipulation'].map((pattern) => {
                const patternProblems = filteredProblems.filter(p => p.pattern === pattern);
                if (patternProblems.length === 0) return null;
                return (
                  <div key={pattern}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-lg mb-2 text-gray-700">{pattern}</h3>
                      <button onClick={() => togglePattern(pattern)} className="text-gray-500 hover:text-gray-700">
                        {expandedPatterns.has(pattern) ? '▼' : '▶'}
                      </button>
                    </div>
                    {expandedPatterns.has(pattern) && (
                      <div className="space-y-1">
                        {patternProblems.map((problem, index) => {
                          const globalIndex = problems.findIndex(p => p.title === problem.title);
                          return (
                            <div
                              key={index}
                              onClick={() => setSelectedProblem(globalIndex)}
                              className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedProblem === globalIndex ? 'bg-blue-100 border-blue-300' : 'bg-white hover:bg-gray-100'
                              } border`}
                            >
                              <h4 className="font-medium text-sm">{problem.title}</h4>
                              <p className={`text-xs ${problem.difficulty === 'Easy' ? 'text-green-600' : problem.difficulty === 'Medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                                {problem.difficulty}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold">{problems[selectedProblem].title}</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  problems[selectedProblem].difficulty === 'Easy' ? 'bg-green-100 text-green-800' :
                  problems[selectedProblem].difficulty === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {problems[selectedProblem].difficulty}
                </span>
              </div>
              <p className="text-sm text-blue-600 mb-2">Pattern: {problems[selectedProblem].pattern}</p>
              <p className="text-gray-600 mb-4">{problems[selectedProblem].description}</p>
              <h3 className="font-semibold mb-2">Examples:</h3>
              {problems[selectedProblem].examples.map((example, idx) => (
                <div key={idx} className="mb-4 p-4 bg-gray-100 rounded">
                  <p><strong>Input:</strong> {example.input}</p>
                  <p><strong>Output:</strong> {example.output}</p>
                </div>
              ))}
            </div>
            <div className="mb-4">
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="p-2 border rounded">
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="csharp">C#</option>
                <option value="go">Go</option>
                <option value="rust">Rust</option>
                <option value="php">PHP</option>
                <option value="ruby">Ruby</option>
                <option value="swift">Swift</option>
                <option value="kotlin">Kotlin</option>
                <option value="scala">Scala</option>
                <option value="r">R</option>
                <option value="sql">SQL</option>
              </select>
            </div>
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-lg font-bold mb-4">Test Cases</h4>
              <div className="space-y-4">
                {customTestCases.map((tc, idx) => (
                  <div key={idx} className="border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="font-semibold">Test Case {idx + 1}</h5>
                      <button onClick={() => {/* run single test */}} className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm">Run</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Input</label>
                        <textarea
                          value={tc.input}
                          onChange={(e) => updateTestCase(idx, 'input', e.target.value)}
                          placeholder="Enter input here..."
                          className="w-full p-2 border rounded h-20 resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Expected Output</label>
                        <textarea
                          value={tc.expected}
                          onChange={(e) => updateTestCase(idx, 'expected', e.target.value)}
                          placeholder="Enter expected output here..."
                          className="w-full p-2 border rounded h-20 resize-none"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-600">
                      Status: {tc.input && tc.expected ? 'Ready' : 'Incomplete'}
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={addTestCase} className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">+ Add Test Case</button>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div>
                <Editor
                  height="500px"
                  language={language}
                  value={code}
                  onChange={(value) => setCode(value)}
                  theme="vs-dark"
                  className="border rounded"
                />
                <div className="mt-4 flex gap-4">
                  <button onClick={handleRun} className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors">Run</button>
                  <button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors">Submit</button>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-4">Output</h3>
                <pre className="bg-gray-100 p-4 rounded-lg h-500px overflow-auto border">{output}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Problems;