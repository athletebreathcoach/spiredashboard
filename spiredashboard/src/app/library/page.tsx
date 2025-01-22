import {
  ClipboardDocumentCheckIcon,
  AcademicCapIcon,
  FireIcon,
  UserGroupIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/react/24/solid';

const categories = [
  {
    name: 'Exercises',
    description: 'Physical and mental training exercises',
    icon: FireIcon,
    path: '/library/exercises',
    count: 120
  },
  {
    name: 'Guided Sessions',
    description: 'Expert-led coaching sessions',
    icon: UserGroupIcon,
    path: '/library/guided-sessions',
    count: 45
  },
  {
    name: 'Breath Protocols',
    description: 'Structured breathing techniques',
    icon: ClipboardDocumentCheckIcon,
    path: '/library/breath-protocols',
    count: 28
  },
  {
    name: 'Education',
    description: 'Learning resources and materials',
    icon: AcademicCapIcon,
    path: '/library/education',
    count: 65
  },
  {
    name: 'Habits/Tasks',
    description: 'Daily routines and assignments',
    icon: CheckCircleIcon,
    path: '/library/habits',
    count: 82
  },
  {
    name: 'Breathing Tests',
    description: 'Assessment and benchmarking',
    icon: ChartBarIcon,
    path: '/library/breathing-tests',
    count: 15
  }
];

export default function Library() {
  return (
    <div className="h-full flex items-center justify-center text-center">
      <div>
        <h2 className="text-2xl font-bold text-white mb-4">
          Select a category to get started
        </h2>
        <p className="text-gray-400">
          Choose from our comprehensive collection of resources
        </p>
      </div>
    </div>
  );
} 