const { populateBreathProtocols } = require('./populateBreathProtocols');

async function run() {
  try {
    await populateBreathProtocols();
    console.log('Population completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during population:', error);
    process.exit(1);
  }
}

run(); 