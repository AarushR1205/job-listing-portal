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
    const [googleToken, setGoogleToken] = useState(null);

    const { register, startGoogleSignUp, completeGoogleRegister } = useAuth();
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

            // If using Google Auth, call the complete method
            let data;
            if (googleToken) {
                // Ensure password isn't sent if using google
                delete userData.password;
                data = await completeGoogleRegister(userData, googleToken);
            } else {
                data = await register(userData);
            }

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

    const handleGoogleInit = async () => {
        try {
            setError('');
            setLoading(true);

            const result = await startGoogleSignUp();
            
            // Auto-fill forms and store token
            setFormData(prev => ({
                ...prev,
                name: result.name,
                email: result.email
            }));
            setGoogleToken(result.token);
            
            // Optional UX enhancement: clear error if it was "Please fill Name"
            setError('');
            
        } catch (err) {
            if (err.code !== 'auth/popup-closed-by-user') {
                 setError(err.response?.data?.message || err.message || 'Google Auth failed');
            }
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

                    {!googleToken && (
                        <>
                            <button
                                type="button"
                                onClick={handleGoogleInit}
                                disabled={loading}
                                className="w-full mb-6 flex items-center justify-center space-x-2 bg-white text-gray-700 border border-gray-300 py-3 rounded-xl font-medium hover:bg-gray-50 transition duration-300 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <FaGoogle className="text-red-500" />
                                <span>Continue with Google</span>
                            </button>

                            <div className="mb-6 flex items-center justify-center space-x-2">
                                <span className="h-px bg-gray-300 flex-1"></span>
                                <span className="text-gray-500 text-sm">or sign up with email</span>
                                <span className="h-px bg-gray-300 flex-1"></span>
                            </div>
                        </>
                    )}
                    
                    {googleToken && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm text-center">
                            Google account linked! Please complete the remaining mandatory fields below.
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
                                readOnly={!!googleToken}
                                value={formData.email}
                                onChange={handleChange}
                                className={`input-field ${googleToken ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                placeholder="you@example.com"
                            />
                        </div>

                        {!googleToken && (
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
                        )}

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
                            {loading ? 'Creating account...' : 'Complete Registration'}
                        </button>
                    </form>


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
