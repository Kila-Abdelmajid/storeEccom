'use client';

import { useState, useEffect, useRef } from 'react';
import { StarIcon, PencilIcon, TrashIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon, CheckIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';

interface ClientReview {
  id: number;
  userId: number | null;
  userName: string;
  rating: number;
  title: string;
  content: string;
  verified: boolean;
  createdAt: string;
}

interface ClientReviewsProps {
  currentUserId: number | null;
}

const MAX_CONTENT_LENGTH = 500;

export default function ClientReviews({ currentUserId }: ClientReviewsProps) {
  const [reviews, setReviews] = useState<ClientReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ rating: 5, title: '', content: '' });
  const [addFormData, setAddFormData] = useState({ rating: 5, title: '', content: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverAddStar, setHoverAddStar] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ reviewId: number | null; show: boolean }>({ reviewId: null, show: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ClientApi/clientReviews');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sorted = data.sort((a: ClientReview, b: ClientReview) => {
        if (a.userId === currentUserId && b.userId !== currentUserId) return -1;
        if (a.userId !== currentUserId && b.userId === currentUserId) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
      setReviews(sorted);
    } catch {
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentUserId]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      showToast('Please login to write a review', 'error');
      return;
    }
    if (!addFormData.title.trim() || !addFormData.content.trim()) {
      showToast('Title and content cannot be empty', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ClientApi/clientReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addFormData),
      });
      if (!res.ok) throw new Error();
      await fetchReviews();
      setAddFormData({ rating: 5, title: '', content: '' });
      showToast('✨ Review added!', 'success');
    } catch {
      showToast('Failed to post review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (reviewId: number) => {
    if (!editFormData.title.trim() || !editFormData.content.trim()) {
      showToast('Title and content cannot be empty', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ClientApi/clientReviews?reviewId=${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: editFormData.rating,
          title: editFormData.title,
          content: editFormData.content,
        }),
      });
      if (!res.ok) throw new Error();
      await fetchReviews();
      setEditingReviewId(null);
      showToast('✅ Review updated!', 'success');
    } catch {
      showToast('Update failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.reviewId) return;
    try {
      const res = await fetch(`/api/ClientApi/clientReviews?reviewId=${deleteConfirm.reviewId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      await fetchReviews();
      showToast('🗑️ Review deleted', 'success');
    } catch {
      showToast('Deletion failed', 'error');
    } finally {
      setDeleteConfirm({ reviewId: null, show: false });
    }
  };

  const startEdit = (review: ClientReview) => {
    setEditingReviewId(review.id);
    setEditFormData({
      rating: review.rating,
      title: review.title,
      content: review.content,
    });
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditFormData({ rating: 5, title: '', content: '' });
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 360;
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <section className="py-16 md:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Toast */}
        {toast && (
          <div
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-300 font-medium ${
              toast.type === 'success'
                ? 'bg-green-600 text-white border-l-4 border-lime-300'
                : 'bg-red-600 text-white border-l-4 border-red-300'
            }`}
          >
            {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
            <span>{toast.message}</span>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 mb-4 text-[10px] font-bold tracking-[0.4em] uppercase bg-gray-900 text-white rounded-full">
            Testimonials
          </span>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            What Our <span className="text-[#c9a96e]">Customers Say</span>
          </h2>
          <div className="w-20 h-0.5 bg-[#c9a96e] mx-auto mb-6" />
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Real experiences from people who trusted us.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-[#c9a96e] transition-all hover:shadow-xl">
            <div className="text-5xl font-bold text-[#c9a96e] mb-2">{averageRating}</div>
            <div className="flex justify-center mb-2">
              {[...Array(5)].map((_, i) =>
                i < parseFloat(averageRating) ? (
                  <StarSolid key={i} className="w-5 h-5 text-yellow-500" />
                ) : (
                  <StarIcon key={i} className="w-5 h-5 text-gray-300" />
                )
              )}
            </div>
            <p className="text-gray-600">Average rating</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-[#c9a96e] transition-all hover:shadow-xl">
            <div className="text-5xl font-bold text-[#c9a96e] mb-2">{reviews.length}</div>
            <p className="text-gray-600">Verified reviews</p>
          </div>
          <div className="bg-gray-50 rounded-2xl p-6 text-center border border-gray-100 hover:border-[#c9a96e] transition-all hover:shadow-xl">
            <div className="text-5xl font-bold text-[#c9a96e] mb-2">
              {reviews.length
                ? ((reviews.filter(r => r.rating >= 4).length / reviews.length) * 100).toFixed(0)
                : '0'}
              %
            </div>
            <p className="text-gray-600">Satisfied customers</p>
          </div>
        </div>

        {/* Add Review Form */}
        {currentUserId ? (
          <div className="bg-gradient-to-r from-gray-50 to-white border-2 border-gray-200 rounded-2xl p-6 mb-12 shadow-md hover:shadow-xl transition-all">
            <form onSubmit={handleAddSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">★ Rate us</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setAddFormData(prev => ({ ...prev, rating: star }))}
                      onMouseEnter={() => setHoverAddStar(star)}
                      onMouseLeave={() => setHoverAddStar(0)}
                      className="focus:outline-none transition-all"
                    >
                      {(hoverAddStar >= star || addFormData.rating >= star) ? (
                        <StarSolid className="w-7 h-7 text-[#c9a96e] drop-shadow-md transform scale-110 transition-all" />
                      ) : (
                        <StarIcon className="w-7 h-7 text-gray-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">📌 Title</label>
                <input
                  type="text"
                  value={addFormData.title}
                  onChange={e => setAddFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Summarize your experience"
                  className="w-full rounded-xl border-2 border-gray-200 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/20 p-3 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">✍️ Your story</label>
                <textarea
                  rows={4}
                  value={addFormData.content}
                  onChange={e => {
                    const val = e.target.value.slice(0, MAX_CONTENT_LENGTH);
                    setAddFormData(prev => ({ ...prev, content: val }));
                  }}
                  placeholder="Share your honest opinion..."
                  className="w-full rounded-xl border-2 border-gray-200 focus:border-[#c9a96e] focus:ring-2 focus:ring-[#c9a96e]/20 resize-none text-base p-3 transition"
                  required
                />
                <div className="flex justify-end mt-2">
                  <span className={`text-xs font-mono ${addFormData.content.length >= MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                    {addFormData.content.length}/{MAX_CONTENT_LENGTH}
                  </span>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting || !addFormData.title.trim() || !addFormData.content.trim()}
                  className="px-6 py-2.5 rounded-xl bg-[#c9a96e] text-white font-bold uppercase tracking-wider hover:bg-[#b88a4a] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition"
                >
                  {isSubmitting ? '...' : 'Publish review'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-5 mb-12 text-center">
            <p className="text-amber-800 font-medium">
              🔒 <a href="/login" className="font-black underline hover:no-underline">Login</a> to share your experience.
            </p>
          </div>
        )}

        {/* Reviews Slider */}
        {loading && <div className="flex justify-center py-16"><div className="w-10 h-10 border-4 border-[#c9a96e] border-t-transparent rounded-full animate-spin" /></div>}
        {error && <p className="text-red-500 text-center py-10 font-mono">{error}</p>}

        {!loading && reviews.length > 0 && (
          <div className="relative group">
            <button
              onClick={() => scroll('left')}
              className="absolute -left-5 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:border-[#c9a96e] hover:scale-110"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="absolute -right-5 top-1/2 -translate-y-1/2 z-10 bg-white border-2 border-gray-300 rounded-full p-2 shadow-xl opacity-0 group-hover:opacity-100 transition-all hover:border-[#c9a96e] hover:scale-110"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-700" />
            </button>

            <div
              ref={scrollContainerRef}
              className="flex overflow-x-auto gap-8 pb-8 scroll-smooth hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {reviews.map(review => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-96 bg-white border-2 border-gray-100 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col min-h-[360px] hover:-translate-y-1"
                >
                  {editingReviewId === review.id ? (
                    <div className="p-6 flex flex-col flex-1">
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-gray-600 uppercase">Rating</label>
                          <div className="flex gap-1 mt-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setEditFormData(prev => ({ ...prev, rating: star }))}
                              >
                                {star <= editFormData.rating ? (
                                  <StarSolid className="w-5 h-5 text-[#c9a96e]" />
                                ) : (
                                  <StarIcon className="w-5 h-5 text-gray-300" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 uppercase">Title</label>
                          <input
                            type="text"
                            value={editFormData.title}
                            onChange={e => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full rounded-lg border-2 border-gray-200 focus:border-[#c9a96e] text-sm p-2"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-gray-600 uppercase">Content</label>
                          <textarea
                            rows={3}
                            value={editFormData.content}
                            onChange={e => {
                              const val = e.target.value.slice(0, MAX_CONTENT_LENGTH);
                              setEditFormData(prev => ({ ...prev, content: val }));
                            }}
                            className="w-full rounded-lg border-2 border-gray-200 focus:border-[#c9a96e] text-sm p-2 resize-none"
                          />
                          <div className="flex justify-end mt-1">
                            <span className={`text-xs ${editFormData.content.length >= MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-gray-400'}`}>
                              {editFormData.content.length}/{MAX_CONTENT_LENGTH}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={() => handleUpdate(review.id)}
                            disabled={isSubmitting || !editFormData.title.trim() || !editFormData.content.trim()}
                            className="px-4 py-1.5 rounded-lg bg-[#c9a96e] text-white text-xs font-bold uppercase shadow-sm hover:bg-[#b88a4a] transition"
                          >
                            {isSubmitting ? '...' : 'Save'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="px-4 py-1.5 rounded-lg border-2 border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 flex flex-col flex-1 justify-between h-full">
                      <div>
                        <div className="flex items-start gap-3">
                          <UserCircleIcon className="w-12 h-12 text-gray-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="font-black text-gray-900 text-lg truncate">{review.userName}</p>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) =>
                                  i < review.rating ? (
                                    <StarSolid key={i} className="w-4 h-4 text-[#c9a96e]" />
                                  ) : (
                                    <StarIcon key={i} className="w-4 h-4 text-gray-300" />
                                  )
                                )}
                              </div>
                            </div>
                            <h4 className="font-bold text-gray-800 mt-2">{review.title}</h4>
                            <div className="mt-2 max-h-24 overflow-y-auto pr-1 custom-scroll">
                              <p className="text-gray-700 text-sm leading-relaxed break-words whitespace-normal">
                                {review.content}
                              </p>
                            </div>
                            {review.verified && (
                              <span className="inline-block mt-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                ✓ Verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mt-5 pt-3 border-t-2 border-gray-100">
                        <span className="text-xs text-gray-400 font-mono">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                        {review.userId === currentUserId && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(review)}
                              className="text-gray-500 hover:text-[#c9a96e] transition-colors p-1"
                              title="Edit"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ reviewId: review.id, show: true })}
                              className="text-gray-500 hover:text-red-500 transition-colors p-1"
                              title="Delete"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && reviews.length === 0 && (
          <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-[#c9a96e]">
            <UserCircleIcon className="w-20 h-20 text-[#c9a96e] mx-auto mb-4 opacity-60" />
            <p className="text-gray-800 text-xl font-black">No reviews yet</p>
            <p className="text-gray-500 mt-2">Be the first to share your experience 💬</p>
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirm.show && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border-2 border-gray-200">
              <h3 className="text-xl font-black text-gray-900 mb-2">Delete review?</h3>
              <p className="text-gray-600 text-sm mb-6">This is permanent. No coming back.</p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm({ reviewId: null, show: false })}
                  className="px-4 py-2 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <style jsx global>{`
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .custom-scroll::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scroll::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .custom-scroll::-webkit-scrollbar-thumb {
            background: #c9a96e;
            border-radius: 10px;
          }
        `}</style>
      </div>
    </section>
  );
}