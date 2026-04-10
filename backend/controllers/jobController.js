import Job from '../models/Job.js';
import Application from '../models/Application.js';

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer & Admin)
export const createJob = async (req, res) => {
  try {
    const {
      title,
      description,
      qualifications,
      responsibilities,
      jobType,
      location,
      salaryRange,
      deadline,
      isQuizRequired,
      quiz
    } = req.body;

    const job = await Job.create({
      title,
      description,
      qualifications,
      responsibilities,
      jobType,
      location,
      salaryRange,
      deadline,
      isQuizRequired,
      quiz: isQuizRequired ? quiz : [],
      employer: req.user._id
    });

    res.status(201).json(job);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get all jobs with search and filters
// @route   GET /api/jobs
// @access  Public
export const getAllJobs = async (req, res) => {
  try {
    const { keyword, location, jobType, minSalary, maxSalary } = req.query;
    
    let query = { status: 'active' };

    // Keyword search
    if (keyword) {
      query.$text = { $search: keyword };
    }

    // Location filter
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }

    // Job type filter
    if (jobType) {
      query.jobType = jobType;
    }

    // Salary range filter
    if (minSalary || maxSalary) {
      query['salaryRange.min'] = {};
      if (minSalary) query['salaryRange.min'].$gte = Number(minSalary);
      if (maxSalary) query['salaryRange.max'] = { $lte: Number(maxSalary) };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'name companyName email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get single job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('employer', 'name companyName companyDescription email website');

    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get employer's jobs
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (Employer only)
export const getEmployerJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ employer: req.user._id })
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get employer analytics
// @route   GET /api/jobs/employer/analytics
// @access  Private (Employer only)
export const getEmployerAnalytics = async (req, res) => {
  try {
    const employerId = req.user._id;

    // 1. Job Stats
    const jobs = await Job.find({ employer: employerId });
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(job => job.status === 'active').length;
    const totalApplications = jobs.reduce((sum, job) => sum + (job.applicationsCount || 0), 0);

    const jobIds = jobs.map(j => j._id);

    // 2. Applications by Status (Pie Chart)
    const applicationsByStatus = await Application.aggregate([
      { $match: { job: { $in: jobIds } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusData = applicationsByStatus.map(item => ({
      name: item._id,
      value: item.count
    }));

    // 3. Applications over last 30 days (Line Chart)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const applicationsByDate = await Application.aggregate([
      { 
        $match: { 
          job: { $in: jobIds },
          appliedAt: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$appliedAt" } },
          applications: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const timelineData = applicationsByDate.map(item => ({
      date: item._id,
      applications: item.applications
    }));

    res.json({
      stats: { totalJobs, activeJobs, totalApplications },
      statusData,
      timelineData,
      recentJobs: jobs.slice(0, 5).sort((a,b) => b.createdAt - a.createdAt)
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer only)
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job owner or an admin
    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this job' });
    }

    const {
      title,
      description,
      qualifications,
      responsibilities,
      jobType,
      location,
      salaryRange,
      status,
      deadline,
      isQuizRequired,
      quiz
    } = req.body;

    job.title = title || job.title;
    job.description = description || job.description;
    job.qualifications = qualifications || job.qualifications;
    job.responsibilities = responsibilities || job.responsibilities;
    job.jobType = jobType || job.jobType;
    job.location = location || job.location;
    job.salaryRange = salaryRange || job.salaryRange;
    job.status = status || job.status;
    job.deadline = deadline || job.deadline;
    if (isQuizRequired !== undefined) job.isQuizRequired = isQuizRequired;
    
    if (!job.isQuizRequired) {
      job.quiz = [];
    } else if (quiz) {
      job.quiz = quiz;
    }

    const updatedJob = await job.save();
    res.json(updatedJob);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer only)
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job owner or an admin
    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this job' });
    }

    await job.deleteOne();
    
    // Also delete all applications for this job
    await Application.deleteMany({ job: req.params.id });

    res.json({ message: 'Job removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
