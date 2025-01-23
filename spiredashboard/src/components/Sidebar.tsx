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
    <aside className="w-20 min-h-screen bg-dark border-r border-dark-100">
      <div className="py-4 flex flex-col items-center">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-white">SP</h1>
        </div>
        <nav className="space-y-6 w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center py-2 relative ${
                  isActive
                    ? 'text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{item.name}</span>
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-white rounded-r" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
} 