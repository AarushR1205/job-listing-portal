import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { FaMagic } from 'react-icons/fa';

const PostJob = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        qualifications: '',
        responsibilities: '',
        jobType: 'Full-time',
        location: '',
        minSalary: '',
        maxSalary: '',
        deadline: '',
        isQuizRequired: false,
        quiz: []
    });
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
    };

    const addQuizQuestion = () => {
        setFormData({
            ...formData,
            quiz: [...formData.quiz, { question: '', options: ['', '', '', ''], correctAnswerIndex: 0 }]
        });
    };

    const removeQuizQuestion = (index) => {
        const newQuiz = formData.quiz.filter((_, i) => i !== index);
        setFormData({ ...formData, quiz: newQuiz, isQuizRequired: newQuiz.length > 0 });
    };

    const handleQuizChange = (qIndex, field, value) => {
        const newQuiz = [...formData.quiz];
        newQuiz[qIndex][field] = value;
        setFormData({ ...formData, quiz: newQuiz });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const newQuiz = [...formData.quiz];
        newQuiz[qIndex].options[oIndex] = value;
        setFormData({ ...formData, quiz: newQuiz });
    };

    const handleGenerateAI = async () => {
        if (!formData.title) {
            setError('Please enter a Job Title first to generate a description.');
            return;
        }

        setGenerating(true);
        setError('');

        try {
            const { data } = await api.post('/ai/generate-job-desc', {
                title: formData.title,
                jobType: formData.jobType
            });

            setFormData(prev => ({
                ...prev,
                description: data.description || prev.description,
                qualifications: Array.isArray(data.qualifications) 
                    ? data.qualifications.map(q => `• ${q}`).join('\n')
                    : data.qualifications || prev.qualifications,
                responsibilities: Array.isArray(data.responsibilities)
                    ? data.responsibilities.map(r => `• ${r}`).join('\n')
                    : data.responsibilities || prev.responsibilities,
            }));
        } catch (err) {
            console.error('Generation err:', err);
            setError(err.response?.data?.message || 'Failed to generate content with AI');
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const jobData = {
                ...formData,
                salaryRange: {
                    min: Number(formData.minSalary),
                    max: Number(formData.maxSalary)
                }
            };
            delete jobData.minSalary;
            delete jobData.maxSalary;

            await api.post('/jobs', jobData);
            navigate('/employer/manage-jobs');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to post job');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-8">Post a New Job</h1>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col md:flex-row md:items-end gap-4">
                            <div className="flex-1">
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                                    Job Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. Senior Software Engineer"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={handleGenerateAI}
                                disabled={generating || !formData.title}
                                className="btn-secondary h-[42px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                title="Auto-fill description, qualifications, and responsibilities using AI"
                            >
                                <FaMagic className={generating ? 'animate-pulse text-purple-600' : 'text-purple-600'} />
                                {generating ? 'Generating...' : '✨ Auto-generate'}
                            </button>
                        </div>

                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Job Description *
                            </label>
                            <textarea
                                id="description"
                                name="description"
                                rows="5"
                                required
                                value={formData.description}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Describe the job role and what the candidate will be doing..."
                            />
                        </div>

                        <div>
                            <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700 mb-2">
                                Qualifications *
                            </label>
                            <textarea
                                id="qualifications"
                                name="qualifications"
                                rows="4"
                                required
                                value={formData.qualifications}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="List required qualifications, education, and experience..."
                            />
                        </div>

                        <div>
                            <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700 mb-2">
                                Responsibilities *
                            </label>
                            <textarea
                                id="responsibilities"
                                name="responsibilities"
                                rows="4"
                                required
                                value={formData.responsibilities}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="List key responsibilities and duties..."
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="jobType" className="block text-sm font-medium text-gray-700 mb-2">
                                    Job Type *
                                </label>
                                <select
                                    id="jobType"
                                    name="jobType"
                                    required
                                    value={formData.jobType}
                                    onChange={handleChange}
                                    className="input-field"
                                >
                                    <option value="Full-time">Full-time</option>
                                    <option value="Part-time">Part-time</option>
                                    <option value="Internship">Internship</option>
                                    <option value="Remote">Remote</option>
                                    <option value="hybrid">Hybrid</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                                    Location *
                                </label>
                                <input
                                    id="location"
                                    name="location"
                                    type="text"
                                    required
                                    value={formData.location}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="e.g. New York, NY"
                                />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="minSalary" className="block text-sm font-medium text-gray-700 mb-2">
                                    Minimum Salary (₹) *
                                </label>
                                <input
                                    id="minSalary"
                                    name="minSalary"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.minSalary}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="50000"
                                />
                            </div>

                            <div>
                                <label htmlFor="maxSalary" className="block text-sm font-medium text-gray-700 mb-2">
                                    Maximum Salary (₹) *
                                </label>
                                <input
                                    id="maxSalary"
                                    name="maxSalary"
                                    type="number"
                                    required
                                    min="0"
                                    value={formData.maxSalary}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="100000"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                                Application Deadline *
                            </label>
                            <input
                                id="deadline"
                                name="deadline"
                                type="date"
                                required
                                min={new Date().toISOString().split('T')[0]}
                                value={formData.deadline}
                                onChange={handleChange}
                                className="input-field"
                            />
                        </div>

                        {/* Quiz Section */}
                        <div className="border-t pt-6 mt-6">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Skill Assessment (Optional)</h2>
                                    <p className="text-sm text-gray-500">Add a multiple-choice quiz applicants must pass.</p>
                                </div>
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isQuizRequired"
                                        checked={formData.isQuizRequired}
                                        onChange={(e) => {
                                            handleChange(e);
                                            if (e.target.checked && formData.quiz.length === 0) {
                                                addQuizQuestion();
                                            }
                                        }}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600 relative"></div>
                                </label>
                            </div>

                            {formData.isQuizRequired && (
                                <div className="space-y-6">
                                    {formData.quiz.map((q, qIndex) => (
                                        <div key={qIndex} className="p-4 bg-gray-50 border border-gray-200 rounded-lg relative">
                                            <button
                                                type="button"
                                                onClick={() => removeQuizQuestion(qIndex)}
                                                className="absolute top-2 right-2 text-red-500 hover:text-red-700 font-bold"
                                            >
                                                &times;
                                            </button>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Question {qIndex + 1}</label>
                                            <input
                                                type="text"
                                                required
                                                value={q.question}
                                                onChange={(e) => handleQuizChange(qIndex, 'question', e.target.value)}
                                                className="input-field mb-4"
                                                placeholder="Enter question"
                                            />
                                            <div className="grid md:grid-cols-2 gap-4">
                                                {q.options.map((opt, oIndex) => (
                                                    <div key={oIndex} className="flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name={`correctAnswer-${qIndex}`}
                                                            checked={q.correctAnswerIndex === oIndex}
                                                            onChange={() => handleQuizChange(qIndex, 'correctAnswerIndex', oIndex)}
                                                            className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                                                            title="Mark as correct answer"
                                                        />
                                                        <input
                                                            type="text"
                                                            required
                                                            value={opt}
                                                            onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                                            className="input-field"
                                                            placeholder={`Option ${oIndex + 1}`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        type="button"
                                        onClick={addQuizQuestion}
                                        className="text-sm font-medium text-primary-600 hover:text-primary-700"
                                    >
                                        + Add Another Question
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 border-t pt-6 mt-6">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Posting...' : 'Post Job'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/employer/dashboard')}
                                className="btn-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PostJob;
