import { initializeScheduledSessions } from './initializeScheduledSessions.js';

const initialize = async () => {
  try {
    console.log('Starting initialization...');
    
    // Initialize scheduledSessions collection
    await initializeScheduledSessions();
    
    console.log('Initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Initialization failed:', error);
    process.exit(1);
  }
};

initialize(); 