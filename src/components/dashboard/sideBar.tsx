'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  MessageSquare,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Package,
  Tag,
  ShoppingCart,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export default function SideBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading, refreshSession } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Admin menu items
  const adminMenuItems = [
    { name: 'Dashboard', href: '/Dashboard', icon: LayoutDashboard },
    { name: 'Products', href: '/productsManagement', icon: Package },
    { name: 'Categories', href: '/categoriesManagement', icon: Tag },
    { name: 'Orders', href: '/ordersManagement', icon: ShoppingCart },
    { name: 'Messages', href: '/messagesManagement', icon: MessageSquare },
    { name: 'Customers', href: '/usersManagement', icon: Users },
    { name: 'ClientReviews', href: '/clientReviewsManagement', icon: ShoppingBag }, // using ShoppingBag as fallback
    { name: 'Settings', href: '/profileManagement', icon: Settings },
  ];

  // Detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) setIsMobileOpen(false);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    await refreshSession();
    router.push('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) setIsMobileOpen(!isMobileOpen);
    else setIsCollapsed(!isCollapsed);
  };

  const closeMobileMenu = () => setIsMobileOpen(false);

  // Active link detection
  const isActive = (href: string) => {
    if (href === '/Dashboard') return pathname === href || pathname?.startsWith(href + '/');
    return pathname?.startsWith(href);
  };

  if (loading) {
    return (
      <aside className="hidden md:flex flex-col bg-white/70 backdrop-blur-sm border-r border-slate-200 w-64 h-screen sticky top-0 animate-pulse">
        <div className="p-6 border-b border-slate-100"><div className="h-8 bg-slate-200 rounded w-32" /></div>
        <div className="p-4 space-y-3">{Array(7).fill(0).map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded-xl" />)}</div>
      </aside>
    );
  }

  // --- Desktop Sidebar (Collapsible) with smooth width animation ---
  const desktopSidebar = (
    <motion.aside
      initial={false}
      animate={{ width: isCollapsed ? 80 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="hidden md:flex flex-col bg-white/80 backdrop-blur-sm border-r border-slate-200/80 shadow-lg sticky top-0 h-screen z-30 overflow-hidden"
    >
      {/* Logo + Toggle */}
      <div className={`p-4 border-b border-slate-100/80 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} gap-3`}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {/* Custom image logo */}
            <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md">
              <Image
                src="/photos/image.png" // 👈 change this to your actual flower logo path
                alt="Fleur Marwa Logo"
                fill
                className="object-cover"
                 sizes={"40px"}

              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-serif italic font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                Fleur Marwa
              </span>
              <span className="text-[10px] text-slate-400 -mt-0.5">Administration</span>
            </div>
          </div>
        )}
       
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
          aria-label="Toggle sidebar"
        >
          <Menu size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto">
        {adminMenuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                active
                  ? 'bg-amber-50 text-amber-600 font-medium shadow-sm border-l-2 border-amber-400'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              } ${isCollapsed ? 'justify-center' : ''}`}
              title={isCollapsed ? item.name : ''}
            >
              <Icon
                size={19}
                className={`transition-transform group-hover:scale-110 ${
                  active ? 'text-amber-500' : 'text-slate-500'
                }`}
              />
              {!isCollapsed && <span className="text-sm">{item.name}</span>}
              {active && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-100/80">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-200 group ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : ''}
        >
          <LogOut size={19} className="transition-transform group-hover:scale-110" />
          {!isCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );

  // --- Mobile Sidebar (Overlay) with slide animation ---
  const mobileSidebar = (
    <AnimatePresence>
      {isMobileOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={closeMobileMenu}
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-white/95 backdrop-blur-sm shadow-2xl z-50 flex flex-col md:hidden"
          >
            {/* Mobile Header */}
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 rounded-xl overflow-hidden shadow-md">
                  <Image
                    src="/photos/image.png" // 👈 change this to your actual flower logo path
                    alt="Fleur Marwa Logo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-lg font-serif italic font-bold bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">
                    Fleur Marwa
                  </span>
                  <span className="text-[10px] text-slate-400 -mt-0.5">Administration</span>
                </div>
              </div>
              <button onClick={closeMobileMenu} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={20} />
              </button>
            </div>

            {/* Mobile Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {adminMenuItems.map((item) => {
                const active = isActive(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                      active
                        ? 'bg-amber-50 text-amber-600 font-medium shadow-sm border-l-2 border-amber-400'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon size={19} />
                    <span className="text-sm">{item.name}</span>
                    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-500" />}
                  </Link>
                );
              })}
            </nav>

            {/* Mobile Logout */}
            <div className="p-4 border-t border-slate-100">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-4 py-3 w-full text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              >
                <LogOut size={19} />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  // --- Mobile Toggle Button (top‑left) ---
  const mobileToggle = (
    <button
      onClick={toggleSidebar}
      className="fixed top-4 left-4 md:hidden z-30 p-2 bg-white/80 backdrop-blur-sm rounded-lg shadow-md text-slate-700 hover:bg-white transition-all duration-200"
      aria-label="Open menu"
    >
      <Menu size={22} />
    </button>
  );

  if (!session || session.role !== 'admin') return null;

  return (
    <>
      {desktopSidebar}
      {mobileSidebar}
      {mobileToggle}
    </>
  );
}