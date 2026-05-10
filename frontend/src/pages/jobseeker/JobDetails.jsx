import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaMapMarkerAlt, FaBriefcase, FaDollarSign, FaBuilding, FaArrowLeft, FaMagic, FaFileAlt, FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

const JobDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [job, setJob] = useState(null);
    const [loading, setLoading] = useState(true);
    const [applying, setApplying] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [coverLetter, setCoverLetter] = useState('');
    const [quizAnswers, setQuizAnswers] = useState([]);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [userResumes, setUserResumes] = useState([]);
    const [selectedResumeId, setSelectedResumeId] = useState('');
    const [atsResult, setAtsResult] = useState(null); // holds result after applying

    const handleGenerateAI = async () => {
        setGenerating(true);
        setMessage({ type: '', text: '' });

        try {
            const { data } = await api.post('/ai/generate-cover-letter', {
                jobTitle: job.title,
                jobDescription: job.description
            });
            setCoverLetter(data.coverLetter);
            setMessage({ type: 'success', text: 'Cover letter generated successfully!' });
        } catch (error) {
            console.error('Generation error:', error);
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to generate cover letter'
            });
        } finally {
            setGenerating(false);
        }
    };

    useEffect(() => {
        fetchJob();
        fetchUserResumes();
    }, [id]);

    const fetchJob = async () => {
        try {
            const { data } = await api.get(`/jobs/${id}`);
            setJob(data);
            if (data.isQuizRequired && data.quiz) {
                setQuizAnswers(new Array(data.quiz.length).fill(null));
            }
        } catch (error) {
            console.error('Error fetching job:', error);
            setMessage({ type: 'error', text: 'Failed to load job details' });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserResumes = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            const resumes = data.resumes || [];
            setUserResumes(resumes);
            if (resumes.length > 0) {
                setSelectedResumeId(resumes[resumes.length - 1]._id); // default to most recent
            }
        } catch (error) {
            console.error('Error fetching resumes:', error);
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setApplying(true);
        setMessage({ type: '', text: '' });

        try {
            if (job.isQuizRequired && quizAnswers.includes(null)) {
                setApplying(false);
                return setMessage({ type: 'error', text: 'Please answer all multiple-choice questions in the skill assessment.' });
            }

            if (!selectedResumeId) {
                setApplying(false);
                return setMessage({ type: 'error', text: 'Please select a resume to apply with.' });
            }

            const { data } = await api.post('/applications', {
                jobId: id,
                coverLetter,
                quizAnswers,
                resumeId: selectedResumeId
            });

            // Store ATS results for display
            setAtsResult({
                score: data.atsScore,
                feedback: data.atsFeedback,
                matchedSkills: data.matchedSkills || [],
                missingSkills: data.missingSkills || []
            });

            setMessage({ type: 'success', text: '🎉 Application submitted successfully!' });
            setCoverLetter('');
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Failed to submit application'
            });
        } finally {
            setApplying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    if (!job) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Job not found</h2>
                    <button onClick={() => navigate('/jobseeker/jobs')} className="btn-primary">
                        Back to Jobs
                    </button>
                </div>
            </div>
        );
    }

    const hasNoResumes = userResumes.length === 0;

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <button
                    onClick={() => navigate('/jobseeker/jobs')}
                    className="flex items-center text-primary-600 hover:text-primary-700 mb-6"
                >
                    <FaArrowLeft className="mr-2" /> Back to Jobs
                </button>

                {/* Job Info Card */}
                <div className="card mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">{job.title}</h1>

                    <div className="flex flex-wrap gap-4 text-gray-600 mb-6">
                        <span className="flex items-center gap-2"><FaBuilding /> {job.employer?.companyName || job.employer?.name}</span>
                        <span className="flex items-center gap-2"><FaMapMarkerAlt /> {job.location}</span>
                        <span className="flex items-center gap-2"><FaBriefcase /> {job.jobType}</span>
                        <span className="flex items-center gap-2"> ₹ {job.salaryRange.min.toLocaleString()} LPA - {job.salaryRange.max.toLocaleString()} LPA</span>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Job Description</h2>
                            <p className="text-gray-700 whitespace-pre-line">{job.description}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Qualifications</h2>
                            <p className="text-gray-700 whitespace-pre-line">{job.qualifications}</p>
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-3">Responsibilities</h2>
                            <p className="text-gray-700 whitespace-pre-line">{job.responsibilities}</p>
                        </div>
                    </div>
                </div>

                {/* ATS Results (shown after successful application) */}
                {atsResult && (
                    <div className="card mb-6 border-2 border-green-200 bg-green-50">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">📊 Your Application Analysis</h2>

                        {/* ATS Score */}
                        {atsResult.score !== null && (
                            <div className="mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">ATS Match Score</span>
                                    <span className={`text-lg font-bold ${atsResult.score >= 70 ? 'text-green-600' : atsResult.score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {atsResult.score}%
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-700 ${atsResult.score >= 70 ? 'bg-green-500' : atsResult.score >= 40 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${atsResult.score}%` }}
                                    />
                                </div>
                                {atsResult.feedback && (
                                    <p className="mt-2 text-sm text-gray-600 italic">{atsResult.feedback}</p>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Matched Skills */}
                            <div className="p-4 bg-white border border-green-200 rounded-xl">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-green-700 mb-3">
                                    <FaCheckCircle /> Matched Skills ({atsResult.matchedSkills.length})
                                </h3>
                                {atsResult.matchedSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {atsResult.matchedSkills.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                                ✓ {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">No matched skills detected.</p>
                                )}
                            </div>

                            {/* Missing Skills */}
                            <div className="p-4 bg-white border border-red-200 rounded-xl">
                                <h3 className="flex items-center gap-2 text-sm font-semibold text-red-700 mb-3">
                                    <FaTimesCircle /> Missing Skills ({atsResult.missingSkills.length})
                                </h3>
                                {atsResult.missingSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {atsResult.missingSkills.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                                                ✗ {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">Great! No missing skills detected.</p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/jobseeker/applications')}
                            className="mt-4 btn-primary"
                        >
                            View My Applications →
                        </button>
                    </div>
                )}

                {/* Apply Section — hide after successful apply */}
                {!atsResult && (
                    <div className="card">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Apply for this Position</h2>

                        {message.text && (
                            <div className={`mb-4 p-3 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        {/* No resumes warning */}
                        {hasNoResumes && (
                            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
                                <FaExclamationTriangle className="text-amber-500 mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Resume Required</p>
                                    <p className="text-sm text-amber-700 mt-1">
                                        You need to upload at least one resume before applying.{' '}
                                        <Link to="/jobseeker/profile" className="font-semibold underline hover:text-amber-900">
                                            Go to Profile →
                                        </Link>
                                    </p>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleApply}>
                            {/* Resume Selector */}
                            {!hasNoResumes && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Select Resume to Apply With <span className="text-red-500">*</span>
                                    </label>
                                    <div className="space-y-2">
                                        {userResumes.map((resume) => (
                                            <label
                                                key={resume._id}
                                                className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition ${
                                                    selectedResumeId === resume._id
                                                        ? 'border-primary-500 bg-primary-50'
                                                        : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="resumeId"
                                                    value={resume._id}
                                                    checked={selectedResumeId === resume._id}
                                                    onChange={() => setSelectedResumeId(resume._id)}
                                                    className="w-4 h-4 text-primary-600"
                                                />
                                                <FaFileAlt className="text-primary-400 flex-shrink-0" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">{resume.filename}</p>
                                                    <p className="text-xs text-gray-400">
                                                        Uploaded {new Date(resume.uploadedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <p className="mt-2 text-xs text-gray-500">
                                        Want to use a different resume?{' '}
                                        <Link to="/jobseeker/profile" className="text-primary-600 hover:underline">Upload on your profile →</Link>
                                    </p>
                                </div>
                            )}

                            {/* Cover Letter */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700">
                                        Cover Letter <span className="text-gray-400 font-normal">(Optional)</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={handleGenerateAI}
                                        disabled={generating}
                                        className="text-sm flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium disabled:opacity-50"
                                    >
                                        <FaMagic className={generating ? 'animate-pulse' : ''} />
                                        {generating ? 'Generating...' : '✨ Auto-generate'}
                                    </button>
                                </div>
                                <textarea
                                    id="coverLetter"
                                    rows="6"
                                    value={coverLetter}
                                    onChange={(e) => setCoverLetter(e.target.value)}
                                    className="input-field"
                                    placeholder="Tell the employer why you're a great fit for this role..."
                                />
                            </div>

                            {/* Quiz */}
                            {job.isQuizRequired && job.quiz && job.quiz.length > 0 && (
                                <div className="mb-6 p-6 bg-blue-50/50 border border-blue-100 rounded-xl">
                                    <h3 className="text-xl font-bold text-gray-900 mb-4">Skill Assessment Quiz</h3>
                                    <p className="text-sm text-gray-600 mb-6">This employer requires you to pass a short quiz.</p>
                                    <div className="space-y-6">
                                        {job.quiz.map((q, qIdx) => (
                                            <div key={qIdx}>
                                                <p className="font-semibold text-gray-800 mb-3">{qIdx + 1}. {q.question}</p>
                                                <div className="space-y-2 pl-4">
                                                    {q.options.map((opt, oIdx) => (
                                                        <label key={oIdx} className="flex items-center gap-3 cursor-pointer">
                                                            <input
                                                                type="radio"
                                                                name={`quiz-${qIdx}`}
                                                                checked={quizAnswers[qIdx] === oIdx}
                                                                onChange={() => {
                                                                    const newAnswers = [...quizAnswers];
                                                                    newAnswers[qIdx] = oIdx;
                                                                    setQuizAnswers(newAnswers);
                                                                }}
                                                                className="w-4 h-4 text-primary-600"
                                                            />
                                                            <span className="text-gray-700">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={applying || hasNoResumes}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {applying ? 'Submitting & Analysing...' : 'Submit Application'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default JobDetails;
