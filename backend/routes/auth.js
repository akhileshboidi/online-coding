  const express = require('express');
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const { auth } = require('../middleware/auth');

  const router = express.Router();

  // Generate JWT token
  const generateToken = (userId) => {
    return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
  };

  // Signup route - Only allow student and teacher signup
  router.post('/signup', async (req, res) => {
    try {
      const { name, email, password, role, profile } = req.body;

      // Prevent admin signup through API
      if (role === 'admin') {
        return res.status(403).json({ message: 'Admin accounts cannot be created through signup' });
      }

      // Validate role
      if (!['student', 'teacher'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Only student and teacher roles are allowed for signup.' });
      }

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Create new user
      const user = new User({
        name,
        email,
        password,
        role,
        profile: profile || {}
      });

      await user.save();

      // Generate token
      const token = generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Login route
  router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({ message: 'Account is deactivated' });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate token
      const token = generateToken(user._id);

      // Update last login
      user.lastLogin = new Date();
      await user.save();

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profile: user.profile
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Get user profile
  router.get('/profile', auth, async (req, res) => {
    try {
      const user = await User.findById(req.user._id).select('-password');
      res.json({ user });
    } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Update user profile
  router.put('/profile', auth, async (req, res) => {
    try {
      const { name, profile } = req.body;

      const updateData = {};
      if (name) updateData.name = name;
      if (profile) updateData.profile = { ...req.user.profile, ...profile };

      const user = await User.findByIdAndUpdate(
        req.user._id,
        updateData,
        { new: true }
      ).select('-password');

      res.json({ user });
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });

  // Logout (client-side token removal, but we can track it server-side if needed)
  router.post('/logout', auth, async (req, res) => {
    try {
      // Could implement token blacklisting here if needed
      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Server error' });
    }
  });

  module.exports = router;