'use client';

import { UserIcon, ShoppingBagIcon, HeartIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Tab = 'info' | 'orders' | 'favorites';

const tabs = [
  { id: 'info', name: 'Personal Info', icon: UserIcon },
  { id: 'orders', name: 'My Orders', icon: ShoppingBagIcon },
  { id: 'favorites', name: 'Favorites', icon: HeartIcon },
];

interface ProfileSidebarProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function ProfileSidebar({ activeTab, onTabChange }: ProfileSidebarProps) {
  const { session, loading, refreshSession } = useAuth();
  const [userName, setUserName] = useState('User');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/users');
        if (res.ok) {
          const data = await res.json();
          setUserName(`${data.firstName} ${data.lastName}`);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (session) fetchUser();
  }, [session]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refreshSession();
    router.push('/login');
  };

  if (loading) {
    return <div className="w-80 md:w-72 bg-white/60 backdrop-blur-sm rounded-2xl shadow-md animate-pulse h-64" />;
  }

  return (
    <aside className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 w-80 md:w-72 shrink-0">
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-700 shadow-sm">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-lg">{userName}</h3>
            <p className="text-xs text-slate-500 mt-0.5">My Account</p>
          </div>
        </div>
      </div>

      <div className="p-4 flex flex-col h-full">
        <div className="space-y-1.5">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as Tab)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl transition-all duration-200 group ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md'
                    : 'text-slate-700 hover:bg-slate-100 hover:translate-x-1'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
                <span className="font-medium text-sm">{tab.name}</span>
                {isActive && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-75" />}
              </button>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 transition-all duration-200 group"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
            <span className="font-medium text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}