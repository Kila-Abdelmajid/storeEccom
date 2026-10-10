'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';

type Message = {
  id: number;
  senderName: string;
  senderEmail: string;
  senderPhone: string | null;
  subject: string;
  message: string;
  createdAt: string;
  userId: number | null;
  userName: string | null;
};

const ITEMS_PER_PAGE = 8;

export default function MessageSection() {
  const { showToast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; messageId: number | null }>({ isOpen: false, messageId: null });

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/DashboardApi/messages');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data);
      setError(null);
    } catch {
      setError('Failed to load messages');
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/messages?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMessages(prev => prev.filter(m => m.id !== id));
      showToast('Message deleted successfully', 'success');
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const openConfirmDialog = (messageId: number) => {
    setConfirmDialog({ isOpen: true, messageId });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.messageId) {
      deleteMessage(confirmDialog.messageId);
    }
    setConfirmDialog({ isOpen: false, messageId: null });
  };

  // Extract unique subjects
  const uniqueSubjects = useMemo(() => {
    const subjects = new Set(messages.map(m => m.subject).filter(Boolean));
    return ['all', ...Array.from(subjects).sort()];
  }, [messages]);

  // Date filter helper
  const isWithinTimeRange = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    switch (timeFilter) {
      case 'today': return date >= today;
      case 'week': return date >= weekAgo;
      case 'month': return date >= monthAgo;
      default: return true;
    }
  };

  // Combined filtering
  const filtered = useMemo(() => {
    return messages.filter(msg => {
      const matchesSearch = !search || 
        msg.senderName.toLowerCase().includes(search.toLowerCase()) ||
        msg.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
        msg.subject.toLowerCase().includes(search.toLowerCase()) ||
        msg.message.toLowerCase().includes(search.toLowerCase());
      
      const matchesSubject = subjectFilter === 'all' || msg.subject === subjectFilter;
      const matchesTime = isWithinTimeRange(msg.createdAt);
      
      return matchesSearch && matchesSubject && matchesTime;
    });
  }, [messages, search, subjectFilter, timeFilter]);

  // Stats
  const stats = useMemo(() => {
    const total = filtered.length;
    const newCount = filtered.filter(msg => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return new Date(msg.createdAt) >= sevenDaysAgo;
    }).length;
    const oldest = filtered.length ? new Date(Math.min(...filtered.map(m => new Date(m.createdAt).getTime()))) : null;
    return { total, newCount, oldest: oldest?.toLocaleDateString() || '-' };
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  const resetFilters = () => {
    setSearch('');
    setSubjectFilter('all');
    setTimeFilter('all');
    setCurrentPage(1);
  };

  // Helper to get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-xl border border-slate-200">
          <p className="text-red-600 mb-4">{error}</p>
          <button onClick={fetchMessages} className="px-4 py-2 bg-amber-500 text-white rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60">
      {/* Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-slate-200 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Message</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete this message? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, messageId: null })}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-lg shadow-md transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Contact Messages
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Manage inquiries from your contact form
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <StatCard title="Total Messages" value={stats.total} icon="Mail" color="indigo" />
          <StatCard title="New (last 7 days)" value={stats.newCount} icon="Clock" color="amber" />
          <StatCard title="Oldest message" value={stats.oldest} icon="Calendar" color="emerald" />
        </div>

        {/* Filters Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name, email, subject..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition bg-white/50"
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
              >
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub === 'all' ? 'All Subjects' : sub}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Time Range</label>
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
              >
                <option value="all">All time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
              </select>
            </div>
            <div>
              <button
                onClick={resetFilters}
                className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition font-medium shadow-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">#</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">From</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Subject</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Message</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((msg, idx) => {
                  const isNew = new Date(msg.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  const isRegistered = !!msg.userId;
                  const initials = getInitials(msg.senderName);
                  
                  return (
                    <tr
                      key={msg.id}
                      className="hover:bg-amber-50/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedMessage(msg)}
                    >
                      <td className="px-6 py-4 text-sm text-slate-500">{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-medium shadow-sm ${isRegistered ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {msg.senderName}
                              {isNew && <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>}
                             
                            </div>
                            <div className="text-xs text-slate-500">{msg.senderEmail}</div>
                            {msg.senderPhone && <div className="text-xs text-slate-400">{msg.senderPhone}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden md:table-cell">
                        <div className="text-sm font-medium text-slate-700 truncate max-w-[200px]">{msg.subject}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600 line-clamp-2">{msg.message}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openConfirmDialog(msg.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No messages match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p-1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal for full message details */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/50" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm px-6 py-4 border-b border-slate-100 flex justify-between items-center rounded-t-2xl">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Message Details
                </h2>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* Sender info with avatar */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold shadow-md ${selectedMessage.userId ? 'bg-gradient-to-br from-amber-500 to-amber-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'}`}>
                  {getInitials(selectedMessage.senderName)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-slate-800">{selectedMessage.senderName}</h3>
                  
                  </div>
                  <p className="text-sm text-slate-600">{selectedMessage.senderEmail}</p>
                  {selectedMessage.senderPhone && <p className="text-sm text-slate-600">{selectedMessage.senderPhone}</p>}
                </div>
              </div>

              {/* Message metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 rounded-xl p-4">
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Subject</p>
                  <p className="font-medium text-slate-800">{selectedMessage.subject}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Date & Time</p>
                  <p className="text-slate-700">{new Date(selectedMessage.createdAt).toLocaleString()}</p>
                </div>
                {selectedMessage.userName && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Account name</p>
                    <p className="text-slate-700">{selectedMessage.userName}</p>
                  </div>
                )}
              </div>

              {/* Message content */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Message</p>
                <div className="bg-slate-50 rounded-xl p-5 text-slate-700 whitespace-pre-wrap text-sm leading-relaxed border border-slate-100">
                  {selectedMessage.message}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
              <button
                onClick={() => setSelectedMessage(null)}
                className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-white text-slate-700 transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setSelectedMessage(null);
                  openConfirmDialog(selectedMessage.id);
                }}
                className="px-4 py-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl shadow-md transition"
              >
                Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Reusable StatCard Component
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  const colorMap: Record<string, string> = {
    indigo: 'from-indigo-500 to-indigo-600',
    rose: 'from-rose-500 to-rose-600',
    amber: 'from-amber-500 to-amber-600',
    emerald: 'from-emerald-500 to-emerald-600',
  };
  const IconComponent = () => {
    switch (icon) {
      case 'Mail':
        return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>;
      case 'Clock':
        return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
      case 'Calendar':
        return <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
      default:
        return null;
    }
  };
  return (
    <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50 group">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} shadow-lg flex items-center justify-center text-white group-hover:scale-110 transition-transform duration-200`}>
          <IconComponent />
        </div>
      </div>
    </div>
  );
}