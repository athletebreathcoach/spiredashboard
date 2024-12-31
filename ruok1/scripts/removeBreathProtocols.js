const { db } = require('./firebaseAdmin');
const { collection, query, where, getDocs, deleteDoc } = require('firebase/firestore');

async function removeBreathProtocols() {
  try {
    const protocolsToRemove = ['Wim Hof', 'Alternate Nasal Breathing'];
    const breathProtocolsRef = collection(db, 'breathProtocols');
    const q = query(breathProtocolsRef, where('title', 'in', protocolsToRemove));
    
    const querySnapshot = await getDocs(q);
    const deletedProtocols = [];
    
    for (const doc of querySnapshot.docs) {
      await deleteDoc(doc.ref);
      deletedProtocols.push(doc.data().title);
      console.log(`Deleted protocol: ${doc.data().title}`);
    }
    
    if (deletedProtocols.length === 0) {
      console.log('No matching protocols found to delete');
    } else {
      console.log('Successfully deleted protocols:', deletedProtocols);
    }
  } catch (error) {
    console.error('Error removing breath protocols:', error);
  }
}

module.exports = { removeBreathProtocols }; 