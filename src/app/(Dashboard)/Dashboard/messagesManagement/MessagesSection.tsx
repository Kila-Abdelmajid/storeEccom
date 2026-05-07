// app/dashboard/MessageSection.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';

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
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // all, today, week, month
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMessages(); }, []);

  const deleteMessage = async (id: number) => {
    if (!confirm('Delete this message?')) return;
    try {
      const res = await fetch(`/api/DashboardApi/messages?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch {
      alert('Delete failed');
    }
  };

  // Extract unique subjects for filter dropdown
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
      // Search filter
      const matchesSearch = !search || 
        msg.senderName.toLowerCase().includes(search.toLowerCase()) ||
        msg.senderEmail.toLowerCase().includes(search.toLowerCase()) ||
        msg.subject.toLowerCase().includes(search.toLowerCase()) ||
        msg.message.toLowerCase().includes(search.toLowerCase());
      
      // Subject filter
      const matchesSubject = subjectFilter === 'all' || msg.subject === subjectFilter;
      
      // Time filter
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
    // Get oldest message date
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

  if (loading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div></div>;
  if (error) return <div className="text-center text-red-500 p-8">{error}</div>;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Contact Messages</h1>
          <p className="text-slate-500 mt-1">Manage inquiries from your contact form</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Total Messages</p>
              <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">New (last 7 days)</p>
              <p className="text-2xl font-bold text-emerald-600">{stats.newCount}</p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm">Oldest message</p>
              <p className="text-xl font-semibold text-slate-800">{stats.oldest}</p>
            </div>
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-45">
              <label className="block text-xs font-medium text-slate-500 mb-1">Search</label>
              <input
                type="text"
                placeholder="Name, email, subject..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
            <div className="w-48">
              <label className="block text-xs font-medium text-slate-500 mb-1">Subject</label>
              <select
                value={subjectFilter}
                onChange={(e) => { setSubjectFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              >
                {uniqueSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub === 'all' ? 'All Subjects' : sub}</option>
                ))}
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-medium text-slate-500 mb-1">Time Range</label>
              <select
                value={timeFilter}
                onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
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
                className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Messages Table */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="w-12 px-4 py-3 text-left text-xs font-semibold text-slate-600">#</th>
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-slate-600">From</th>
                  <th className="w-[20%] px-4 py-3 text-left text-xs font-semibold text-slate-600 hidden md:table-cell">Subject</th>
                  <th className="w-[30%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Message</th>
                  <th className="w-[12%] px-4 py-3 text-left text-xs font-semibold text-slate-600">Date</th>
                  <th className="w-16 px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((msg, idx) => {
                  const isNew = new Date(msg.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                  return (
                    <tr key={msg.id} className="hover:bg-indigo-50/30 transition cursor-pointer" onClick={() => setSelectedMessage(msg)}>
                      <td className="px-4 py-3 text-sm text-slate-500">{(currentPage-1)*ITEMS_PER_PAGE + idx+1}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium text-slate-800 flex items-center gap-1">
                            {msg.senderName}
                            {isNew && <span className="inline-block w-2 h-2 bg-indigo-400 rounded-full"></span>}
                          </div>
                          <div className="text-xs text-slate-500">{msg.senderEmail}</div>
                          {msg.senderPhone && <div className="text-xs text-slate-400">{msg.senderPhone}</div>}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-sm font-medium text-slate-700 truncate">{msg.subject}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-slate-600 line-clamp-2">{msg.message}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500 whitespace-nowrap">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => deleteMessage(msg.id)} className="p-1 text-rose-500 hover:text-rose-700" title="Delete">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-8 text-slate-400">No messages match your filters.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex justify-between items-center bg-slate-50 text-sm">
              <span>Page {currentPage} of {totalPages}</span>
              <div className="flex gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage===1} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage===totalPages} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal to view full message */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedMessage(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-slate-800">Message Details</h2>
              <button onClick={() => setSelectedMessage(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              <div><span className="font-medium">From:</span> {selectedMessage.senderName} ({selectedMessage.senderEmail})</div>
              {selectedMessage.senderPhone && <div><span className="font-medium">Phone:</span> {selectedMessage.senderPhone}</div>}
              <div><span className="font-medium">Subject:</span> {selectedMessage.subject}</div>
              <div><span className="font-medium">Date:</span> {new Date(selectedMessage.createdAt).toLocaleString()}</div>
              <div className="border-t pt-3"><span className="font-medium">Message:</span><p className="mt-2 whitespace-pre-wrap">{selectedMessage.message}</p></div>
              {selectedMessage.userName && <div className="text-sm text-slate-500">Sent by registered user: {selectedMessage.userName}</div>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}