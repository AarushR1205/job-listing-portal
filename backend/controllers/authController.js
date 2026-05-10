import User from '../models/User.js';
import admin from '../config/firebase.js';
import fs from 'fs';

export const register = async (req, res) => {
  try {
    const { idToken, name, role, phone, companyName, skills, experience } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID Token is required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const email = decoded.email;
    const firebaseUid = decoded.uid;

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { firebaseUid }]
    });

    if (userExists) {
      // Clean up uploaded file if user already exists
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'User already exists in database' });
    }

    // Create user object based on role
    const userData = { name, email, firebaseUid, role };

    if (role === 'jobseeker') {
      userData.phone = phone;
      userData.skills = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];
      userData.experience = experience || '';
      userData.resumes = [];

      // Attach resume if uploaded
      if (req.file) {
        userData.resumes.push({
          filename: req.file.originalname,
          path: req.file.path,
          uploadedAt: new Date()
        });
      }
    } else if (role === 'employer') {
      userData.companyName = companyName;
    }

    const user = await User.create(userData);

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Login user (sync profile after Firebase login)
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ message: 'Firebase ID Token is required' });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);

    const user = await User.findOne({
      $or: [{ firebaseUid: decoded.uid }, { email: decoded.email }]
    });

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      });
    } else {
      res.status(404).json({ message: 'User profile not found. Please register first.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;

      if (user.role === 'jobseeker') {
        user.phone = req.body.phone || user.phone;
        user.skills = req.body.skills || user.skills;
        user.experience = req.body.experience || user.experience;
      } else if (user.role === 'employer') {
        user.companyName = req.body.companyName || user.companyName;
        user.companyDescription = req.body.companyDescription || user.companyDescription;
        user.website = req.body.website || user.website;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Upload a resume (adds to the resumes array)
// @route   POST /api/auth/upload-resume
// @access  Private (Job Seeker only)
export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a file' });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'User not found' });
    }

    const newResume = {
      filename: req.file.originalname,
      path: req.file.path,
      uploadedAt: new Date()
    };

    user.resumes.push(newResume);
    await user.save();

    // Return the newly added resume entry (last item)
    const added = user.resumes[user.resumes.length - 1];

    res.json({
      message: 'Resume uploaded successfully',
      resume: added
    });
  } catch (error) {
    console.error(error);
    if (req.file) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete a resume from the resumes array
// @route   DELETE /api/auth/resume/:resumeId
// @access  Private (Job Seeker only)
export const deleteResume = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resume = user.resumes.id(req.params.resumeId);

    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    // Delete the file from disk
    if (fs.existsSync(resume.path)) {
      fs.unlinkSync(resume.path);
    }

    resume.deleteOne();
    await user.save();

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
