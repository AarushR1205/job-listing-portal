import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { FaBriefcase, FaUsers, FaClock, FaPlus } from 'react-icons/fa';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#2563eb', '#16a34a', '#dc2626', '#f59e0b', '#8b5cf6'];

const EmployerDashboard = () => {
    const [stats, setStats] = useState({
        totalJobs: 0,
        activeJobs: 0,
        totalApplications: 0
    });
    const [statusData, setStatusData] = useState([]);
    const [timelineData, setTimelineData] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/jobs/employer/analytics');
            setRecentJobs(data.recentJobs);
            setStatusData(data.statusData);
            setTimelineData(data.timelineData);
            setStats(data.stats);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
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
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Employer Dashboard</h1>
                    <Link to="/employer/post-job" className="btn-primary">
                        <FaPlus className="inline mr-2" />
                        Post New Job
                    </Link>
                </div>

                {/* Stats */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Total Jobs</h3>
                                <p className="text-3xl font-bold text-primary-600 mt-2">{stats.totalJobs}</p>
                            </div>
                            <FaBriefcase className="text-primary-600 text-4xl opacity-20" />
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Active Jobs</h3>
                                <p className="text-3xl font-bold text-green-600 mt-2">{stats.activeJobs}</p>
                            </div>
                            <FaClock className="text-green-600 text-4xl opacity-20" />
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-gray-500 text-sm font-medium">Total Applications</h3>
                                <p className="text-3xl font-bold text-secondary-600 mt-2">{stats.totalApplications}</p>
                            </div>
                            <FaUsers className="text-secondary-600 text-4xl opacity-20" />
                        </div>
                    </div>
                </div>

                {/* Analytics Charts */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                    <div className="card">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Applications Trend (Last 30 Days)</h3>
                        <div className="h-[300px]">
                            {timelineData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={timelineData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                        <XAxis dataKey="date" stroke="#6b7280" />
                                        <YAxis stroke="#6b7280" />
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Line type="monotone" dataKey="applications" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                            )}
                        </div>
                    </div>
                    <div className="card">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Applications by Status</h3>
                        <div className="h-[300px]">
                            {statusData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={statusData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {statusData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip 
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Recent Jobs */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900">Your Job Postings</h2>
                        <Link to="/employer/manage-jobs" className="text-primary-600 hover:text-primary-700 font-medium">
                            View All →
                        </Link>
                    </div>

                    {recentJobs.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 mb-4">You haven't posted any jobs yet</p>
                            <Link to="/employer/post-job" className="btn-primary">
                                Post Your First Job
                            </Link>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {recentJobs.map((job) => (
                                <div key={job._id} className="card hover:shadow-lg transition-shadow">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <h3 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h3>
                                            <div className="flex gap-4 text-sm text-gray-600 mb-3">
                                                <span>{job.location}</span>
                                                <span>{job.jobType}</span>
                                                <span className="flex items-center gap-1">
                                                    <FaUsers /> {job.applicationsCount} applicants
                                                </span>
                                            </div>
                                            <p className="text-gray-600 line-clamp-2">{job.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`badge ${job.status === 'active' ? 'badge-accepted' : 'badge-pending'}`}>
                                                {job.status}
                                            </span>
                                            <Link
                                                to={`/employer/applicants/${job._id}`}
                                                className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                                            >
                                                View Applicants →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployerDashboard;
