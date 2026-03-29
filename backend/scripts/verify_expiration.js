import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Job from '../models/Job.js';
import connectDB from '../config/db.js';

dotenv.config();

const verifyExpiration = async () => {
    try {
        await connectDB();
        console.log('Connected to DB');

        // Create a job that expired 1 hour ago
        const expiredDate = new Date();
        expiredDate.setHours(expiredDate.getHours() - 1);

        const testJob = await Job.create({
            title: 'Test Expired Job',
            description: 'This job should be deactivated',
            qualifications: 'None',
            responsibilities: 'None',
            jobType: 'Full-time',
            location: 'Remote',
            salaryRange: { min: 40000, max: 50000 },
            employer: '657476bec800000000000000', // Mock ObjectId
            deadline: expiredDate,
            status: 'active'
        });

        console.log(`Created test job: ${testJob._id} with deadline ${testJob.deadline}`);

        // Manually trigger the logic that would be in the cron
        console.log('Triggering expiration logic...');
        const result = await Job.updateMany(
            {
                status: 'active',
                deadline: { $lt: new Date() }
            },
            { status: 'inactive' }
        );

        console.log(`Updated ${result.modifiedCount} jobs.`);

        const updatedJob = await Job.findById(testJob._id);
        if (updatedJob.status === 'inactive') {
            console.log('✅ SUCCESS: Job was deactivated.');
        } else {
            console.log('❌ FAILURE: Job is still active.');
        }

        // Cleanup
        await Job.deleteOne({ _id: testJob._id });
        console.log('Cleaned up test job.');

        process.exit(0);
    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    }
};

verifyExpiration();
