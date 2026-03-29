import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/api';
import { FaMagic, FaArrowLeft } from 'react-icons/fa';

const EditJob = () => {
    const { id } = useParams();
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
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        const fetchJob = async () => {
            try {
                const { data } = await api.get(`/jobs/${id}`);
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    qualifications: data.qualifications || '',
                    responsibilities: data.responsibilities || '',
                    jobType: data.jobType || 'Full-time',
                    location: data.location || '',
                    minSalary: data.salaryRange?.min ?? '',
                    maxSalary: data.salaryRange?.max ?? '',
                    deadline: data.deadline ? new Date(data.deadline).toISOString().split('T')[0] : '',
                });
            } catch (err) {
                setError('Failed to load job details.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchJob();
    }, [id]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
                jobType: formData.jobType,
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
            setError(err.response?.data?.message || 'Failed to generate content with AI');
        } finally {
            setGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const jobData = {
                title: formData.title,
                description: formData.description,
                qualifications: formData.qualifications,
                responsibilities: formData.responsibilities,
                jobType: formData.jobType,
                location: formData.location,
                salaryRange: {
                    min: Number(formData.minSalary),
                    max: Number(formData.maxSalary),
                },
                deadline: formData.deadline,
            };

            await api.put(`/jobs/${id}`, jobData);
            setSuccess('Job updated successfully!');
            setTimeout(() => navigate('/employer/manage-jobs'), 1200);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update job');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => navigate('/employer/manage-jobs')}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                    >
                        <FaArrowLeft size={18} />
                    </button>
                    <h1 className="text-3xl font-bold text-gray-900">Edit Job Posting</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
                        {success}
                    </div>
                )}

                <div className="card">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Title + AI Generate */}
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
                                title="Re-generate description using AI"
                            >
                                <FaMagic className={generating ? 'animate-pulse text-purple-600' : 'text-purple-600'} />
                                {generating ? 'Generating...' : '✨ Re-generate'}
                            </button>
                        </div>

                        {/* Description */}
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
                                placeholder="Describe the job role..."
                            />
                        </div>

                        {/* Qualifications */}
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
                                placeholder="List required qualifications..."
                            />
                        </div>

                        {/* Responsibilities */}
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
                                placeholder="List key responsibilities..."
                            />
                        </div>

                        {/* Job Type + Location */}
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
                                    placeholder="e.g. Mumbai, India"
                                />
                            </div>
                        </div>

                        {/* Salary */}
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

                        {/* Actions */}
                        <div className="flex gap-4 pt-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/employer/manage-jobs')}
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

export default EditJob;
