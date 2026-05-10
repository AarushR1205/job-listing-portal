import { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import { FaUpload, FaFileAlt, FaTrash, FaSpinner } from 'react-icons/fa';

const Profile = () => {
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        skills: [],
        experience: '',
        resumes: []
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [skillInput, setSkillInput] = useState('');
    const fileInputRef = useRef(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/auth/profile');
            setProfile(data);
            setSkillInput(data.skills?.join(', ') || '');
        } catch (error) {
            console.error('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setProfile({ ...profile, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const updatedProfile = {
                ...profile,
                skills: skillInput.split(',').map(s => s.trim()).filter(s => s)
            };

            await api.put('/auth/profile', updatedProfile);
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (error) {
            setMessage({ type: 'error', text: 'Failed to update profile' });
        } finally {
            setSaving(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        const formData = new FormData();
        formData.append('resume', file);

        try {
            const { data } = await api.post('/auth/upload-resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProfile(prev => ({
                ...prev,
                resumes: [...(prev.resumes || []), data.resume]
            }));
            setMessage({ type: 'success', text: `"${file.name}" uploaded successfully!` });
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload resume' });
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteResume = async (resumeId) => {
        if (!window.confirm('Are you sure you want to delete this resume?')) return;
        setDeletingId(resumeId);
        setMessage({ type: '', text: '' });

        try {
            await api.delete(`/auth/resume/${resumeId}`);
            setProfile(prev => ({
                ...prev,
                resumes: prev.resumes.filter(r => r._id !== resumeId)
            }));
            setMessage({ type: 'success', text: 'Resume deleted.' });
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to delete resume' });
        } finally {
            setDeletingId(null);
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
                <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

                {message.text && (
                    <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {message.text}
                    </div>
                )}

                <div className="card mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h2>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                            <input id="name" name="name" type="text" value={profile.name} onChange={handleChange} className="input-field" />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input id="email" name="email" type="email" value={profile.email} onChange={handleChange} className="input-field" />
                        </div>

                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                            <input id="phone" name="phone" type="tel" value={profile.phone} onChange={handleChange} className="input-field" />
                        </div>

                        <div>
                            <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">Skills (comma separated)</label>
                            <input
                                id="skills"
                                type="text"
                                value={skillInput}
                                onChange={(e) => setSkillInput(e.target.value)}
                                className="input-field"
                                placeholder="React, Node.js, MongoDB"
                            />
                        </div>

                        <div>
                            <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">Experience</label>
                            <textarea
                                id="experience"
                                name="experience"
                                rows="5"
                                value={profile.experience}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="Describe your work experience..."
                            />
                        </div>

                        <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed">
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </form>
                </div>

                {/* Resume Management */}
                <div className="card">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">My Resumes</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Upload multiple resumes and select the best one when applying to a job.
                    </p>

                    {/* Resume List */}
                    {profile.resumes && profile.resumes.length > 0 ? (
                        <div className="space-y-3 mb-6">
                            {profile.resumes.map((resume) => (
                                <div
                                    key={resume._id}
                                    className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <FaFileAlt className="text-primary-500 flex-shrink-0 text-lg" />
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">{resume.filename}</p>
                                            <p className="text-xs text-gray-400">
                                                {new Date(resume.uploadedAt).toLocaleDateString('en-US', {
                                                    year: 'numeric', month: 'short', day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteResume(resume._id)}
                                        disabled={deletingId === resume._id}
                                        className="ml-4 flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                                        title="Delete resume"
                                    >
                                        {deletingId === resume._id
                                            ? <FaSpinner className="animate-spin" />
                                            : <FaTrash />
                                        }
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">
                            ⚠️ No resumes uploaded yet. You need at least one resume to apply for jobs.
                        </div>
                    )}

                    {/* Upload new resume */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Upload New Resume <span className="text-gray-400 font-normal">(PDF, DOC, DOCX — max 5MB)</span>
                        </label>
                        <label className={`inline-flex items-center gap-2 btn-outline cursor-pointer ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                            {uploading ? <FaSpinner className="animate-spin" /> : <FaUpload />}
                            {uploading ? 'Uploading...' : 'Choose File'}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx"
                                onChange={handleResumeUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                        </label>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
