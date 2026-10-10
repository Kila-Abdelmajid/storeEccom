'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/contexts/ToastContext';
import { TrashIcon, MagnifyingGlassIcon, CheckIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface ClientReview {
  id: number;
  userId: number | null;
  userName: string;
  userEmail: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

export default function ClientReviewsSection() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; reviewId: number | null }>({ show: false, reviewId: null });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/DashboardApi/client-reviews');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReviews(data);
    } catch {
      showToast('Failed to load client reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async () => {
    if (!deleteConfirm.reviewId) return;
    try {
      const res = await fetch(`/api/DashboardApi/client-reviews?id=${deleteConfirm.reviewId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReviews(prev => prev.filter(r => r.id !== deleteConfirm.reviewId));
      showToast('Review deleted successfully', 'success');
    } catch {
      showToast('Delete failed', 'error');
    } finally {
      setDeleteConfirm({ show: false, reviewId: null });
    }
  };

  const toggleVerified = async (review: ClientReview) => {
    setTogglingId(review.id);
    const newVerified = !review.verified;
    try {
      const res = await fetch(`/api/DashboardApi/client-reviews?id=${review.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified: newVerified }),
      });
      if (!res.ok) throw new Error();
      setReviews(prev =>
        prev.map(r =>
          r.id === review.id ? { ...r, verified: newVerified } : r
        )
      );
      showToast(`Review marked as ${newVerified ? 'verified' : 'unverified'}`, 'success');
    } catch {
      showToast('Failed to update status', 'error');
    } finally {
      setTogglingId(null);
    }
  };

  // Analytics
  const analytics = useMemo(() => {
    const total = reviews.length;
    const averageRating = total
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
      : '0.0';
    const verifiedCount = reviews.filter(r => r.verified).length;
    const unverifiedCount = total - verifiedCount;
    return { total, averageRating, verifiedCount, unverifiedCount };
  }, [reviews]);

  // Filtering and pagination
  const filtered = useMemo(() => {
    let result = [...reviews];
    if (search) {
      result = result.filter(
        r => r.userName.toLowerCase().includes(search.toLowerCase()) || r.userEmail.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (ratingFilter !== 'all') {
      result = result.filter(r => r.rating === ratingFilter);
    }
    if (verifiedFilter === 'verified') result = result.filter(r => r.verified);
    if (verifiedFilter === 'unverified') result = result.filter(r => !r.verified);
    return result;
  }, [reviews, search, ratingFilter, verifiedFilter]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setRatingFilter('all');
    setVerifiedFilter('all');
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/60 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-8">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
              Client Reviews
            </h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Manage testimonials and customer feedback
            </p>
          </div>
        </div>

        {/* Analytics Cards – redesigned with consistent glassmorphism */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Total Reviews</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{analytics.total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg flex items-center justify-center text-white">
                <StarIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Average Rating</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{analytics.averageRating}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg flex items-center justify-center text-white">
                <div className="flex gap-0.5">
                  <StarSolid className="w-5 h-5" />
                  <StarSolid className="w-5 h-5" />
                  <StarSolid className="w-5 h-5" />
                  <StarSolid className="w-5 h-5" />
                  <StarSolid className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Verified</p>
                <p className="text-3xl font-bold text-emerald-600 mt-1">{analytics.verifiedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg flex items-center justify-center text-white">
                <CheckIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 p-5 border border-white/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">Unverified</p>
                <p className="text-3xl font-bold text-amber-600 mt-1">{analytics.unverifiedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg flex items-center justify-center text-white">
                <XMarkIcon className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-5 mb-8">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Search</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-300 bg-white/50"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Rating</label>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
              >
                <option value="all">All</option>
                <option value="5">★★★★★</option>
                <option value="4">★★★★</option>
                <option value="3">★★★</option>
                <option value="2">★★</option>
                <option value="1">★</option>
              </select>
            </div>
            <div className="w-40">
              <label className="block text-xs font-semibold text-slate-500 mb-1">Status</label>
              <select
                value={verifiedFilter}
                onChange={(e) => setVerifiedFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white/50"
              >
                <option value="all">All</option>
                <option value="verified">Verified only</option>
                <option value="unverified">Unverified only</option>
              </select>
            </div>
            <div>
              <button
                onClick={resetFilters}
                className="mt-5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm transition"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100/80">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rating</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Review</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginated.map((review) => (
                  <tr key={review.id} className="hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-semibold text-slate-800">{review.userName}</p>
                        <p className="text-xs text-slate-500">{review.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) =>
                          i < review.rating ? (
                            <StarSolid key={i} className="w-4 h-4 text-amber-500" />
                          ) : (
                            <StarIcon key={i} className="w-4 h-4 text-slate-300" />
                          )
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-md">
                        <p className="font-medium text-slate-800 truncate">{review.title}</p>
                        <p className="text-slate-600 text-xs line-clamp-2">{review.content}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {review.verified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          <CheckIcon className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {/* Fixed‑width container for the toggle button to prevent shift */}
                        <div className="w-36">
                          <button
                            onClick={() => toggleVerified(review)}
                            disabled={togglingId === review.id}
                            className={`w-full px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                              review.verified
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            }`}
                          >
                            {togglingId === review.id ? (
                              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto" />
                            ) : review.verified ? (
                              'Mark as unverified'
                            ) : (
                              'Mark as verified'
                            )}
                          </button>
                        </div>
                        <button
                          onClick={() => setDeleteConfirm({ show: true, reviewId: review.id })}
                          className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition flex-shrink-0"
                          title="Delete"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 italic">
                      No reviews found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm disabled:opacity-50 hover:bg-white transition"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
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

      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/95 rounded-2xl shadow-2xl max-w-md w-full border border-white/50 p-6">
            <h3 className="text-xl font-semibold text-slate-800 mb-2">Delete review?</h3>
            <p className="text-slate-600 text-sm mb-6">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ show: false, reviewId: null })}
                className="px-4 py-2 rounded-full border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-full bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}