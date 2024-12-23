const { populateHabitsTasks } = require('./populateHabitsTasks');

const runPopulation = async () => {
  try {
    console.log('Starting population of habits and tasks...');
    await populateHabitsTasks();
    console.log('Population completed successfully!');
  } catch (error) {
    console.error('Error during population:', error);
    process.exit(1);
  }
};

runPopulation(); 