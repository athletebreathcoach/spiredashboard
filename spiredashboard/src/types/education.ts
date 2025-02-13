import { Timestamp } from 'firebase/firestore';

export interface LinkPreview {
  url: string;
  type: 'youtube' | 'image' | 'link';
  videoId?: string;
}

export interface EducationDocument {
  id: string;
  type: 'education';
  title: string;
  exerciseTitle: string;
  description?: string;
  content: string;
  folderId?: string;
  folderName?: string;
  linkPreviews?: LinkPreview[];
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type CreateEducationDocument = Omit<EducationDocument, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'exerciseTitle'>; 