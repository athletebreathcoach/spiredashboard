'use client';

import {
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  FireIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/solid';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LibraryProvider, useLibrary } from '@/context/LibraryContext';

const categories = [
  {
    name: 'Exercises',
    description: 'Physical and mental training exercises',
    icon: FireIcon,
    path: '/library/exercises',
  },
  {
    name: 'Guided Sessions',
    description: 'Expert-led coaching sessions',
    icon: UserGroupIcon,
    path: '/library/guided-sessions',
  },
  {
    name: 'Breath Protocols',
    description: 'Structured breathing techniques',
    icon: ClipboardDocumentCheckIcon,
    path: '/library/breath-protocols',
  },
  {
    name: 'Education',
    description: 'Learning resources and materials',
    icon: AcademicCapIcon,
    path: '/library/education',
  },
  {
    name: 'Habits/Tasks',
    description: 'Daily routines and assignments',
    icon: CheckCircleIcon,
    path: '/library/habits',
  },
  {
    name: 'Breathing Tests',
    description: 'Assessment and benchmarking',
    icon: ChartBarIcon,
    path: '/library/breathing-tests',
  }
];

function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { searchQuery, setSearchQuery } = useLibrary();

  return (
    <div className="h-full">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white uppercase tracking-wider mb-4">
          Resource Library
        </h1>
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search resources..."
            className="block w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-700 rounded-lg 
                     text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500 
                     transition-colors"
          />
        </div>
        <p className="text-lg text-gray-300">
          Access and manage your coaching resources
        </p>
      </div>

      <div className="flex gap-8">
        {/* Categories Sidebar */}
        <div className="w-72 shrink-0">
          <nav className="space-y-2">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = pathname === category.path;
              return (
                <Link
                  key={category.path}
                  href={category.path}
                  className={`flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-yellow-500'
                  }`}
                >
                  <Icon className="w-6 h-6 shrink-0" />
                  <div>
                    <div className="font-bold tracking-wide">{category.name}</div>
                    <div className="text-sm text-gray-400 truncate">
                      {category.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// Wrap the layout with LibraryProvider
export default function WrappedLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LibraryProvider>
      <LibraryLayout>{children}</LibraryLayout>
    </LibraryProvider>
  );
} 