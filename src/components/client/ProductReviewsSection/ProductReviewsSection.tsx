'use client';

import { useState, useEffect, useRef } from 'react';
import {
  StarIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import type { Review } from '@/types/review';

interface ReviewsSectionProps {
  productId: number;
  currentUserId: number | null;
}

const MAX_COMMENT_LENGTH = 500;

export default function ProductReviewsSection({ productId, currentUserId }: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingReviewId, setEditingReviewId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({ rating: 5, comment: '' });
  const [addFormData, setAddFormData] = useState({ rating: 5, comment: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverAddStar, setHoverAddStar] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ reviewId: number | null; show: boolean }>({ reviewId: null, show: false });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ClientApi/ProductReviews?productId=${productId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const sorted = data.sort((a: Review, b: Review) => {
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
  }, [productId, currentUserId]);

  // Update arrow visibility
  const updateArrows = () => {
    const container = scrollContainerRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const maxScroll = container.scrollWidth - container.clientWidth;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft + 10 < maxScroll);
  };

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    container.addEventListener('scroll', updateArrows);
    window.addEventListener('resize', updateArrows);
    const timeout = setTimeout(updateArrows, 100);
    return () => {
      container.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
      clearTimeout(timeout);
    };
  }, [reviews]);

  const scroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const firstChild = scrollContainerRef.current.children[0] as HTMLElement;
    if (!firstChild) return;
    const itemWidth = firstChild.offsetWidth + 24; // card width + gap
    const scrollAmount = direction === 'left' ? -itemWidth : itemWidth;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) {
      showToast('Please login to write a review', 'error');
      return;
    }
    if (!addFormData.comment.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/ClientApi/ProductReviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, ...addFormData }),
      });
      if (!res.ok) throw new Error();
      await fetchReviews();
      setAddFormData({ rating: 5, comment: '' });
      showToast('✨ Review added!', 'success');
    } catch {
      showToast('Failed to post review', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (reviewId: number) => {
    if (!editFormData.comment.trim()) {
      showToast('Comment cannot be empty', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/ClientApi/ProductReviews?reviewId=${reviewId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: editFormData.rating, comment: editFormData.comment }),
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
      const res = await fetch(`/api/ClientApi/ProductReviews?reviewId=${deleteConfirm.reviewId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      await fetchReviews();
      showToast('🗑️ Review deleted', 'success');
    } catch {
      showToast('Deletion failed', 'error');
    } finally {
      setDeleteConfirm({ reviewId: null, show: false });
    }
  };

  const startEdit = (review: Review) => {
    setEditingReviewId(review.id);
    setEditFormData({ rating: review.rating, comment: review.comment });
  };

  const cancelEdit = () => {
    setEditingReviewId(null);
    setEditFormData({ rating: 5, comment: '' });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const averageRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className="mt-20 border-t border-slate-200 pt-12">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-sm animate-in slide-in-from-bottom-5 duration-300 font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-l-4 border-emerald-300'
              : 'bg-rose-600 text-white border-l-4 border-rose-300'
          }`}
        >
          {toast.type === 'success' ? <CheckIcon className="w-5 h-5" /> : <XMarkIcon className="w-5 h-5" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
        <div>
          <h2 className="text-3xl md:text-4xl font-light text-gray-800 tracking-tight">Customer Voices</h2>
          <p className="text-gray-500 text-sm mt-1">Real feedback, no filter</p>
        </div>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm border border-white/50 px-5 py-2.5 rounded-full shadow-md">
          <StarSolid className="w-5 h-5 text-amber-400" />
          <span className="font-bold text-gray-800 text-xl">{averageRating}</span>
          <span className="text-gray-500 text-sm">({reviews.length} reviews)</span>
        </div>
      </div>

      {/* Add Review Form */}
      {currentUserId ? (
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-md border border-white/50 p-6 mb-12">
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-gray-800">📝 Write your review</h3>
            <div className="w-12 h-px bg-amber-400 mx-auto mt-2" />
          </div>
          <form onSubmit={handleAddSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2">★ Rate this product</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setAddFormData(prev => ({ ...prev, rating: star }))}
                    onMouseEnter={() => setHoverAddStar(star)}
                    onMouseLeave={() => setHoverAddStar(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    {(hoverAddStar >= star || addFormData.rating >= star) ? (
                      <StarSolid className="w-7 h-7 text-amber-500 drop-shadow-md" />
                    ) : (
                      <StarIcon className="w-7 h-7 text-slate-300" />
                    )}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">✍️ Your take</label>
              <textarea
                rows={4}
                value={addFormData.comment}
                onChange={e => {
                  const val = e.target.value.slice(0, MAX_COMMENT_LENGTH);
                  setAddFormData(prev => ({ ...prev, comment: val }));
                }}
                placeholder="What's your honest opinion? Spill it here..."
                className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-300 focus:border-amber-300 transition resize-none"
                required
              />
              <div className="flex justify-end mt-1">
                <span className={`text-xs ${addFormData.comment.length >= MAX_COMMENT_LENGTH ? 'text-rose-500' : 'text-slate-400'}`}>
                  {addFormData.comment.length}/{MAX_COMMENT_LENGTH}
                </span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting || !addFormData.comment.trim()}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-bold uppercase tracking-wider shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '...' : 'Publish review'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="bg-amber-50/50 backdrop-blur-sm border border-amber-200 rounded-xl p-5 mb-12 text-center">
          <p className="text-amber-800 font-medium">
            🔒 <a href="/login" className="font-black underline hover:no-underline">Login</a> to drop your truth.
          </p>
        </div>
      )}

      {/* Reviews Slider */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="w-12 h-12 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
        </div>
      )}
      {error && <p className="text-rose-500 text-center py-10">{error}</p>}

      {!loading && reviews.length > 0 && (
        <div className="relative group">
          {/* Left Arrow */}
          <button
            onClick={() => scroll('left')}
            disabled={!canScrollLeft}
            className={`absolute -left-5 md:-left-7 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
              canScrollLeft ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll left"
          >
            <ChevronLeftIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          {/* Right Arrow */}
          <button
            onClick={() => scroll('right')}
            disabled={!canScrollRight}
            className={`absolute -right-5 md:-right-7 top-1/2 -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/80 backdrop-blur-md shadow-lg text-gray-700 transition-all duration-300 hover:bg-amber-500 hover:text-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-400/50 ${
              canScrollRight ? 'opacity-100' : 'opacity-40 cursor-not-allowed'
            }`}
            aria-label="Scroll right"
          >
            <ChevronRightIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>

          <div
            ref={scrollContainerRef}
            className="flex overflow-x-auto gap-6 pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', scrollSnapType: 'x mandatory' }}
          >
            {reviews.map(review => (
              <div
                key={review.id}
                className="flex-shrink-0 w-80 snap-start bg-white/80 backdrop-blur-sm rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/50 flex flex-col hover:-translate-y-1"
              >
                {editingReviewId === review.id ? (
                  <div className="p-5 flex flex-col flex-1">
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Rating</label>
                        <div className="flex gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setEditFormData(prev => ({ ...prev, rating: star }))}
                              className="focus:outline-none"
                            >
                              {star <= editFormData.rating ? (
                                <StarSolid className="w-5 h-5 text-amber-500" />
                              ) : (
                                <StarIcon className="w-5 h-5 text-slate-300" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-500">Review</label>
                        <textarea
                          rows={3}
                          value={editFormData.comment}
                          onChange={e => {
                            const val = e.target.value.slice(0, MAX_COMMENT_LENGTH);
                            setEditFormData(prev => ({ ...prev, comment: val }));
                          }}
                          className="w-full px-3 py-1.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-300 resize-none"
                        />
                        <div className="flex justify-end mt-1">
                          <span className={`text-xs ${editFormData.comment.length >= MAX_COMMENT_LENGTH ? 'text-rose-500' : 'text-slate-400'}`}>
                            {editFormData.comment.length}/{MAX_COMMENT_LENGTH}
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => handleUpdate(review.id)}
                          disabled={isSubmitting || !editFormData.comment.trim()}
                          className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-bold shadow-sm hover:shadow-md transition"
                        >
                          {isSubmitting ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-5 flex flex-col h-full">
                    {/* Header: avatar, name, rating */}
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
                        {getInitials(review.userName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-800 text-sm truncate">{review.userName}</p>
                           
                          </div>
                          <div className="flex gap-0.5 flex-shrink-0">
                            {[...Array(5)].map((_, i) =>
                              i < review.rating ? (
                                <StarSolid key={i} className="w-4 h-4 text-amber-500" />
                              ) : (
                                <StarIcon key={i} className="w-4 h-4 text-gray-300" />
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Review content */}
                    <div className="mt-3 flex-1">
                      <div className="max-h-24 overflow-y-auto pr-1 custom-scroll">
                        <p className="text-gray-600 text-xs leading-relaxed break-words whitespace-normal">
                          {review.comment}
                        </p>
                      </div>
                    </div>

                    {/* Footer: date and actions */}
                    <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-100">
                      <span className="text-xs text-gray-500">
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {review.userId === currentUserId && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => startEdit(review)}
                            className="text-emerald-600 hover:text-emerald-800 transition-colors p-1"
                            title="Edit"
                          >
                            <PencilIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ reviewId: review.id, show: true })}
                            className="text-rose-600 hover:text-rose-800 transition-colors p-1"
                            title="Delete"
                          >
                            <TrashIcon className="w-5 h-5" />
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
        <div className="py-20 text-center bg-white/60 backdrop-blur-sm rounded-3xl border border-white/50">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <StarIcon className="w-10 h-10 text-amber-400" />
          </div>
          <p className="text-gray-800 text-xl font-light">No reviews yet</p>
          <p className="text-gray-500 mt-2">Be the first to share your experience 💬</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm.show && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-5 max-w-sm w-full shadow-lg">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Delete review?</h3>
            <p className="text-gray-600 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm({ reviewId: null, show: false })}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
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
  );
}