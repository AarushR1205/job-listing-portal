import cron from 'node-cron';
import Job from '../models/Job.js';

export const initJobScheduler = () => {
    // Run every minute for testing/live feedback
    // In production, '0 * * * *' (hourly) might be better
    cron.schedule('* * * * *', async () => {
        console.log('--- Running job expiration check ---');
        try {
            const now = new Date();
            const result = await Job.updateMany(
                {
                    status: 'active',
                    deadline: { $lt: now }
                },
                { status: 'inactive' }
            );

            if (result.modifiedCount > 0) {
                console.log(`✅ Deactivated ${result.modifiedCount} expired jobs.`);
            } else {
                console.log('ℹ️ No expired jobs found.');
            }
        } catch (error) {
            console.error('❌ Error in job scheduler:', error);
        }
    });
};
