import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true
  },
  role: {
    type: String,
    enum: ['jobseeker', 'employer', 'admin'],
    required: [true, 'Please specify role']
  },
  // Job Seeker specific fields
  phone: {
    type: String,
    required: function() { return this.role === 'jobseeker'; }
  },
  resume: {
    type: String, // File path
    default: null
  },
  skills: [{
    type: String
  }],
  experience: {
    type: String,
    default: ''
  },
  // Employer specific fields
  companyName: {
    type: String,
    required: function() { return this.role === 'employer'; }
  },
  companyDescription: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);

export default User;
