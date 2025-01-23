'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  UserGroupIcon,
  UsersIcon,
  BookOpenIcon,
  TrophyIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BoltIcon,
  CalendarIcon
} from '@heroicons/react/24/solid';

const navItems = [
  { name: 'Coaches', path: '/coaches', icon: UserGroupIcon },
  { name: 'Clients', path: '/clients', icon: UsersIcon },
  { name: 'Training', path: '/training', icon: CalendarIcon },
  { name: 'Library', path: '/library', icon: BookOpenIcon },
  { name: 'Forums', path: '/forums', icon: TrophyIcon },
  { name: 'Chat', path: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Settings', path: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 shadow-xl">
      <div className="p-6">
        <h1 className="text-2xl font-black text-white mb-8 uppercase tracking-wider flex items-center">
          <BoltIcon className="w-8 h-8 text-yellow-500 mr-2" />
          Spire
        </h1>
        <nav className="space-y-3">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-3 px-4 py-3.5 rounded-lg transition-all transform hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-yellow-500'
                }`}
              >
                <Icon className="w-6 h-6" />
                <span className="font-bold tracking-wide">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
} 