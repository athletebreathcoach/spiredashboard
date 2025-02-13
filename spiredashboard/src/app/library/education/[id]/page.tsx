'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeftIcon, TrashIcon, Pencil1Icon } from '@radix-ui/react-icons';
import { getEducationDocumentById, deleteEducationDocument, updateEducationDocument } from '@/services/education';
import { EducationDocument } from '@/types/education';
import { formatDistanceToNow } from 'date-fns';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Import MDEditor without SSR
const MDEditor = dynamic(
  () => import('@uiw/react-md-editor'),
  { ssr: false }
);

interface PageProps {
  params: Promise<{ id: string }>;
}

function EducationContent({ id }: { id: string }) {
  const router = useRouter();
  const [document, setDocument] = useState<EducationDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (id) {
      loadDocument();
    }
  }, [id]);

  useEffect(() => {
    if (document) {
      setEditedTitle(document.title);
      setEditedDescription(document.description || '');
      setEditedContent(document.content);
    }
  }, [document]);

  const loadDocument = async () => {
    try {
      const doc = await getEducationDocumentById(id);
      setDocument(doc);
    } catch (error) {
      console.error('Error loading document:', error);
      toast.error('Failed to load document');
      router.push('/library/education');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await deleteEducationDocument(id);
      toast.success('Document deleted successfully');
      router.push('/library/education');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!editedTitle.trim() || !editedContent.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      // Extract URLs and create link previews
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const urls = editedContent.match(urlRegex) || [];
      const linkPreviews = urls.map(url => {
        if (url.includes('youtube.com') || url.includes('youtu.be')) {
          const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
          return {
            url,
            type: 'youtube' as const,
            videoId
          };
        } else if (
          url.match(/\.(jpeg|jpg|gif|png)$/) || 
          url.includes('images.unsplash.com') ||
          url.includes('i.imgur.com')
        ) {
          return {
            url,
            type: 'image' as const
          };
        }
        return {
          url,
          type: 'link' as const
        };
      });

      await updateEducationDocument(id, {
        title: editedTitle.trim(),
        description: editedDescription.trim() || undefined,
        content: editedContent.trim(),
        linkPreviews
      });

      await loadDocument(); // Reload the document
      setIsEditing(false);
      toast.success('Document updated successfully');
    } catch (error) {
      console.error('Error updating document:', error);
      toast.error('Failed to update document');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!document) {
    return null;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeftIcon className="mr-2 h-4 w-4" />
            Back
          </Button>
          {isEditing ? (
            <div className="space-y-4">
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-b border-gray-300 focus:outline-none focus:border-primary"
                placeholder="Enter title"
              />
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                className="w-full text-muted-foreground bg-transparent border rounded-md p-2 focus:outline-none focus:border-primary"
                placeholder="Enter description (optional)"
                rows={2}
              />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold">{document.title}</h1>
              {document.description && (
                <p className="text-muted-foreground mt-2">
                  {document.description}
                </p>
              )}
            </>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
            <span>{document.folderName || 'No Folder'}</span>
            <span>•</span>
            <span>
              Updated {formatDistanceToNow(document.updatedAt.toDate(), { addSuffix: true })}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
              >
                Save Changes
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditing(true)}
              >
                <Pencil1Icon className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        {isEditing ? (
          <div data-color-mode="light">
            <MDEditor
              value={editedContent}
              onChange={(value) => setEditedContent(value || '')}
              preview="edit"
              height={400}
            />
          </div>
        ) : (
          <>
            <div className="prose prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {document.content}
              </ReactMarkdown>
            </div>

            {document.linkPreviews && document.linkPreviews.length > 0 && (
              <div className="mt-8 space-y-4">
                <h2 className="text-lg font-semibold">Embedded Content</h2>
                {document.linkPreviews.map((preview, index) => {
                  if (preview.type === 'youtube' && preview.videoId) {
                    return (
                      <div key={index} className="aspect-video">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${preview.videoId}`}
                          title="YouTube video player"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    );
                  } else if (preview.type === 'image') {
                    return (
                      <div key={index} className="max-h-96 overflow-hidden rounded-lg">
                        <img
                          src={preview.url}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}

export default function EducationDetailPage({ params }: PageProps) {
  const resolvedParams = use(params);
  return <EducationContent id={resolvedParams.id} />;
} 