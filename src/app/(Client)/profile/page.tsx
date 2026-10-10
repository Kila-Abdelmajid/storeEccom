'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import ProfileSidebar from '@/components/client/profileSection/ProfileSidebar';
import UserInfo from '@/components/client/profileSection/UserInfo';
import OrdersList from '@/components/client/profileSection/OrdersList';
import FavoritesList from '@/components/client/profileSection/FavoritesList';
import { useAuth } from '@/hooks/useAuth';

type Tab = 'info' | 'orders' | 'favorites';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const router = useRouter();
  const { session, loading } = useAuth();

  // Redirect to login if not authenticated (client‑side only)
  useEffect(() => {
    if (!loading && !session) {
      router.push('/login');
    }
  }, [session, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  const fadeVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100/60 min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <span className="hover:text-amber-600 transition cursor-pointer" onClick={() => router.push('/')}>
              Home
            </span>
            <span>/</span>
            <span className="text-amber-600 font-medium">My Account</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-light text-slate-800 tracking-tight flex items-center gap-2">
            <span className="font-serif italic bg-gradient-to-r from-amber-600 to-amber-500 bg-clip-text text-transparent">My Account</span>
          </h1>
          <div className="w-20 h-px bg-gradient-to-r from-amber-400 to-transparent mt-3" />
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <ProfileSidebar activeTab={activeTab} onTabChange={setActiveTab} />
          <motion.div
            key={activeTab}
            initial="hidden"
            animate="visible"
            variants={fadeVariants}
            className="flex-1"
          >
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-6 md:p-8 transition-all">
              {activeTab === 'info' && <UserInfo />}
              {activeTab === 'orders' && <OrdersList />}
              {activeTab === 'favorites' && <FavoritesList />}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}