const cron = require('node-cron');
const { runFullSystemRecovery } = require('../services/recoveryService');

const initCronJobs = () => {
  // Run full system self-healing recovery every 2 minutes
  cron.schedule('*/2 * * * *', async () => {
    try {
      await runFullSystemRecovery();
    } catch (error) {
      console.error('Error running system recovery cron job:', error);
    }
  });

  console.log('⏱️ Background Cron Jobs initialized (Full System Self-Healing & Recovery)');
};

module.exports = { initCronJobs };

