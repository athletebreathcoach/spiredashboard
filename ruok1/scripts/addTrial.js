import { addTrialGuidedSession } from './addTrialGuidedSession.js';

addTrialGuidedSession()
  .then(() => {
    console.log('Successfully added trial guided session');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to add trial guided session:', error);
    process.exit(1);
  }); 