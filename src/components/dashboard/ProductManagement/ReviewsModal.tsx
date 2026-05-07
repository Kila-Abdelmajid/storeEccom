'use client';

import { useState, useEffect } from 'react';
import { StarIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/solid'; // or use custom SVGs

type Review = { id: number; rating: number; comment: string; userName: string; userEmail: string; createdAt: string };

export default function ReviewsModal({ product, onClose, onReviewDeleted }: any) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchReviews(); }, [product.id]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/DashboardApi/reviews?productId=${product.id}`);
      if (!res.ok) throw new Error();
      setReviews(await res.json());
    } catch { alert('Failed to load reviews'); } finally { setLoading(false); }
  };

  const deleteReview = async (id: number) => {
    if (!confirm('Delete this review?')) return;
    try {
      const res = await fetch(`/api/DashboardApi/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      setReviews(prev => prev.filter(r => r.id !== id));
      if (onReviewDeleted) onReviewDeleted();
    } catch { alert('Delete failed'); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">Reviews for {product.name}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="w-6 h-6" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? <p className="text-center">Loading...</p> : reviews.length === 0 ? <p className="text-center text-gray-400">No reviews yet.</p> : reviews.map(review => (
            <div key={review.id} className="border-b pb-4 last:border-0">
              <div className="flex justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{review.userName}</span>
                    <span className="text-xs text-gray-400">{review.userEmail}</span>
                  </div>
                  <div className="flex text-yellow-500 text-sm mt-1">{Array(5).fill(0).map((_, i) => <StarIcon key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} />)}</div>
                  <p className="text-gray-600 mt-2">{review.comment}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(review.createdAt).toLocaleDateString()}</p>
                </div>
                <button onClick={() => deleteReview(review.id)} className="text-red-500 hover:text-red-700"><TrashIcon className="w-5 h-5" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}