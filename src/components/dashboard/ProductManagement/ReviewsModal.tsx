'use client';

import { useState, useEffect } from 'react';
import { StarIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid';
import { useToast } from '@/contexts/ToastContext';

type Review = { id: number; rating: number; comment: string; userName: string; userEmail: string; createdAt: string };

export default function ReviewsModal({ product, onClose, onReviewDeleted }: any) {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    reviewId: number | null;
  }>({ isOpen: false, reviewId: null });

  useEffect(() => { fetchReviews(); }, [product.id]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/DashboardApi/reviews?productId=${product.id}`);
      if (!res.ok) throw new Error();
      setReviews(await res.json());
    } catch {
      showToast('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteReview = async (id: number) => {
    try {
      const res = await fetch(`/api/DashboardApi/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReviews(prev => prev.filter(r => r.id !== id));
      showToast('Review deleted successfully', 'success');
      if (onReviewDeleted) onReviewDeleted();
    } catch {
      showToast('Delete failed', 'error');
    }
  };

  const openConfirmDialog = (reviewId: number) => {
    setConfirmDialog({ isOpen: true, reviewId });
  };

  const handleConfirmDelete = () => {
    if (confirmDialog.reviewId) {
      deleteReview(confirmDialog.reviewId);
    }
    setConfirmDialog({ isOpen: false, reviewId: null });
  };

  return (
    <>
      {/* Custom Confirmation Dialog */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6 border border-white/50 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <TrashIcon className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">Delete Review</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDialog({ isOpen: false, reviewId: null })}
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

      {/* Main Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col border border-white/50 animate-in fade-in zoom-in duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50/80 to-transparent rounded-t-2xl">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gradient-to-b from-amber-400 to-amber-600 rounded-full" />
              <h2 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                Reviews for {product.name}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <StarIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-400 text-sm">No reviews yet for this product.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="group bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800">{review.userName}</span>
                        <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                          {review.userEmail}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1.5">
                        {Array(5).fill(0).map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'text-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-slate-400 ml-2">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 mt-2 text-sm leading-relaxed">{review.comment}</p>
                    </div>
                    <button
                      onClick={() => openConfirmDialog(review.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-70 group-hover:opacity-100"
                      title="Delete review"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 flex justify-end bg-slate-50/50 rounded-b-2xl">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}