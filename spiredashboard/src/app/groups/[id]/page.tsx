import { Suspense } from 'react';
import GroupDetailClient from './GroupDetailClient';

type Props = {
  params: { id: string };
  searchParams?: { [key: string]: string | string[] | undefined };
};

export default function GroupPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="text-white">Loading...</div>}>
      <GroupDetailClient id={params.id} />
    </Suspense>
  );
} 
