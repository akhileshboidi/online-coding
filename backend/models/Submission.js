const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  assignmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Assignment',
    required: true
  },
  problemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Problem',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  code: {
    type: String,
    required: true
  },
  language: {
    type: String,
    required: true,
    enum: ['javascript', 'python', 'java', 'c', 'cpp', 'csharp', 'go', 'ruby', 'php', 'rust', 'typescript']
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error'],
    default: 'pending'
  },
  testResults: [{
    testCase: {
      input: String,
      expectedOutput: String
    },
    actualOutput: String,
    passed: Boolean,
    executionTime: Number, // in milliseconds
    memoryUsed: Number // in MB
  }],
  score: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  feedback: {
    type: String,
    default: ''
  },
  gradedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  gradedAt: Date,
  submittedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
submissionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Index for better query performance
submissionSchema.index({ assignmentId: 1, studentId: 1, problemId: 1 });
submissionSchema.index({ studentId: 1, submittedAt: -1 });
submissionSchema.index({ status: 1, submittedAt: -1 });

module.exports = mongoose.model('Submission', submissionSchema);