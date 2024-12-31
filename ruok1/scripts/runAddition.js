import { addBreathProtocols } from './addBreathProtocols.js';

async function run() {
  try {
    await addBreathProtocols();
    console.log('Addition completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during addition:', error);
    process.exit(1);
  }
}

run(); 