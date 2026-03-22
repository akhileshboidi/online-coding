const express = require('express');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get assignments for a student (assignments from their class)
router.get('/student', auth, requireRole(['student']), async (req, res) => {
  try {
    // For now, we'll get all active assignments. In a real system, you'd filter by student's class
    // This assumes students are assigned to classes, but we'll implement a basic version first
    const assignments = await Assignment.find({ isActive: true })
      .populate('teacherId', 'name')
      .populate('problems.problemId', 'title difficulty')
      .sort({ dueDate: 1 });

    // Get submission status for each assignment
    const assignmentsWithStatus = await Promise.all(
      assignments.map(async (assignment) => {
        const submissions = await Submission.find({
          assignmentId: assignment._id,
          studentId: req.user._id
        }).select('problemId status score');

        const submissionStatus = {};
        submissions.forEach(sub => {
          submissionStatus[sub.problemId.toString()] = {
            status: sub.status,
            score: sub.score
          };
        });

        return {
          ...assignment.toObject(),
          submissionStatus
        };
      })
    );

    res.json(assignmentsWithStatus);
  } catch (error) {
    console.error('Get student assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single assignment details for student
router.get('/:id/student', auth, requireRole(['student']), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('teacherId', 'name')
      .populate('problems.problemId');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    if (!assignment.isActive) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get student's submissions for this assignment
    const submissions = await Submission.find({
      assignmentId: assignment._id,
      studentId: req.user._id
    }).populate('problemId', 'title');

    res.json({
      assignment,
      submissions
    });
  } catch (error) {
    console.error('Get assignment details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Submit solution for assignment problem
router.post('/:assignmentId/problems/:problemId/submit', auth, requireRole(['student']), async (req, res) => {
  try {
    const { code, language } = req.body;

    if (!code || !language) {
      return res.status(400).json({ message: 'Code and language are required' });
    }

    // Verify assignment exists and is active
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment || !assignment.isActive) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment is past due date
    if (new Date() > assignment.dueDate) {
      return res.status(400).json({ message: 'Assignment is past due date' });
    }

    // Verify problem is part of this assignment
    const problemInAssignment = assignment.problems.find(
      p => p.problemId.toString() === req.params.problemId
    );
    if (!problemInAssignment) {
      return res.status(400).json({ message: 'Problem not part of this assignment' });
    }

    // Create or update submission
    const existingSubmission = await Submission.findOne({
      assignmentId: req.params.assignmentId,
      problemId: req.params.problemId,
      studentId: req.user._id
    });

    if (existingSubmission) {
      // Update existing submission
      existingSubmission.code = code;
      existingSubmission.language = language;
      existingSubmission.status = 'pending';
      existingSubmission.submittedAt = new Date();
      await existingSubmission.save();

      res.json({
        message: 'Submission updated successfully',
        submission: existingSubmission
      });
    } else {
      // Create new submission
      const submission = new Submission({
        assignmentId: req.params.assignmentId,
        problemId: req.params.problemId,
        studentId: req.user._id,
        code,
        language,
        status: 'pending'
      });

      await submission.save();

      res.status(201).json({
        message: 'Submission created successfully',
        submission
      });
    }
  } catch (error) {
    console.error('Submit solution error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student's submissions for an assignment
router.get('/:assignmentId/submissions', auth, requireRole(['student']), async (req, res) => {
  try {
    const submissions = await Submission.find({
      assignmentId: req.params.assignmentId,
      studentId: req.user._id
    })
    .populate('problemId', 'title difficulty')
    .sort({ submittedAt: -1 });

    res.json(submissions);
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignment score for student
router.get('/:assignmentId/score', auth, requireRole(['student']), async (req, res) => {
  try {
    // Verify assignment exists and student has access
    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Get all submissions for this assignment by this student
    const submissions = await Submission.find({
      assignmentId: req.params.assignmentId,
      studentId: req.user._id
    }).populate('problemId', 'title');

    // Calculate total score
    const totalProblems = assignment.problems.length;
    const gradedSubmissions = submissions.filter(sub => sub.score !== undefined && sub.score !== null);
    const totalScore = gradedSubmissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const maxPossibleScore = totalProblems * 100;
    const percentage = maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0;

    // Get problem-wise breakdown
    const problemScores = assignment.problems.map(problem => {
      const submission = submissions.find(sub => sub.problemId._id.toString() === problem.problemId._id.toString());
      return {
        problemId: problem.problemId._id,
        problemTitle: problem.problemId.title,
        score: submission?.score || null,
        status: submission?.status || 'not_submitted',
        feedback: submission?.feedback || null,
        submittedAt: submission?.submittedAt || null
      };
    });

    res.json({
      assignmentId: assignment._id,
      assignmentTitle: assignment.title,
      totalProblems,
      gradedProblems: gradedSubmissions.length,
      totalScore,
      maxPossibleScore,
      percentage,
      problemScores
    });
  } catch (error) {
    console.error('Get assignment score error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// TEACHER ROUTES

// Create new assignment (teacher only)
router.post('/', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const {
      title,
      description,
      problems,
      classId,
      dueDate,
      instructions,
      totalPoints
    } = req.body;

    if (!title || !description || !problems || !classId || !dueDate) {
      return res.status(400).json({
        message: 'Title, description, problems, classId, and dueDate are required'
      });
    }

    const assignment = new Assignment({
      title,
      description,
      problems,
      classId,
      teacherId: req.user._id,
      dueDate: new Date(dueDate),
      instructions: instructions || '',
      totalPoints: totalPoints || 100
    });

    await assignment.save();

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment
    });
  } catch (error) {
    console.error('Create assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get assignments created by teacher
router.get('/teacher', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user._id })
      .populate('problems.problemId', 'title difficulty')
      .sort({ createdAt: -1 });

    res.json(assignments);
  } catch (error) {
    console.error('Get teacher assignments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get submissions for an assignment (teacher only)
router.get('/:assignmentId/submissions/teacher', auth, requireRole(['teacher']), async (req, res) => {
  try {
    // Verify teacher owns this assignment
    const assignment = await Assignment.findOne({
      _id: req.params.assignmentId,
      teacherId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    const submissions = await Submission.find({
      assignmentId: req.params.assignmentId
    })
    .populate('studentId', 'name email')
    .populate('problemId', 'title')
    .sort({ submittedAt: -1 });

    res.json({
      assignment,
      submissions
    });
  } catch (error) {
    console.error('Get assignment submissions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Grade a submission (teacher only)
router.put('/submissions/:submissionId/grade', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const { score, feedback } = req.body;

    const submission = await Submission.findById(req.params.submissionId)
      .populate('assignmentId', 'teacherId');

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify teacher owns the assignment
    if (submission.assignmentId.teacherId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to grade this submission' });
    }

    submission.score = score;
    submission.feedback = feedback || '';
    submission.gradedBy = req.user._id;
    submission.gradedAt = new Date();
    submission.status = 'accepted'; // Change status to accepted when graded

    await submission.save();

    res.json({
      message: 'Submission graded successfully',
      submission
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update assignment (teacher only)
router.put('/:id', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const {
      title,
      description,
      problems,
      classId,
      dueDate,
      instructions,
      totalPoints,
      isActive
    } = req.body;

    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Update fields
    if (title !== undefined) assignment.title = title;
    if (description !== undefined) assignment.description = description;
    if (problems !== undefined) assignment.problems = problems;
    if (classId !== undefined) assignment.classId = classId;
    if (dueDate !== undefined) assignment.dueDate = new Date(dueDate);
    if (instructions !== undefined) assignment.instructions = instructions;
    if (totalPoints !== undefined) assignment.totalPoints = totalPoints;
    if (isActive !== undefined) assignment.isActive = isActive;

    await assignment.save();

    res.json({
      message: 'Assignment updated successfully',
      assignment
    });
  } catch (error) {
    console.error('Update assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete assignment (teacher only)
router.delete('/:id', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    });

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if assignment has submissions
    const submissionCount = await Submission.countDocuments({
      assignmentId: req.params.id
    });

    if (submissionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete assignment with existing submissions. Deactivate it instead.'
      });
    }

    await Assignment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single assignment for editing (teacher only)
router.get('/:id/edit', auth, requireRole(['teacher']), async (req, res) => {
  try {
    const assignment = await Assignment.findOne({
      _id: req.params.id,
      teacherId: req.user._id
    }).populate('problems.problemId', 'title difficulty category');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment for edit error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;