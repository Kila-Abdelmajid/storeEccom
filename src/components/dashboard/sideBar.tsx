'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Flower2,
  UserCircle,
  Home,
} from 'lucide-react';
import { deleteSession } from '@/lib/auth';
import { useSession } from '@/lib/useSession';

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const isAdmin = session?.role === 'admin';

  const adminMenuItems = [
    { name: 'Dashboard', href: '/Dashboard', icon: LayoutDashboard },
    { name: 'Produits', href: '/Dashboard/productManagement', icon: ShoppingBag },
    { name: 'Categories', href: '/Dashboard/categoriesManagement', icon: ShoppingBag },
    { name: 'Messages', href: '/Dashboard/messagesManagement', icon: MessageSquare },
    { name: 'Clients', href: '/Dashboard/usersManagement', icon: Users },
    { name: 'Paramètres', href: '/Dashboard/settings', icon: Settings },
  ];

  const userMenuItems = [
    { name: 'Accueil', href: '/', icon: Home },
    { name: 'Mon Profil', href: '/profile', icon: UserCircle },
    { name: 'Mes Commandes', href: '/orders', icon: ShoppingBag },
    { name: 'Paramètres', href: '/settings', icon: Settings },
  ];

  const menuItems = isAdmin ? adminMenuItems : userMenuItems;

  const handleLogout = async () => {
    await deleteSession();
    router.push('/login');
  };

  if (loading) {
    return (
      <aside className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col sticky top-0 animate-pulse">
        <div className="p-6 border-b border-gray-100">
          <div className="h-8 bg-gray-200 rounded w-32"></div>
        </div>
        <div className="p-4 space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-64 bg-white h-screen border-r border-gray-200 flex flex-col sticky top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-100 flex items-center gap-3">
        <div className="bg-primary-500 p-2 rounded-lg text-white">
          <Flower2 size={24} />
        </div>
        <span className="text-xl font-bold text-gray-800">ABDO STORE</span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-50 text-primary-600 font-semibold'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-600" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-500 hover:bg-red-50 rounded-xl transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}