import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';
import { calculateATSScore } from '../utils/atsScoring.js';
import sendEmail from '../utils/sendEmail.js';

export const applyForJob = async (req, res) => {
  try {
    const { jobId, coverLetter, quizAnswers } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      applicant: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'You have already applied for this job' });
    }

    // Evaluate quiz if required
    let finalQuizScore = null;
    if (job.isQuizRequired && job.quiz && job.quiz.length > 0) {
        if (!quizAnswers || !Array.isArray(quizAnswers) || quizAnswers.length !== job.quiz.length) {
            return res.status(400).json({ message: 'Please complete the required skill assessment quiz' });
        }
        
        let correctAnswers = 0;
        job.quiz.forEach((q, index) => {
            if (q.correctAnswerIndex === quizAnswers[index]) {
                correctAnswers++;
            }
        });
        finalQuizScore = Math.round((correctAnswers / job.quiz.length) * 100);
    }

    // Calculate ATS Score async
    let atsData = null;
    if (req.user.resume) {
        atsData = await calculateATSScore(req.user.resume, job);
    }

    // Create application
    const application = await Application.create({
      job: jobId,
      applicant: req.user._id,
      coverLetter,
      atsScore: atsData ? atsData.score : null,
      atsFeedback: atsData ? atsData.feedback : '',
      quizScore: finalQuizScore
    });

    // Update job applications count
    job.applicationsCount += 1;
    await job.save();

    const populatedApplication = await Application.findById(application._id)
      .populate('job', 'title company location')
      .populate('applicant', 'name email');

    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get job seeker's applications
// @route   GET /api/applications/my-applications
// @access  Private (Job Seeker only)
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ applicant: req.user._id })
      .populate({
        path: 'job',
        populate: {
          path: 'employer',
          select: 'name companyName email'
        }
      })
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get applications for a specific job
// @route   GET /api/applications/job/:jobId
// @access  Private (Employer only)
export const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user is the job owner or an admin
    if (job.employer.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these applications' });
    }

    const applications = await Application.find({ job: req.params.jobId })
      .populate('applicant', 'name email phone resume skills experience')
      .sort({ appliedAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private (Employer only)
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Pending', 'Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized (employer owner or applicant)
    const isOwner = application.job.employer.toString() === req.user._id.toString();
    const isApplicant = application.applicant.toString() === req.user._id.toString();

    if (!isOwner && !isApplicant) {
      return res.status(403).json({ message: 'Not authorized to update this application' });
    }

    // Job seekers can only accept or reject an offer
    if (isApplicant && !['Accepted', 'Rejected'].includes(status)) {
      return res.status(403).json({ message: 'You can only accept or reject an offer' });
    }

    application.status = status;
    await application.save();

    const updatedApplication = await Application.findById(application._id)
      .populate('applicant', 'name email')
      .populate({
        path: 'job',
        select: 'title employer',
        populate: { path: 'employer', select: 'companyName name' }
      });

    // Send automated email if an employer made the update
    if (isOwner && !isApplicant) {
      try {
        const company = updatedApplication.job.employer?.companyName || updatedApplication.job.employer?.name || 'Our Company';
        const emailMessage = `Hello ${updatedApplication.applicant.name},\n\nYour application status for the position of "${updatedApplication.job.title}" at ${company} has been updated to: ${status}.\n\nLog in to your dashboard to view more details.\n\nBest regards,\n${company} Hiring Team`;

        await sendEmail({
          email: updatedApplication.applicant.email,
          subject: `Application Status Update: ${updatedApplication.job.title}`,
          message: emailMessage
        });
      } catch (err) {
        console.error('Email sending failed:', err);
      }
    }

    res.json(updatedApplication);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send a message
// @route   POST /api/applications/:id/messages
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { content, messageType, imageUrl } = req.body;
    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized (applicant or job owner)
    const isApplicant = application.applicant.toString() === req.user._id.toString();
    const isOwner = application.job.employer.toString() === req.user._id.toString();

    if (!isApplicant && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to send messages here' });
    }

    const newMessage = {
      sender: req.user._id,
      content,
      messageType: messageType || 'text',
      imageUrl
    };

    application.messages.push(newMessage);
    await application.save();

    // Create notification for the recipient
    const recipient = isApplicant ? application.job.employer : application.applicant;
    
    await Notification.create({
      recipient,
      sender: req.user._id,
      application: application._id,
      message: messageType === 'image' ? 'Sent you an image' : content.substring(0, 50) + (content.length > 50 ? '...' : '')
    });

    // Populate the newly created message to match what getMessages returns
    const populatedApp = await Application.findById(application._id).populate('messages.sender', 'name role');
    const savedMessage = populatedApp.messages[populatedApp.messages.length - 1];

    // Emit the new message via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(req.params.id).emit('receive_message', savedMessage);
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages for an application
// @route   GET /api/applications/:id/messages
// @access  Private
export const getMessages = async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('messages.sender', 'name role');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is authorized
    const isApplicant = application.applicant.toString() === req.user._id.toString();
    const isOwner = application.job.employer.toString() === req.user._id.toString();

    if (!isApplicant && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to view messages' });
    }

    res.json(application.messages);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Send an offer letter
// @route   POST /api/applications/:id/offer
// @access  Private (Employer only)
export const sendOfferLetter = async (req, res) => {
  try {
    const { content, salary, joiningDate } = req.body;
    const application = await Application.findById(req.params.id).populate('job');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the job owner
    if (application.job.employer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to send offer letters for this job' });
    }

    application.offerLetter = {
      content,
      salary,
      joiningDate,
      sentAt: new Date(),
      status: 'Sent'
    };

    // Automatically mark application as Accepted when offer is sent
    application.status = 'Accepted';

    await application.save();

    const populatedApp = await Application.findById(application._id)
      .populate('applicant', 'name email')
      .populate({
        path: 'job',
        populate: { path: 'employer', select: 'companyName name' }
      });

    try {
      const company = populatedApp.job.employer?.companyName || populatedApp.job.employer?.name || 'Our Company';
      const emailMessage = `Hello ${populatedApp.applicant.name},\n\nCongratulations! You have received a job offer for the position of "${populatedApp.job.title}" at ${company}.\n\nSalary: ₹${salary}\nJoining Date: ${new Date(joiningDate).toLocaleDateString()}\n\nPlease log in to your CareerBridge dashboard to view the full offer details and accept or reject it.\n\nBest regards,\n${company} Hiring Team`;

      await sendEmail({
        email: populatedApp.applicant.email,
        subject: `Job Offer: ${populatedApp.job.title} at ${company}`,
        message: emailMessage
      });
    } catch (err) {
      console.error('Offer email sending failed:', err);
    }

    res.json({ message: 'Offer letter sent successfully', offerLetter: application.offerLetter });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
