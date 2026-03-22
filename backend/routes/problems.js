const express = require('express');
const Problem = require('../models/Problem');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all problems (for students and teachers)
router.get('/', auth, async (req, res) => {
  try {
    const { difficulty, category, search, page = 1, limit = 10 } = req.query;

    let query = { isActive: true };

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (search) {
      query.$text = { $search: search };
    }

    const problems = await Problem.find(query)
      .select('-testCases -solution') // Don't send test cases and solutions to clients
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Problem.countDocuments(query);

    res.json({
      problems,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get problems error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single problem by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .select('-solution') // Don't send solution to clients
      .populate('createdBy', 'name');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    if (!problem.isActive && req.user.role !== 'admin') {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Get problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new problem (admin only)
router.post('/', auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      tags,
      timeLimit,
      memoryLimit,
      testCases,
      sampleInput,
      sampleOutput,
      constraints,
      hints,
      solution
    } = req.body;

    // Validate required fields
    if (!title || !description || !difficulty || !category || !testCases || testCases.length === 0) {
      return res.status(400).json({
        message: 'Title, description, difficulty, category, and at least one test case are required'
      });
    }

    // Validate test cases
    for (const testCase of testCases) {
      if (!testCase.input || !testCase.expectedOutput) {
        return res.status(400).json({
          message: 'Each test case must have input and expected output'
        });
      }
    }

    const problem = new Problem({
      title,
      description,
      difficulty,
      category,
      tags: tags || [],
      timeLimit: timeLimit || 1000,
      memoryLimit: memoryLimit || 256,
      testCases,
      sampleInput: sampleInput || '',
      sampleOutput: sampleOutput || '',
      constraints: constraints || '',
      hints: hints || [],
      solution: solution || '',
      createdBy: req.user._id
    });

    await problem.save();

    res.status(201).json({
      message: 'Problem created successfully',
      problem
    });
  } catch (error) {
    console.error('Create problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update problem (admin only)
router.put('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const {
      title,
      description,
      difficulty,
      category,
      tags,
      timeLimit,
      memoryLimit,
      testCases,
      sampleInput,
      sampleOutput,
      constraints,
      hints,
      solution,
      isActive
    } = req.body;

    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    // Update fields
    if (title) problem.title = title;
    if (description) problem.description = description;
    if (difficulty) problem.difficulty = difficulty;
    if (category) problem.category = category;
    if (tags) problem.tags = tags;
    if (timeLimit) problem.timeLimit = timeLimit;
    if (memoryLimit) problem.memoryLimit = memoryLimit;
    if (testCases) problem.testCases = testCases;
    if (sampleInput !== undefined) problem.sampleInput = sampleInput;
    if (sampleOutput !== undefined) problem.sampleOutput = sampleOutput;
    if (constraints !== undefined) problem.constraints = constraints;
    if (hints) problem.hints = hints;
    if (solution !== undefined) problem.solution = solution;
    if (isActive !== undefined) problem.isActive = isActive;

    await problem.save();

    res.json({
      message: 'Problem updated successfully',
      problem
    });
  } catch (error) {
    console.error('Update problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete problem (admin only)
router.delete('/:id', auth, requireRole(['admin']), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id);

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    await Problem.findByIdAndDelete(req.params.id);

    res.json({ message: 'Problem deleted successfully' });
  } catch (error) {
    console.error('Delete problem error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get problem with test cases (admin only - for editing)
router.get('/:id/admin', auth, requireRole(['admin']), async (req, res) => {
  try {
    const problem = await Problem.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!problem) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    res.json(problem);
  } catch (error) {
    console.error('Get problem admin error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;