import { createCoach, getCoachByEmail } from '../firebase/coaches';
import { auth, db } from '../config/firebase';
import { getDoc, doc } from 'firebase/firestore';

const createCoachFromEmail = async (email) => {
  try {
    // First find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.error('User not found with email:', email);
      return;
    }

    const userId = querySnapshot.docs[0].id;
    
    // Create coach document
    await createCoach(userId, email);
    console.log('Successfully created coach for:', email);
  } catch (error) {
    console.error('Error creating coach:', error);
  }
};

// Get email from command line argument
const email = process.argv[2];
if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

createCoachFromEmail(email); 