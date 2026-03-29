import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBriefcase, FaGoogle } from 'react-icons/fa';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'jobseeker',
        phone: '',
        companyName: '',
        skills: '',
        experience: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, registerWithGoogle } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userData = {
                name: formData.name,
                email: formData.email,
                password: formData.password,
                role: formData.role
            };

            if (formData.role === 'jobseeker') {
                userData.phone = formData.phone;
                userData.skills = formData.skills.split(',').map(s => s.trim());
                userData.experience = formData.experience;
            } else {
                userData.companyName = formData.companyName;
            }

            const data = await register(userData);

            // Redirect based on role
            if (data.role === 'employer') {
                navigate('/employer/dashboard');
            } else {
                navigate('/jobseeker/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignUp = async () => {
        try {
            setError('');
            if (!formData.name) {
                setError('Please provide your Full Name to continue with Google.');
                return;
            }
            if (formData.role === 'jobseeker' && !formData.phone) {
                setError('Please provide your Phone Number to continue with Google.');
                return;
            }
            if (formData.role === 'employer' && !formData.companyName) {
                setError('Please provide your Company Name to continue with Google.');
                return;
            }

            setLoading(true);

            const userData = {
                name: formData.name,
                role: formData.role
            };

            if (formData.role === 'jobseeker') {
                userData.phone = formData.phone;
                userData.skills = formData.skills ? formData.skills.split(',').map(s => s.trim()) : [];
                userData.experience = formData.experience;
            } else {
                userData.companyName = formData.companyName;
            }

            const data = await registerWithGoogle(userData);
            
            if (data.role === 'employer') {
                navigate('/employer/dashboard');
            } else {
                navigate('/jobseeker/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Google Registration failed');
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {/* Logo */}
                    <div className="flex justify-center mb-6">
                        <div className="flex items-center space-x-2">
                            <FaBriefcase className="text-primary-600 text-4xl" />
                            <span className="text-3xl font-bold text-gray-900">
                                Career<span className="text-primary-600">Bridge</span>
                            </span>
                        </div>
                    </div>

                    <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">
                        Create your account
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                required
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength="6"
                                value={formData.password}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                                I am a
                            </label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option value="jobseeker">Job Seeker</option>
                                <option value="employer">Employer</option>
                            </select>
                        </div>

                        {/* Conditional fields based on role */}
                        {formData.role === 'jobseeker' ? (
                            <>
                                <div>
                                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                        Phone Number
                                    </label>
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        required
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="+1234567890"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="skills" className="block text-sm font-medium text-gray-700 mb-2">
                                        Skills (comma separated)
                                    </label>
                                    <input
                                        id="skills"
                                        name="skills"
                                        type="text"
                                        value={formData.skills}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="React, Node.js, MongoDB"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                                        Experience
                                    </label>
                                    <textarea
                                        id="experience"
                                        name="experience"
                                        rows="3"
                                        value={formData.experience}
                                        onChange={handleChange}
                                        className="input-field"
                                        placeholder="Brief description of your experience"
                                    />
                                </div>
                            </>
                        ) : (
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Company Name
                                </label>
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="input-field"
                                    placeholder="Your Company Ltd."
                                />
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating account...' : 'Sign up'}
                        </button>
                    </form>

                    <div className="mt-6 flex items-center justify-center space-x-2">
                        <span className="h-px bg-gray-300 flex-1"></span>
                        <span className="text-gray-500 text-sm">or</span>
                        <span className="h-px bg-gray-300 flex-1"></span>
                    </div>

                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                        className="mt-6 w-full flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 transition duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FaGoogle className="text-red-500" />
                        <span>Sign up with Google (Fill form first)</span>
                    </button>


                    <p className="mt-8 text-center text-sm text-gray-600">
                        Already have an account?{' '}
                        <Link to="/login" className="font-medium text-primary-600 hover:text-primary-500">
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Register;
