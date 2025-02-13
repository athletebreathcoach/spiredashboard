import { collection, getDocs, doc, getDoc, addDoc, query, where, orderBy, serverTimestamp, updateDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import { EducationDocument, CreateEducationDocument } from '../types/education';

// Get all education documents
export const getEducationDocuments = async (): Promise<EducationDocument[]> => {
  try {
    const docsRef = collection(db, 'education', 'content', 'documents');
    const q = query(docsRef, orderBy('title'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as EducationDocument[];
  } catch (error) {
    console.error('Error getting education documents:', error);
    throw error;
  }
};

// Get a single education document by ID
export const getEducationDocumentById = async (documentId: string): Promise<EducationDocument> => {
  try {
    const docRef = doc(db, 'education', 'content', 'documents', documentId);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error('Education document not found');
    }

    return {
      id: snapshot.id,
      ...snapshot.data()
    } as EducationDocument;
  } catch (error) {
    console.error('Error getting education document:', error);
    throw error;
  }
};

// Create a new education document
export const createEducationDocument = async (document: CreateEducationDocument): Promise<string> => {
  try {
    // Get the highest order number
    const docsQuery = query(
      collection(db, 'education', 'content', 'documents'),
      orderBy('order', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(docsQuery);
    const highestOrder = snapshot.empty ? 0 : snapshot.docs[0].data().order || 0;

    const documentData = {
      ...document,
      type: 'education' as const,
      exerciseTitle: document.title,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      order: highestOrder + 1,
    };

    const docRef = await addDoc(collection(db, 'education', 'content', 'documents'), documentData);
    return docRef.id;
  } catch (error) {
    console.error('Error creating education document:', error);
    throw error;
  }
};

// Update an education document
export const updateEducationDocument = async (documentId: string, updates: Partial<EducationDocument>): Promise<void> => {
  try {
    const docRef = doc(db, 'education', 'content', 'documents', documentId);
    await updateDoc(docRef, {
      ...updates,
      exerciseTitle: updates.title,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating education document:', error);
    throw error;
  }
};

// Delete an education document
export const deleteEducationDocument = async (documentId: string): Promise<void> => {
  try {
    const docRef = doc(db, 'education', 'content', 'documents', documentId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting education document:', error);
    throw error;
  }
}; 