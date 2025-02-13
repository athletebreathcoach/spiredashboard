'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusIcon } from '@radix-ui/react-icons';
import { getEducationDocuments } from '@/services/education';
import { EducationDocument } from '@/types/education';
import { formatDistanceToNow } from 'date-fns';

export default function EducationPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<EducationDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const docs = await getEducationDocuments();
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading education documents:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Education Library</h1>
          <p className="text-muted-foreground">
            Create and manage educational content for your clients
          </p>
        </div>
        <Button onClick={() => router.push('/library/education/new')}>
          <PlusIcon className="mr-2 h-4 w-4" />
          New Document
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No education documents found</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => router.push('/library/education/new')}
          >
            Create your first document
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => router.push(`/library/education/${doc.id}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">{doc.title}</CardTitle>
                {doc.description && (
                  <CardDescription className="line-clamp-2">
                    {doc.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-muted-foreground">
                  <span>
                    {doc.folderName || 'No Folder'}
                  </span>
                  <span>
                    Updated {formatDistanceToNow(doc.updatedAt.toDate(), { addSuffix: true })}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 